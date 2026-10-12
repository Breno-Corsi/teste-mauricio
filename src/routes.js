import { Router } from 'express';
import { db, ETAPAS, transacao } from './db.js';
import { hashSenha, verificarSenha, iniciarSessao, encerrarSessao, requireAuth } from './auth.js';
import { consultarCnpj, cnpjValido, normalizarCnpj, ErroCnpj } from './cnpj.js';

export const api = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD

/* ---------- Autenticação ---------- */

api.post('/auth/register', (req, res) => {
  const empresa = texto(req.body.empresa, 120);
  const nome = texto(req.body.nome, 120);
  const email = texto(req.body.email, 160).toLowerCase();
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

  if (!empresa || !nome) return res.status(400).json({ erro: 'Informe o nome da marcenaria e o seu nome.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ erro: 'Informe um e-mail válido.' });
  if (senha.length < 8) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 8 caracteres.' });
  if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
    return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
  }

  const { empresaId, usuarioId } = transacao(() => {
    const empresaId = Number(db.prepare('INSERT INTO empresas (nome) VALUES (?)').run(empresa).lastInsertRowid);
    const usuarioId = Number(db.prepare(
      'INSERT INTO usuarios (empresa_id, nome, email, senha_hash) VALUES (?, ?, ?, ?)'
    ).run(empresaId, nome, email, hashSenha(senha)).lastInsertRowid);
    return { empresaId, usuarioId };
  });

  iniciarSessao(res, usuarioId);
  res.status(201).json({
    usuario: { id: usuarioId, nome, email },
    empresa: { id: empresaId, nome: empresa },
  });
});

api.post('/auth/login', (req, res) => {
  const email = texto(req.body.email, 160).toLowerCase();
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
  const u = db.prepare(`
    SELECT u.id, u.nome, u.email, u.senha_hash, e.id AS empresa_id, e.nome AS empresa_nome
    FROM usuarios u JOIN empresas e ON e.id = u.empresa_id
    WHERE u.email = ?
  `).get(email);

  const ok = verificarSenha(senha, u?.senha_hash);
  if (!u || !ok) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

  iniciarSessao(res, u.id);
  res.json({
    usuario: { id: u.id, nome: u.nome, email: u.email },
    empresa: { id: u.empresa_id, nome: u.empresa_nome },
  });
});

api.post('/auth/logout', (req, res) => {
  encerrarSessao(req, res);
  res.status(204).end();
});

api.get('/auth/me', requireAuth, (req, res) => {
  res.json({ usuario: req.usuario, empresa: req.empresa });
});

/* Tudo abaixo exige login e é isolado pela empresa do usuário. */
api.use(requireAuth);

/* ---------- Painel ---------- */

api.get('/dashboard', (req, res) => {
  const e = req.empresa.id;
  res.json({
    totalClientes: db.prepare('SELECT COUNT(*) AS n FROM clientes WHERE empresa_id = ?').get(e).n,
    porEtapa: db.prepare(`
      SELECT etapa, COUNT(*) AS total, COALESCE(SUM(valor), 0) AS valor
      FROM projetos WHERE empresa_id = ? GROUP BY etapa
    `).all(e),
    atrasados: db.prepare(`
      SELECT COUNT(*) AS n FROM projetos
      WHERE empresa_id = ? AND etapa != 'concluido' AND prazo != '' AND prazo < ?
    `).get(e, hojeLocal()).n,
    proximosPrazos: db.prepare(`
      SELECT p.id, p.titulo, p.prazo, p.etapa, c.nome AS cliente_nome
      FROM projetos p JOIN clientes c ON c.id = p.cliente_id
      WHERE p.empresa_id = ? AND p.etapa != 'concluido' AND p.prazo != ''
      ORDER BY p.prazo LIMIT 6
    `).all(e),
    clientesRecentes: db.prepare(`
      SELECT c.id, c.nome, c.cidade, c.uf,
        (SELECT COUNT(*) FROM projetos p WHERE p.cliente_id = c.id AND p.etapa != 'concluido') AS projetos_ativos
      FROM clientes c WHERE c.empresa_id = ? ORDER BY c.id DESC LIMIT 5
    `).all(e),
  });
});

/* ---------- Clientes ---------- */

const CAMPOS_CLIENTE = {
  tipo: 2, nome: 160, documento: 20, email: 160, telefone: 20, contato: 120,
  cep: 9, endereco: 200, cidade: 100, uf: 2, observacoes: 2000,
};

function lerCliente(body) {
  const c = {};
  for (const [campo, max] of Object.entries(CAMPOS_CLIENTE)) c[campo] = texto(body[campo], max);
  c.tipo = c.tipo === 'PF' ? 'PF' : 'PJ';
  c.uf = c.uf.toUpperCase();
  c.email = c.email.toLowerCase();
  if (!c.nome) return { erro: 'Informe o nome ou a razão social do cliente.' };
  if (c.email && !EMAIL_RE.test(c.email)) return { erro: 'O e-mail do cliente é inválido.' };
  if (c.uf && !/^[A-Z]{2}$/.test(c.uf)) return { erro: 'A UF deve ter 2 letras (ex.: SP).' };
  return { cliente: c };
}

const SELECT_CLIENTE = `
  SELECT c.*,
    (SELECT COUNT(*) FROM projetos p WHERE p.cliente_id = c.id AND p.etapa != 'concluido') AS projetos_ativos,
    (SELECT COUNT(*) FROM projetos p WHERE p.cliente_id = c.id) AS projetos_total
  FROM clientes c
`;
const buscarCliente = (id, empresaId) =>
  db.prepare(`${SELECT_CLIENTE} WHERE c.id = ? AND c.empresa_id = ?`).get(id, empresaId);

api.get('/clientes', (req, res) => {
  const q = texto(req.query.q, 100);
  const like = `%${q}%`;
  res.json(db.prepare(`
    ${SELECT_CLIENTE}
    WHERE c.empresa_id = ?
      AND (? = '' OR c.nome LIKE ? OR c.documento LIKE ? OR c.cidade LIKE ? OR c.email LIKE ? OR c.contato LIKE ?)
    ORDER BY c.nome COLLATE NOCASE
  `).all(req.empresa.id, q, like, like, like, like, like));
});

api.get('/clientes/:id', (req, res) => {
  const c = buscarCliente(Number(req.params.id), req.empresa.id);
  if (!c) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json(c);
});

api.post('/clientes', (req, res) => {
  const { cliente: c, erro } = lerCliente(req.body);
  if (erro) return res.status(400).json({ erro });
  const id = db.prepare(`
    INSERT INTO clientes (empresa_id, tipo, nome, documento, email, telefone, contato, cep, endereco, cidade, uf, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.empresa.id, c.tipo, c.nome, c.documento, c.email, c.telefone, c.contato,
    c.cep, c.endereco, c.cidade, c.uf, c.observacoes).lastInsertRowid;
  res.status(201).json(buscarCliente(Number(id), req.empresa.id));
});

api.put('/clientes/:id', (req, res) => {
  const { cliente: c, erro } = lerCliente(req.body);
  if (erro) return res.status(400).json({ erro });
  const id = Number(req.params.id);
  const { changes } = db.prepare(`
    UPDATE clientes SET tipo = ?, nome = ?, documento = ?, email = ?, telefone = ?, contato = ?,
      cep = ?, endereco = ?, cidade = ?, uf = ?, observacoes = ?, atualizado_em = datetime('now')
    WHERE id = ? AND empresa_id = ?
  `).run(c.tipo, c.nome, c.documento, c.email, c.telefone, c.contato,
    c.cep, c.endereco, c.cidade, c.uf, c.observacoes, id, req.empresa.id);
  if (!changes) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json(buscarCliente(id, req.empresa.id));
});

api.delete('/clientes/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM clientes WHERE id = ? AND empresa_id = ?')
    .run(Number(req.params.id), req.empresa.id);
  if (!changes) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.status(204).end();
});

api.get('/cnpj/:cnpj', async (req, res, next) => {
  const cnpj = normalizarCnpj(req.params.cnpj);
  if (!cnpjValido(cnpj)) return res.status(400).json({ erro: 'CNPJ inválido. Confira os dígitos.' });
  try {
    res.json(await consultarCnpj(cnpj));
  } catch (e) {
    if (e instanceof ErroCnpj) return res.status(e.status).json({ erro: e.message });
    next(e);
  }
});

/* ---------- Projetos (linha de produção) ---------- */

function lerProjeto(body, empresaId) {
  const p = {
    cliente_id: Number(body.cliente_id),
    titulo: texto(body.titulo, 160),
    descricao: texto(body.descricao, 2000),
    valor: Number(String(body.valor ?? '').replace(',', '.')) || 0,
    prazo: texto(body.prazo, 10),
    etapa: texto(body.etapa, 30) || 'engenharia',
  };
  if (!p.titulo) return { erro: 'Informe o título do projeto.' };
  if (!Number.isInteger(p.cliente_id) ||
      !db.prepare('SELECT 1 FROM clientes WHERE id = ? AND empresa_id = ?').get(p.cliente_id, empresaId)) {
    return { erro: 'Selecione um cliente válido.' };
  }
  if (p.valor < 0) return { erro: 'O valor não pode ser negativo.' };
  if (p.prazo && !/^\d{4}-\d{2}-\d{2}$/.test(p.prazo)) return { erro: 'Prazo inválido.' };
  if (!ETAPAS.includes(p.etapa)) return { erro: 'Etapa inválida.' };
  return { projeto: p };
}

const SELECT_PROJETO = `
  SELECT p.*, c.nome AS cliente_nome
  FROM projetos p JOIN clientes c ON c.id = p.cliente_id
`;
const buscarProjeto = (id, empresaId) =>
  db.prepare(`${SELECT_PROJETO} WHERE p.id = ? AND p.empresa_id = ?`).get(id, empresaId);

api.get('/projetos', (req, res) => {
  res.json(db.prepare(`
    ${SELECT_PROJETO} WHERE p.empresa_id = ?
    ORDER BY (p.prazo = ''), p.prazo, p.id DESC
  `).all(req.empresa.id));
});

api.post('/projetos', (req, res) => {
  const { projeto: p, erro } = lerProjeto(req.body, req.empresa.id);
  if (erro) return res.status(400).json({ erro });
  const id = db.prepare(`
    INSERT INTO projetos (empresa_id, cliente_id, titulo, descricao, valor, prazo, etapa)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.empresa.id, p.cliente_id, p.titulo, p.descricao, p.valor, p.prazo, p.etapa).lastInsertRowid;
  res.status(201).json(buscarProjeto(Number(id), req.empresa.id));
});

api.put('/projetos/:id', (req, res) => {
  const { projeto: p, erro } = lerProjeto(req.body, req.empresa.id);
  if (erro) return res.status(400).json({ erro });
  const id = Number(req.params.id);
  const { changes } = db.prepare(`
    UPDATE projetos SET cliente_id = ?, titulo = ?, descricao = ?, valor = ?, prazo = ?,
      etapa_desde = CASE WHEN etapa = ? THEN etapa_desde ELSE datetime('now') END,
      etapa = ?, atualizado_em = datetime('now')
    WHERE id = ? AND empresa_id = ?
  `).run(p.cliente_id, p.titulo, p.descricao, p.valor, p.prazo, p.etapa, p.etapa, id, req.empresa.id);
  if (!changes) return res.status(404).json({ erro: 'Projeto não encontrado.' });
  res.json(buscarProjeto(id, req.empresa.id));
});

api.patch('/projetos/:id/etapa', (req, res) => {
  const etapa = texto(req.body.etapa, 30);
  if (!ETAPAS.includes(etapa)) return res.status(400).json({ erro: 'Etapa inválida.' });
  const id = Number(req.params.id);
  db.prepare(`
    UPDATE projetos SET etapa = ?, etapa_desde = datetime('now'), atualizado_em = datetime('now')
    WHERE id = ? AND empresa_id = ? AND etapa != ?
  `).run(etapa, id, req.empresa.id, etapa);
  const projeto = buscarProjeto(id, req.empresa.id);
  if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado.' });
  res.json(projeto);
});

api.delete('/projetos/:id', (req, res) => {
  const { changes } = db.prepare('DELETE FROM projetos WHERE id = ? AND empresa_id = ?')
    .run(Number(req.params.id), req.empresa.id);
  if (!changes) return res.status(404).json({ erro: 'Projeto não encontrado.' });
  res.status(204).end();
});
