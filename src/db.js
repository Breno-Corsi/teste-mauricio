import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || path.resolve('data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'veio.db'));

// Etapas da marcenaria, na ordem em que um projeto percorre a fábrica.
export const ETAPAS = [
  'engenharia',
  'producao',
  'montagem_interna',
  'expedicao',
  'montagem_externa',
  'concluido',
];

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS empresas (
    id         INTEGER PRIMARY KEY,
    nome       TEXT NOT NULL,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id          INTEGER PRIMARY KEY,
    empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    senha_hash  TEXT NOT NULL,
    criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessoes (
    token_hash  TEXT PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id            INTEGER PRIMARY KEY,
    empresa_id    INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo          TEXT NOT NULL DEFAULT 'PJ' CHECK (tipo IN ('PF', 'PJ')),
    nome          TEXT NOT NULL,
    documento     TEXT NOT NULL DEFAULT '',
    email         TEXT NOT NULL DEFAULT '',
    telefone      TEXT NOT NULL DEFAULT '',
    contato       TEXT NOT NULL DEFAULT '',
    cep           TEXT NOT NULL DEFAULT '',
    endereco      TEXT NOT NULL DEFAULT '',
    cidade        TEXT NOT NULL DEFAULT '',
    uf            TEXT NOT NULL DEFAULT '',
    observacoes   TEXT NOT NULL DEFAULT '',
    criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);

  CREATE TABLE IF NOT EXISTS projetos (
    id            INTEGER PRIMARY KEY,
    empresa_id    INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id    INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    titulo        TEXT NOT NULL,
    descricao     TEXT NOT NULL DEFAULT '',
    valor         REAL NOT NULL DEFAULT 0,
    prazo         TEXT NOT NULL DEFAULT '',
    etapa         TEXT NOT NULL DEFAULT 'engenharia',
    etapa_desde   TEXT NOT NULL DEFAULT (datetime('now')),
    criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_projetos_empresa ON projetos(empresa_id);
`);

export function transacao(fn) {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
