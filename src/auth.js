import crypto from 'node:crypto';
import { db } from './db.js';

const COOKIE = 'veio_sid';
const DURACAO_MS = 7 * 24 * 60 * 60 * 1000;

export function hashSenha(senha) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(senha, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

// Hash fixo usado quando o e-mail não existe, para o login levar o mesmo tempo nos dois casos.
const HASH_FICTICIO = hashSenha(crypto.randomBytes(16).toString('hex'));

export function verificarSenha(senha, armazenado = HASH_FICTICIO) {
  const [saltHex, hashHex] = armazenado.split(':');
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(senha, Buffer.from(saltHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(esperado, calculado);
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function lerCookie(req, nome) {
  for (const parte of (req.headers.cookie || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > 0 && parte.slice(0, i).trim() === nome) {
      return decodeURIComponent(parte.slice(i + 1).trim());
    }
  }
  return null;
}

export function iniciarSessao(res, usuarioId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessoes WHERE expira_em < ?').run(Date.now());
  db.prepare('INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, ?)')
    .run(hashToken(token), usuarioId, Date.now() + DURACAO_MS);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACAO_MS,
    path: '/',
  });
}

export function encerrarSessao(req, res) {
  const token = lerCookie(req, COOKIE);
  if (token) db.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(hashToken(token));
  res.clearCookie(COOKIE, { path: '/' });
}

export function requireAuth(req, res, next) {
  const token = lerCookie(req, COOKIE);
  const sessao = token && db.prepare(`
    SELECT s.expira_em, u.id, u.nome, u.email, u.empresa_id, e.nome AS empresa_nome
    FROM sessoes s
    JOIN usuarios u ON u.id = s.usuario_id
    JOIN empresas e ON e.id = u.empresa_id
    WHERE s.token_hash = ?
  `).get(hashToken(token));

  if (!sessao || sessao.expira_em < Date.now()) {
    if (sessao) db.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(hashToken(token));
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }

  req.usuario = { id: sessao.id, nome: sessao.nome, email: sessao.email };
  req.empresa = { id: sessao.empresa_id, nome: sessao.empresa_nome };
  next();
}
