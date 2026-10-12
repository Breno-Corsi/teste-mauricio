// Consulta de CNPJ na BrasilAPI (dados públicos da Receita Federal, sem chave de acesso).

const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

export class ErroCnpj extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

// Aceita o CNPJ numérico e o alfanumérico (letras nas 12 primeiras posições).
export const normalizarCnpj = (v) => String(v ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');

export function cnpjValido(c) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const dv = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += (c.charCodeAt(i) - 48) * (((n - 1 - i) % 8) + 2);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const capitalizar = (s) => (s || '').toLowerCase()
  .replace(/\S+/g, (p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p[0].toUpperCase() + p.slice(1)));

function formatarTelefone(t) {
  const d = (t || '').replace(/\D/g, '');
  return d.length < 10 ? '' : `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}`;
}

function montarEndereco(j) {
  const tipo = j.descricao_tipo_de_logradouro || '';
  const jaTemTipo = ` ${(j.logradouro || '').toUpperCase()} `.includes(` ${tipo.toUpperCase()} `);
  const logradouro = tipo && !jaTemTipo
    ? `${tipo} ${j.logradouro || ''}`
    : j.logradouro || '';
  if (!logradouro.trim()) return '';
  const numero = j.numero && j.numero !== 'SN' ? j.numero : 's/n';
  return [`${capitalizar(logradouro)}, ${numero}`, capitalizar(j.complemento), capitalizar(j.bairro)]
    .filter(Boolean).join(' - ').slice(0, 200);
}

export async function consultarCnpj(cnpj) {
  const emCache = cache.get(cnpj);
  if (emCache && emCache.expira > Date.now()) return emCache.dados;

  let res;
  try {
    res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      // A BrasilAPI recusa (403) requisições sem User-Agent.
      headers: { Accept: 'application/json', 'User-Agent': 'Veio/0.1 (+https://github.com/Breno-Corsi/teste-mauricio)' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ErroCnpj(504, 'A consulta de CNPJ não respondeu. Tente de novo ou preencha manualmente.');
  }
  if (res.status === 404) throw new ErroCnpj(404, 'CNPJ não encontrado na Receita Federal.');
  if (res.status === 429) throw new ErroCnpj(429, 'Muitas consultas seguidas. Aguarde um instante e tente de novo.');
  if (!res.ok) throw new ErroCnpj(502, 'O serviço de consulta de CNPJ está indisponível no momento.');

  const j = await res.json();
  const cep = (j.cep || '').replace(/\D/g, '');
  const dados = {
    nome: (j.razao_social || '').trim(),
    nome_fantasia: capitalizar(j.nome_fantasia),
    email: (j.email || '').trim().toLowerCase(),
    telefone: formatarTelefone(j.ddd_telefone_1) || formatarTelefone(j.ddd_telefone_2),
    cep: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : '',
    endereco: montarEndereco(j),
    cidade: capitalizar(j.municipio),
    uf: (j.uf || '').toUpperCase(),
    situacao: j.descricao_situacao_cadastral || '',
  };
  cache.set(cnpj, { dados, expira: Date.now() + CACHE_MS });
  return dados;
}
