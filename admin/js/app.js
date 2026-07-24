// ─── Shared Admin App ───────────────────────────────────────────────────────

const API = {
  async get(path) {
    const r = await fetch(`/api${path}`, { credentials: 'include' });
    if (r.status === 401) { window.location.href = '/admin/'; return null; }
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  async patch(path, body) {
    const r = await fetch(`/api${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
};

// Auth guard — call on every admin page (except login)
async function requireAuth() {
  const data = await API.get('/auth/me');
  if (!data) return null; // API.get already redirects on 401
  // Render user info in sidebar
  const nameEl = document.getElementById('admin-name');
  const roleEl = document.getElementById('admin-role');
  const avatarEl = document.getElementById('admin-avatar');
  if (nameEl) nameEl.textContent = data.admin.name;
  if (roleEl) roleEl.textContent = data.admin.role === 'admin' ? 'Admin' : 'Suporte';
  if (avatarEl) avatarEl.textContent = data.admin.name.charAt(0).toUpperCase();
  return data.admin;
}

// Inject sidebar layout
function renderLayout(activePage) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard',    href: '/admin/dashboard.html', icon: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>' },
    { id: 'clients',   label: 'Clientes',      href: '/admin/clients.html',   icon: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>' },
    { id: 'leads',     label: 'Leads',         href: '/admin/leads.html',     icon: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>' },
    { id: 'prospects', label: 'Interessados',  href: '/admin/prospects.html', icon: '<path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>' },
  ];

  const sidebarHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-text">LUMI IDEA</div>
        <div class="sidebar-logo-sub">Painel Administrativo</div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-label">Navegação</div>
        <nav class="sidebar-nav">
          ${nav.map(item => `
            <a href="${item.href}" class="nav-item ${item.id === activePage ? 'active' : ''}">
              <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">${item.icon}</svg>
              ${item.label}
            </a>
          `).join('')}
        </nav>
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar" id="admin-avatar">–</div>
          <div>
            <div class="sidebar-user-name" id="admin-name">Carregando...</div>
            <div class="sidebar-user-role" id="admin-role"></div>
          </div>
        </div>
        <button class="btn-logout" id="btn-logout">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  `;

  document.getElementById('admin-sidebar-mount').innerHTML = sidebarHTML;

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await API.post('/auth/logout', {});
    window.location.href = '/admin/';
  });
}

// Toast notification
function toast(message, type = 'default') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Format date
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Status pill HTML
const STATUS_MAP = {
  new:                { label: 'Novo cliente',         cls: 'pill-new' },
  pending_onboarding: { label: 'Aguard. onboarding',  cls: 'pill-pending' },
  in_production:      { label: 'Em produção',          cls: 'pill-production' },
  review:             { label: 'Revisão',              cls: 'pill-review' },
  published:          { label: 'Publicado',            cls: 'pill-published' },
  canceled:           { label: 'Cancelado',            cls: 'pill-canceled' },
  active:             { label: 'Ativa',                cls: 'pill-active' },
  past_due:           { label: 'Em atraso',            cls: 'pill-past-due' },
  monthly:            { label: 'Mensal',               cls: 'pill-new' },
  annual:             { label: 'Anual',                cls: 'pill-published' },
  // lead origins
  buyer_guide:        { label: 'Guia comprador',       cls: 'pill-new' },
  seller_guide:       { label: 'Guia vendedor',        cls: 'pill-pending' },
  contact_form:       { label: 'Formulário',           cls: 'pill-production' },
  whatsapp:           { label: 'WhatsApp',             cls: 'pill-published' },
  sms:                { label: 'SMS',                  cls: 'pill-review' },
  email:              { label: 'Email',                cls: 'pill-canceled' },
  // prospect origins
  leadmagnet:         { label: 'Leadmagnet',           cls: 'pill-new' },
  newsletter:         { label: 'Newsletter',           cls: 'pill-production' },
};

function pillHTML(key) {
  const s = STATUS_MAP[key];
  if (!s) return `<span class="pill pill-new">${key}</span>`;
  return `<span class="pill ${s.cls}">${s.label}</span>`;
}
