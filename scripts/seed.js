// Cria uma conta de demonstração com clientes e projetos em todas as etapas.
import { db, transacao } from '../src/db.js';
import { hashSenha } from '../src/auth.js';

const EMAIL = 'demo@veio.app';
const SENHA = 'demo1234';

if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(EMAIL)) {
  console.log(`A conta demo já existe: ${EMAIL} / ${SENHA}`);
  process.exit(0);
}

const dia = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
};

const CLIENTES = [
  ['PJ', 'Construtora Horizonte Ltda', '12.345.678/0001-90', 'Fernanda Lima', 'compras@horizonte.com.br', '(11) 3456-7890', 'São Paulo', 'SP'],
  ['PJ', 'Hotel Vila Serena', '23.456.789/0001-01', 'Paulo Andrade', 'obras@vilaserena.com.br', '(12) 3662-1100', 'Campos do Jordão', 'SP'],
  ['PJ', 'Clínica Odonto Prime', '34.567.890/0001-12', 'Dra. Juliana Reis', 'adm@odontoprime.com.br', '(19) 3232-4545', 'Campinas', 'SP'],
  ['PF', 'Ricardo e Ana Moreira', '123.456.789-09', 'Ana Moreira', 'ana.moreira@email.com', '(41) 99876-5432', 'Curitiba', 'PR'],
  ['PJ', 'Altamira Advogados Associados', '45.678.901/0001-23', 'Marcos Tavares', 'facilities@altamira.adv.br', '(31) 3555-8080', 'Belo Horizonte', 'MG'],
  ['PJ', 'Restaurante Brasa & Lenha', '56.789.012/0001-34', 'Chef Rodrigo', 'contato@brasaelenha.com.br', '(16) 3610-2020', 'Ribeirão Preto', 'SP'],
];

// [título, índice do cliente, etapa, valor, prazo (dias a partir de hoje), dias na etapa]
const PROJETOS = [
  ['Cozinhas — Torre A (24 unidades)', 0, 'producao', 186000, 25, 6],
  ['Armários de banheiro — Torre A', 0, 'engenharia', 72000, 48, 2],
  ['Recepção com painel ripado', 1, 'montagem_externa', 54000, 3, 4],
  ['Mobiliário dos 18 quartos', 1, 'montagem_interna', 238000, 14, 3],
  ['Bancadas e armários dos consultórios', 2, 'expedicao', 41000, 2, 1],
  ['Cozinha planejada e closet', 3, 'engenharia', 38500, 30, 0],
  ['Home theater em freijó', 3, 'producao', 16800, -2, 9],
  ['Estações de trabalho e sala de reunião', 4, 'montagem_interna', 67000, 9, 5],
  ['Painéis acústicos do salão', 5, 'expedicao', 22400, 5, 2],
  ['Balcão do bar e adega', 5, 'concluido', 29000, -10, 12],
];

transacao(() => {
  const empresaId = db.prepare('INSERT INTO empresas (nome) VALUES (?)').run('Marcenaria Demonstração').lastInsertRowid;
  db.prepare('INSERT INTO usuarios (empresa_id, nome, email, senha_hash) VALUES (?, ?, ?, ?)')
    .run(empresaId, 'Usuário Demo', EMAIL, hashSenha(SENHA));

  const insCliente = db.prepare(`
    INSERT INTO clientes (empresa_id, tipo, nome, documento, contato, email, telefone, cidade, uf)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const ids = CLIENTES.map((c) => insCliente.run(empresaId, ...c).lastInsertRowid);

  const insProjeto = db.prepare(`
    INSERT INTO projetos (empresa_id, cliente_id, titulo, valor, prazo, etapa, etapa_desde)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);
  for (const [titulo, cli, etapa, valor, prazo, diasNaEtapa] of PROJETOS) {
    insProjeto.run(empresaId, ids[cli], titulo, valor, dia(prazo), etapa, `-${diasNaEtapa} days`);
  }
});

console.log(`Conta demo criada: ${EMAIL} / ${SENHA}`);
