/* Veio — SPA simples, sem build. Rotas por hash: #/login, #/cadastro, #/painel, #/fluxo, #/clientes */

const ETAPAS = [
  { id: 'engenharia', nome: 'Engenharia', desc: 'Projeto, medição e lista de corte', cor: '#3f6fa3', icone: 'regua' },
  { id: 'producao', nome: 'Produção', desc: 'Corte, fita de borda e usinagem', cor: '#c0702c', icone: 'serra' },
  { id: 'montagem_interna', nome: 'Montagem interna', desc: 'Pré-montagem e conferência na fábrica', cor: '#7b5a3c', icone: 'martelo' },
  { id: 'expedicao', nome: 'Expedição', desc: 'Embalagem, carga e transporte', cor: '#55794a', icone: 'caminhao' },
  { id: 'montagem_externa', nome: 'Montagem externa', desc: 'Instalação na obra do cliente', cor: '#a3473f', icone: 'casa' },
  { id: 'concluido', nome: 'Concluído', desc: 'Entregue e aprovado', cor: '#4b463f', icone: 'check' },
];
const ETAPAS_FABRICA = ETAPAS.slice(0, 5);

const NAV = [
  { rota: '/painel', nome: 'Painel', icone: 'painel' },
  { rota: '/fluxo', nome: 'Linha de produção', icone: 'fluxo' },
  { rota: '/clientes', nome: 'Clientes', icone: 'clientes' },
];

const ICONES = {
  regua: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7.5 12.5 2 2M10.5 9.5l2 2M13.5 6.5l2 2"/>',
  serra: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  martelo: '<path d="m15 12-8.4 8.4a2 2 0 0 1-2.8-2.8L12.2 9"/><path d="M17.6 15 22 10.6l-4.3-4.3a6 6 0 0 0-4.2-1.8H9l1 .9a6.6 6.6 0 0 1 2.2 4.9V11l2.6 2.6"/>',
  caminhao: '<path d="M2 5h12v11H2z"/><path d="M14 9h4l4 4v3h-8"/><circle cx="6.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  casa: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-7h6v7"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  fluxo: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sair: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  esquerda: '<path d="m15 6-6 6 6 6"/>',
  direita: '<path d="m9 6 6 6-6 6"/>',
};

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#b5652a"/><path d="M5 11c6-3 16-3 22 0M5 21c6 3 16 3 22 0" stroke="#fff" stroke-opacity=".3" stroke-width="1.5" fill="none"/><path d="m9.5 9 6.5 14 6.5-14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const state = { usuario: null, empresa: null };
const app = document.getElementById('app');

/* ---------- Utilitários ---------- */

const $ = (sel, el = document) => el.querySelector(sel);
const icone = (nome, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome]}</svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtMoeda = (v) => moeda.format(v || 0);
const fmtData = (iso) => (iso ? iso.split('-').reverse().join('/') : '');
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const vencido = (p) => Boolean(p.prazo) && p.etapa !== 'concluido' && p.prazo < hojeISO();
const etapa = (id) => ETAPAS.find((e) => e.id === id) || ETAPAS[0];
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const iniciais = (nome) => nome.trim().split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p[0])).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const irPara = (rota) => { location.hash = '#' + rota; };

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function tempoNaEtapa(p) {
  if (p.etapa === 'concluido') return 'Entregue';
  const desde = new Date(p.etapa_desde.replace(' ', 'T') + 'Z');
  const dias = Math.max(0, Math.floor((Date.now() - desde) / 86_400_000));
  return dias === 0 ? 'Entrou hoje' : `Há ${plural(dias, 'dia', 'dias')} na etapa`;
}

async function api(caminho, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + caminho, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 401 && !caminho.startsWith('/auth/')) {
    state.usuario = null;
    irPara('/login');
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  const dados = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(dados?.erro || 'Algo deu errado. Tente novamente.');
  return dados;
}

function toast(msg, tipo = 'ok') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('saindo'), 2800);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- Campos de formulário ---------- */

function field({ name, label, type = 'text', value = '', attrs = '', hint = '', cls = '' }) {
  const id = 'f-' + name;
  const controle = type === 'textarea'
    ? `<textarea id="${id}" name="${name}" ${attrs}>${esc(value)}</textarea>`
    : `<input id="${id}" name="${name}" type="${type}" value="${esc(value)}" ${attrs}>`;
  return `<label class="field ${cls}" for="${id}"><span>${label}</span>${controle}${hint ? `<small>${hint}</small>` : ''}</label>`;
}

function selectField({ name, label, options, value, cls = '' }) {
  const opts = options.map((o) =>
    `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  return `<label class="field ${cls}" for="f-${name}"><span>${label}</span><select id="f-${name}" name="${name}">${opts}</select></label>`;
}

const MASCARAS = {
  doc(v) {
    const d = v.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 11) {
      return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  },
  tel(v) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    const meio = d.length > 10 ? 5 : 4;
    return `(${d.slice(0, 2)}) ${d.slice(2, 2 + meio)}${d.length > 2 + meio ? '-' + d.slice(2 + meio) : ''}`;
  },
  cep(v) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  },
};

function aplicarMascaras(raiz) {
  raiz.querySelectorAll('[data-mask]').forEach((input) => {
    input.addEventListener('input', () => { input.value = MASCARAS[input.dataset.mask](input.value); });
  });
}

/* ---------- Modal e confirmação ---------- */

function modal({ titulo, corpo, botao = 'Salvar', onSubmit, extraAcoes = '', classe = '', aoAbrir }) {
  const dlg = document.createElement('dialog');
  dlg.className = `modal ${classe}`;
  dlg.innerHTML = `
    <form novalidate>
      <header class="modal-head">
        <h2>${titulo}</h2>
        <button type="button" class="btn-icon" data-fechar aria-label="Fechar">${icone('x')}</button>
      </header>
      <div class="modal-body">${corpo}<p class="form-erro" role="alert" hidden></p></div>
      <footer class="modal-foot">
        ${extraAcoes}<span class="spacer"></span>
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="submit" class="btn btn-primary">${botao}</button>
      </footer>
    </form>`;
  document.body.append(dlg);

  const form = $('form', dlg);
  const fechar = () => dlg.close();
  dlg.addEventListener('close', () => dlg.remove());
  dlg.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', fechar));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const enviar = $('[type=submit]', form);
    const erro = $('.form-erro', form);
    enviar.disabled = true;
    erro.hidden = true;
    try {
      await onSubmit(Object.fromEntries(new FormData(form)));
      fechar();
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
    } finally {
      enviar.disabled = false;
    }
  });

  aplicarMascaras(form);
  aoAbrir?.(dlg, fechar);
  dlg.showModal();
  return { dlg, fechar };
}

function confirmar(mensagemHtml, botao = 'Excluir') {
  return new Promise((resolve) => {
    let ok = false;
    const { dlg } = modal({
      titulo: 'Tem certeza?',
      corpo: `<p>${mensagemHtml}</p>`,
      botao,
      classe: 'modal-sm',
      onSubmit: async () => { ok = true; },
    });
    $('[type=submit]', dlg).classList.replace('btn-primary', 'btn-danger');
    dlg.addEventListener('close', () => resolve(ok));
  });
}

/* ---------- Login e cadastro ---------- */

function renderAuth(cadastro) {
  document.title = `${cadastro ? 'Criar conta' : 'Entrar'} · Veio`;
  app.innerHTML = `
    <div class="auth">
      <aside class="auth-brand">
        <a class="brand brand-light" href="#/login">${LOGO}<span>VEIO</span></a>
        <div class="auth-pitch">
          <p class="eyebrow">Gestão para marcenaria industrial</p>
          <h1>Do projeto à instalação, cada peça no seu lugar.</h1>
          <ol class="auth-flow">
            ${ETAPAS_FABRICA.map((e, i) => `
              <li style="--c:${e.cor}">
                <span class="auth-flow-ic">${icone(e.icone)}</span>
                <div><strong>${String(i + 1).padStart(2, '0')} · ${e.nome}</strong><small>${e.desc}</small></div>
              </li>`).join('')}
          </ol>
        </div>
        <p class="auth-foot">© ${new Date().getFullYear()} Veio</p>
      </aside>
      <main class="auth-main">
        <form class="auth-card" id="form-auth" novalidate>
          <div>
            <h2>${cadastro ? 'Crie a conta da sua marcenaria' : 'Bem-vindo de volta'}</h2>
          </div>
          <p class="muted">${cadastro
            ? 'Leva menos de um minuto. Você será o administrador da conta.'
            : 'Entre para acompanhar clientes e a linha de produção.'}</p>
          ${cadastro ? field({ name: 'empresa', label: 'Nome da marcenaria', attrs: 'autocomplete="organization" required' }) : ''}
          ${cadastro ? field({ name: 'nome', label: 'Seu nome', attrs: 'autocomplete="name" required' }) : ''}
          ${field({ name: 'email', label: 'E-mail', type: 'email', attrs: 'autocomplete="email" required' })}
          ${field({
            name: 'senha', label: 'Senha', type: 'password',
            attrs: `autocomplete="${cadastro ? 'new-password' : 'current-password'}" required ${cadastro ? 'minlength="8"' : ''}`,
            hint: cadastro ? 'Mínimo de 8 caracteres.' : '',
          })}
          <p class="form-erro" role="alert" hidden></p>
          <button class="btn btn-primary btn-block" type="submit">${cadastro ? 'Criar conta' : 'Entrar'}</button>
          <p class="auth-switch">${cadastro
            ? 'Já tem conta? <a href="#/login">Entrar</a>'
            : 'Ainda não tem conta? <a href="#/cadastro">Cadastre sua marcenaria</a>'}</p>
        </form>
      </main>
    </div>`;

  const form = $('#form-auth');
  $('input', form).focus();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const erro = $('.form-erro', form);
    const botao = $('[type=submit]', form);
    erro.hidden = true;
    botao.disabled = true;
    try {
      const r = await api(cadastro ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: Object.fromEntries(new FormData(form)),
      });
      state.usuario = r.usuario;
      state.empresa = r.empresa;
      irPara('/painel');
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
      botao.disabled = false;
    }
  });
}

/* ---------- Estrutura do app ---------- */

function montarShell(rota) {
  if (!$('.shell')) {
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <a class="brand" href="#/painel">${LOGO}<span>VEIO</span></a>
          <nav class="nav" aria-label="Principal">
            ${NAV.map((n) => `<a href="#${n.rota}" data-rota="${n.rota}">${icone(n.icone)}<span>${n.nome}</span></a>`).join('')}
          </nav>
          <div class="sidebar-etapas">
            <p>Etapas da fábrica</p>
            <ol>${ETAPAS_FABRICA.map((e) => `<li style="--c:${e.cor}"><i></i>${e.nome}</li>`).join('')}</ol>
          </div>
          <div class="sidebar-foot">Marcenaria<strong>${esc(state.empresa.nome)}</strong></div>
        </aside>
        <div class="main">
          <header class="topbar">
            <a class="brand brand-mobile" href="#/painel">${LOGO}<span>VEIO</span></a>
            <span class="spacer"></span>
            <div class="user-chip">
              <span class="avatar">${esc(iniciais(state.usuario.nome))}</span>
              <div><strong>${esc(state.usuario.nome)}</strong><small>${esc(state.usuario.email)}</small></div>
            </div>
            <button class="btn-icon" id="sair" title="Sair" aria-label="Sair">${icone('sair')}</button>
          </header>
          <main id="conteudo"></main>
        </div>
      </div>`;
    $('#sair').addEventListener('click', async () => {
      try { await api('/auth/logout', { method: 'POST' }); } catch { /* sai mesmo assim */ }
      state.usuario = state.empresa = null;
      irPara('/login');
    });
  }
  document.querySelectorAll('.nav a').forEach((a) => {
    const ativo = a.dataset.rota === rota;
    a.classList.toggle('ativo', ativo);
    if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.title = `${NAV.find((n) => n.rota === rota)?.nome || 'Veio'} · Veio`;
}

/* ---------- Painel ---------- */

async function viewPainel(el) {
  const d = await api('/dashboard');
  const porEtapa = Object.fromEntries(d.porEtapa.map((r) => [r.etapa, r]));
  const ativos = ETAPAS_FABRICA.reduce((s, e) => s + (porEtapa[e.id]?.total || 0), 0);
  const carteira = ETAPAS_FABRICA.reduce((s, e) => s + (porEtapa[e.id]?.valor || 0), 0);
  const maior = Math.max(1, ...ETAPAS_FABRICA.map((e) => porEtapa[e.id]?.total || 0));
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  el.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">${esc(hoje)}</p>
        <h1>${saudacao()}, ${esc(state.usuario.nome.split(' ')[0])}</h1>
      </div>
      <div class="page-actions">
        <a class="btn" href="#/clientes?novo=1">${icone('mais')}Novo cliente</a>
        <a class="btn btn-primary" href="#/fluxo?novo=1">${icone('mais')}Novo projeto</a>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi"><span>Clientes cadastrados</span><strong>${d.totalClientes}</strong></div>
      <div class="kpi"><span>Projetos em andamento</span><strong>${ativos}</strong></div>
      <div class="kpi"><span>Carteira na fábrica</span><strong>${fmtMoeda(carteira)}</strong></div>
      <div class="kpi ${d.atrasados ? 'kpi-alerta' : ''}"><span>Prazos vencidos</span><strong>${d.atrasados}</strong></div>
    </div>

    <section class="card">
      <header class="card-head">
        <h2>Linha de produção</h2>
        <a href="#/fluxo">Abrir quadro →</a>
      </header>
      <div class="pipeline">
        ${ETAPAS_FABRICA.map((e, i) => {
          const r = porEtapa[e.id] || { total: 0, valor: 0 };
          return `
            <a class="stage" href="#/fluxo" style="--c:${e.cor}">
              <div class="stage-top"><span class="stage-ic">${icone(e.icone)}</span><span class="stage-num">${String(i + 1).padStart(2, '0')}</span></div>
              <strong>${e.nome}</strong>
              <span class="stage-count">${r.total}</span>
              <small>${r.total ? fmtMoeda(r.valor) : 'Nenhum projeto'}</small>
              <div class="stage-bar"><i style="width:${(r.total / maior) * 100}%"></i></div>
            </a>`;
        }).join('')}
      </div>
    </section>

    <div class="grid-2">
      <section class="card">
        <header class="card-head"><h2>Próximos prazos</h2><a href="#/fluxo">Ver todos →</a></header>
        ${d.proximosPrazos.length ? `
          <ul class="lista">
            ${d.proximosPrazos.map((p) => {
              const e = etapa(p.etapa);
              return `
                <li>
                  <div class="grow"><strong>${esc(p.titulo)}</strong><small>${esc(p.cliente_nome)}</small></div>
                  <span class="pill" style="--c:${e.cor}">${e.nome}</span>
                  <span class="prazo ${vencido(p) ? 'vencido' : ''}">${fmtData(p.prazo)}</span>
                </li>`;
            }).join('')}
          </ul>` : vazio('calendario', 'Nenhum prazo pela frente', 'Projetos com data de entrega aparecem aqui.', true)}
      </section>
      <section class="card">
        <header class="card-head"><h2>Clientes recentes</h2><a href="#/clientes">Ver todos →</a></header>
        ${d.clientesRecentes.length ? `
          <ul class="lista">
            ${d.clientesRecentes.map((c) => `
              <li>
                <span class="avatar">${esc(iniciais(c.nome))}</span>
                <div class="grow"><strong>${esc(c.nome)}</strong><small>${esc([c.cidade, c.uf].filter(Boolean).join(' / ') || 'Cidade não informada')}</small></div>
                <a class="prazo" href="#/fluxo?cliente=${c.id}">${plural(c.projetos_ativos, 'projeto ativo', 'projetos ativos')}</a>
              </li>`).join('')}
          </ul>` : vazio('clientes', 'Nenhum cliente ainda', 'Cadastre seu primeiro cliente para começar.', true)}
      </section>
    </div>`;
}

function vazio(ic, titulo, texto, compacto = false, acao = '') {
  return `<div class="vazio ${compacto ? 'compacto' : ''}">
    <span class="vazio-ic">${icone(ic)}</span><h3>${titulo}</h3><p>${texto}</p>${acao}
  </div>`;
}

/* ---------- Clientes ---------- */

async function viewClientes(el, params) {
  el.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Cadastro</p><h1>Clientes</h1></div>
      <button class="btn btn-primary" id="novo">${icone('mais')}Novo cliente</button>
    </div>
    <div class="toolbar">
      <div class="search">${icone('busca')}<input type="search" id="busca" placeholder="Buscar por nome, CPF/CNPJ, cidade, e-mail…" aria-label="Buscar clientes"></div>
      <span class="muted" id="contagem"></span>
    </div>
    <div id="lista"><div class="carregando">Carregando…</div></div>`;

  const busca = $('#busca', el);
  const lista = $('#lista', el);
  let clientes = [];

  const carregar = async () => {
    clientes = await api('/clientes?q=' + encodeURIComponent(busca.value.trim()));
    desenhar();
  };

  const desenhar = () => {
    $('#contagem', el).textContent = plural(clientes.length, 'cliente', 'clientes');
    if (!clientes.length) {
      lista.innerHTML = `<div class="card">${busca.value.trim()
        ? vazio('busca', 'Nada encontrado', 'Nenhum cliente corresponde a essa busca.')
        : vazio('clientes', 'Cadastre seu primeiro cliente', 'Construtoras, lojistas, arquitetos ou clientes finais — todos ficam organizados aqui.', false,
          `<button class="btn btn-primary" data-novo>${icone('mais')}Novo cliente</button>`)}</div>`;
      return;
    }
    lista.innerHTML = `
      <div class="table-wrap">
        <table class="tabela">
          <thead><tr><th>Cliente</th><th>Contato</th><th>Cidade</th><th>Projetos ativos</th><th aria-label="Ações"></th></tr></thead>
          <tbody>
            ${clientes.map((c) => `
              <tr>
                <td data-label="Cliente">
                  <div class="cell-main">
                    <span class="avatar">${esc(iniciais(c.nome))}</span>
                    <div><strong>${esc(c.nome)}<span class="badge">${c.tipo}</span></strong><small>${esc(c.documento || 'Sem documento')}</small></div>
                  </div>
                </td>
                <td data-label="Contato">${esc(c.contato || '—')}<small>${esc([c.email, c.telefone].filter(Boolean).join(' · '))}</small></td>
                <td data-label="Cidade">${esc([c.cidade, c.uf].filter(Boolean).join(' / ') || '—')}</td>
                <td data-label="Projetos ativos"><a class="num" href="#/fluxo?cliente=${c.id}" title="Ver na linha de produção">${c.projetos_ativos}</a></td>
                <td class="acoes">
                  <button class="btn-icon" data-editar="${c.id}" title="Editar" aria-label="Editar ${esc(c.nome)}">${icone('editar')}</button>
                  <button class="btn-icon danger" data-excluir="${c.id}" title="Excluir" aria-label="Excluir ${esc(c.nome)}">${icone('lixo')}</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  };

  const novo = () => abrirFormCliente(null, carregar);
  $('#novo', el).addEventListener('click', novo);

  let espera;
  busca.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => carregar().catch((e) => toast(e.message, 'erro')), 200);
  });

  lista.addEventListener('click', async (ev) => {
    if (ev.target.closest('[data-novo]')) return novo();
    const editar = ev.target.closest('[data-editar]');
    const excluir = ev.target.closest('[data-excluir]');
    const id = Number((editar || excluir)?.dataset.editar || (editar || excluir)?.dataset.excluir);
    const c = clientes.find((x) => x.id === id);
    if (!c) return;
    if (editar) return abrirFormCliente(c, carregar);

    const aviso = c.projetos_total
      ? ` Os <strong>${plural(c.projetos_total, 'projeto', 'projetos')}</strong> dele também serão removidos.`
      : '';
    if (!await confirmar(`Excluir o cliente <strong>${esc(c.nome)}</strong>?${aviso} Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/clientes/${c.id}`, { method: 'DELETE' });
      toast('Cliente excluído.');
      await carregar();
    } catch (e) {
      toast(e.message, 'erro');
    }
  });

  await carregar();
  if (params.get('novo')) {
    history.replaceState(null, '', '#/clientes');
    novo();
  }
}

function abrirFormCliente(cliente, aoSalvar) {
  const c = cliente || { tipo: 'PJ' };
  modal({
    titulo: cliente ? 'Editar cliente' : 'Novo cliente',
    botao: cliente ? 'Salvar alterações' : 'Cadastrar cliente',
    corpo: `
      <div class="segmented" role="radiogroup" aria-label="Tipo de cliente">
        <label><input type="radio" name="tipo" value="PJ" ${c.tipo !== 'PF' ? 'checked' : ''}><span>Pessoa jurídica</span></label>
        <label><input type="radio" name="tipo" value="PF" ${c.tipo === 'PF' ? 'checked' : ''}><span>Pessoa física</span></label>
      </div>
      <div class="form-grid">
        ${field({ name: 'nome', label: 'Nome / Razão social', value: c.nome, cls: 'span-2', attrs: 'required maxlength="160" autofocus' })}
        ${field({ name: 'documento', label: 'CPF / CNPJ', value: c.documento, attrs: 'data-mask="doc" inputmode="numeric"' })}
        ${field({ name: 'contato', label: 'Pessoa de contato', value: c.contato, attrs: 'maxlength="120"' })}
        ${field({ name: 'email', label: 'E-mail', type: 'email', value: c.email, attrs: 'maxlength="160"' })}
        ${field({ name: 'telefone', label: 'Telefone', type: 'tel', value: c.telefone, attrs: 'data-mask="tel"' })}
        ${field({ name: 'cep', label: 'CEP', value: c.cep, attrs: 'data-mask="cep" inputmode="numeric"' })}
        ${field({ name: 'endereco', label: 'Endereço', value: c.endereco, attrs: 'maxlength="200"' })}
        ${field({ name: 'cidade', label: 'Cidade', value: c.cidade, attrs: 'maxlength="100"' })}
        ${field({ name: 'uf', label: 'UF', value: c.uf, attrs: 'maxlength="2" style="text-transform:uppercase"' })}
        ${field({ name: 'observacoes', label: 'Observações', type: 'textarea', value: c.observacoes, cls: 'span-2', attrs: 'maxlength="2000" placeholder="Arquiteto responsável, condições comerciais, acesso à obra…"' })}
      </div>`,
    onSubmit: async (dados) => {
      await api(cliente ? `/clientes/${cliente.id}` : '/clientes', { method: cliente ? 'PUT' : 'POST', body: dados });
      toast(cliente ? 'Cliente atualizado.' : 'Cliente cadastrado.');
      await aoSalvar?.();
    },
  });
}

/* ---------- Linha de produção (quadro) ---------- */

async function viewFluxo(el, params) {
  const [projetos, clientes] = await Promise.all([api('/projetos'), api('/clientes')]);

  el.innerHTML = `
    <div class="page-head">
      <div><p class="eyebrow">Engenharia → Montagem externa</p><h1>Linha de produção</h1></div>
      <button class="btn btn-primary" id="novo">${icone('mais')}Novo projeto</button>
    </div>
    <div class="toolbar">
      <div class="search">${icone('busca')}<input type="search" id="busca" placeholder="Buscar projeto ou cliente…" aria-label="Buscar projetos"></div>
      <select class="select" id="filtro" aria-label="Filtrar por cliente">
        <option value="">Todos os clientes</option>
        ${clientes.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}
      </select>
      <span class="muted" id="resumo"></span>
    </div>
    <div class="board" id="board"></div>`;

  const board = $('#board', el);
  const busca = $('#busca', el);
  const filtro = $('#filtro', el);
  filtro.value = params.get('cliente') || '';

  const cartao = (p) => {
    const i = ETAPAS.findIndex((e) => e.id === p.etapa);
    const atrasado = vencido(p);
    return `
      <article class="pcard" draggable="true" tabindex="0" data-id="${p.id}" aria-label="${esc(p.titulo)}">
        <p class="pcard-cliente">${esc(p.cliente_nome)}</p>
        <h3>${esc(p.titulo)}</h3>
        <div class="pcard-meta">
          ${p.prazo ? `<span class="tag ${atrasado ? 'tag-alerta' : ''}" title="${atrasado ? 'Prazo vencido' : 'Prazo de entrega'}">${icone('calendario')}${fmtData(p.prazo)}</span>` : ''}
          ${p.valor ? `<span class="tag">${fmtMoeda(p.valor)}</span>` : ''}
        </div>
        <footer class="pcard-foot">
          <small>${tempoNaEtapa(p)}</small>
          <span class="pcard-nav">
            <button class="btn-icon sm" data-mover="-1" ${i === 0 ? 'disabled' : ''} title="Voltar para ${i > 0 ? ETAPAS[i - 1].nome : ''}" aria-label="Voltar etapa">${icone('esquerda')}</button>
            <button class="btn-icon sm" data-mover="1" ${i === ETAPAS.length - 1 ? 'disabled' : ''} title="Avançar para ${ETAPAS[i + 1]?.nome || ''}" aria-label="Avançar etapa">${icone('direita')}</button>
          </span>
        </footer>
      </article>`;
  };

  const desenhar = () => {
    const termo = busca.value.trim().toLowerCase();
    const visiveis = projetos.filter((p) =>
      (!filtro.value || String(p.cliente_id) === filtro.value) &&
      (!termo || `${p.titulo} ${p.cliente_nome}`.toLowerCase().includes(termo)));
    $('#resumo', el).textContent = plural(visiveis.length, 'projeto', 'projetos');

    board.innerHTML = ETAPAS.map((e) => {
      const itens = visiveis.filter((p) => p.etapa === e.id);
      const total = itens.reduce((s, p) => s + (p.valor || 0), 0);
      return `
        <section class="col" data-etapa="${e.id}" style="--c:${e.cor}" aria-label="${e.nome}">
          <header class="col-head">
            <span class="col-ic">${icone(e.icone)}</span>
            <div><strong>${e.nome}</strong><small>${e.desc}</small></div>
            <span class="col-count">${itens.length}</span>
          </header>
          ${total ? `<div class="col-total">${fmtMoeda(total)} nesta etapa</div>` : ''}
          <div class="col-body">
            ${itens.map(cartao).join('') || '<p class="col-vazia">Arraste projetos para cá</p>'}
          </div>
        </section>`;
    }).join('');
  };

  async function moverPara(p, novaEtapa) {
    if (p.etapa === novaEtapa) return;
    const anterior = { etapa: p.etapa, etapa_desde: p.etapa_desde };
    Object.assign(p, { etapa: novaEtapa, etapa_desde: new Date().toISOString().slice(0, 19).replace('T', ' ') });
    desenhar();
    try {
      Object.assign(p, await api(`/projetos/${p.id}/etapa`, { method: 'PATCH', body: { etapa: novaEtapa } }));
      toast(`“${p.titulo}” → ${etapa(novaEtapa).nome}`);
    } catch (e) {
      Object.assign(p, anterior);
      desenhar();
      toast(e.message, 'erro');
    }
  }

  const abrir = (p) => abrirFormProjeto({
    projeto: p,
    clientes,
    aoSalvar: (r) => { Object.assign(p, r); desenhar(); },
    aoExcluir: () => { projetos.splice(projetos.indexOf(p), 1); desenhar(); },
  });

  const novo = () => {
    if (!clientes.length) {
      toast('Cadastre um cliente antes de criar um projeto.', 'erro');
      return irPara('/clientes?novo=1');
    }
    abrirFormProjeto({ clientes, clienteId: filtro.value, aoSalvar: (r) => { projetos.push(r); desenhar(); } });
  };

  const projetoDo = (elemento) => projetos.find((x) => String(x.id) === elemento?.closest('.pcard')?.dataset.id);

  $('#novo', el).addEventListener('click', novo);
  busca.addEventListener('input', desenhar);
  filtro.addEventListener('change', desenhar);

  board.addEventListener('click', (ev) => {
    const p = projetoDo(ev.target);
    if (!p) return;
    const mover = ev.target.closest('[data-mover]');
    if (mover) {
      const destino = ETAPAS[ETAPAS.findIndex((e) => e.id === p.etapa) + Number(mover.dataset.mover)];
      if (destino) moverPara(p, destino.id);
      return;
    }
    abrir(p);
  });
  board.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.classList.contains('pcard')) abrir(projetoDo(ev.target));
  });

  // Arrastar e soltar entre colunas
  board.addEventListener('dragstart', (ev) => {
    const card = ev.target.closest?.('.pcard');
    if (!card) return;
    ev.dataTransfer.setData('text/plain', card.dataset.id);
    ev.dataTransfer.effectAllowed = 'move';
    card.classList.add('arrastando');
  });
  board.addEventListener('dragend', (ev) => ev.target.closest?.('.pcard')?.classList.remove('arrastando'));
  board.addEventListener('dragover', (ev) => {
    const col = ev.target.closest('.col');
    if (!col) return;
    ev.preventDefault();
    board.querySelectorAll('.col.alvo').forEach((c) => c !== col && c.classList.remove('alvo'));
    col.classList.add('alvo');
  });
  board.addEventListener('dragleave', (ev) => {
    const col = ev.target.closest('.col');
    if (col && !col.contains(ev.relatedTarget)) col.classList.remove('alvo');
  });
  board.addEventListener('drop', (ev) => {
    const col = ev.target.closest('.col');
    if (!col) return;
    ev.preventDefault();
    col.classList.remove('alvo');
    const p = projetos.find((x) => String(x.id) === ev.dataTransfer.getData('text/plain'));
    if (p) moverPara(p, col.dataset.etapa);
  });

  desenhar();
  if (params.get('novo')) {
    history.replaceState(null, '', '#/fluxo');
    novo();
  }
}

function abrirFormProjeto({ projeto, clientes, clienteId, aoSalvar, aoExcluir }) {
  const p = projeto || { cliente_id: clienteId || clientes[0]?.id, etapa: 'engenharia' };
  modal({
    titulo: projeto ? 'Editar projeto' : 'Novo projeto',
    botao: projeto ? 'Salvar alterações' : 'Criar projeto',
    corpo: `
      <div class="form-grid">
        ${selectField({ name: 'cliente_id', label: 'Cliente', value: p.cliente_id, cls: 'span-2', options: clientes.map((c) => ({ value: c.id, label: c.nome })) })}
        ${field({ name: 'titulo', label: 'Título do projeto', value: p.titulo, cls: 'span-2', attrs: 'required maxlength="160" autofocus placeholder="Ex.: Cozinha planejada — Apto 302"' })}
        ${field({ name: 'descricao', label: 'Descrição / ambientes', type: 'textarea', value: p.descricao, cls: 'span-2', attrs: 'maxlength="2000" placeholder="Materiais, acabamentos, ferragens, ambientes…"' })}
        ${field({ name: 'valor', label: 'Valor (R$)', type: 'number', value: p.valor || '', attrs: 'min="0" step="0.01" inputmode="decimal"' })}
        ${field({ name: 'prazo', label: 'Prazo de entrega', type: 'date', value: p.prazo })}
        ${selectField({ name: 'etapa', label: 'Etapa atual', value: p.etapa, cls: 'span-2', options: ETAPAS.map((e) => ({ value: e.id, label: e.nome })) })}
      </div>`,
    extraAcoes: projeto ? `<button type="button" class="btn btn-ghost-danger" data-excluir>${icone('lixo')}Excluir</button>` : '',
    onSubmit: async (dados) => {
      const r = await api(projeto ? `/projetos/${projeto.id}` : '/projetos', { method: projeto ? 'PUT' : 'POST', body: dados });
      toast(projeto ? 'Projeto atualizado.' : 'Projeto criado.');
      aoSalvar(r);
    },
    aoAbrir: (dlg, fechar) => {
      $('[data-excluir]', dlg)?.addEventListener('click', async () => {
        if (!await confirmar(`Excluir o projeto <strong>${esc(projeto.titulo)}</strong>? Esta ação não pode ser desfeita.`)) return;
        try {
          await api(`/projetos/${projeto.id}`, { method: 'DELETE' });
          toast('Projeto excluído.');
          fechar();
          aoExcluir();
        } catch (e) {
          toast(e.message, 'erro');
        }
      });
    },
  });
}

/* ---------- Roteador ---------- */

const VIEWS = { '/painel': viewPainel, '/clientes': viewClientes, '/fluxo': viewFluxo };

async function render() {
  const [rota, qs] = (location.hash.slice(1) || '/painel').split('?');
  const publica = rota === '/login' || rota === '/cadastro';
  if (!state.usuario && !publica) return irPara('/login');
  if (state.usuario && publica) return irPara('/painel');
  if (publica) return renderAuth(rota === '/cadastro');
  if (!VIEWS[rota]) return irPara('/painel');

  montarShell(rota);
  // Cada navegação ganha um contêiner novo, para que uma tela lenta não sobrescreva a seguinte.
  const el = document.createElement('div');
  el.innerHTML = '<div class="carregando">Carregando…</div>';
  $('#conteudo').replaceChildren(el);
  try {
    await VIEWS[rota](el, new URLSearchParams(qs || ''));
  } catch (e) {
    if (state.usuario) {
      el.innerHTML = `<div class="card">${vazio('x', 'Não foi possível carregar', esc(e.message), false,
        '<button class="btn" onclick="location.reload()">Tentar novamente</button>')}</div>`;
    }
  }
}

window.addEventListener('hashchange', render);

(async function iniciar() {
  try {
    const me = await api('/auth/me');
    state.usuario = me.usuario;
    state.empresa = me.empresa;
  } catch { /* sem sessão: vai para o login */ }
  render();
})();
