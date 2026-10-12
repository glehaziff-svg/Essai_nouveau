// Charge le contenu depuis content/site.json et remplit les pages.
// Tous les textes se modifient depuis l'interface d'administration (/admin),
// jamais en touchant au code.

const PAGES = [
  { href: '/', label: 'Accueil', page: 'accueil' },
  { href: '/qui-suis-je.html', label: 'Qui suis-je', page: 'qui-suis-je' },
  { href: '/services.html', label: 'Mes services', page: 'services' },
  { href: '/livre-dor.html', label: "Livre d'or", page: 'livre-dor' },
];

const PLACEHOLDER = /\[À compléter[^\]]*\]/g;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Texte échappé, avec les emplacements « [À compléter…] » mis en évidence.
function rich(text) {
  return escapeHtml(text ?? '').replace(PLACEHOLDER, (m) => `<span class="a-completer">${m}</span>`);
}

function isFilled(text) {
  return Boolean(text) && !String(text).startsWith('[À compléter');
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function renderList(id, items, template) {
  const wrap = document.getElementById(id);
  if (wrap) wrap.innerHTML = (items || []).map(template).join('');
  return wrap;
}

function renderHeader(current) {
  const header = document.getElementById('header');
  if (!header) return;
  const links = PAGES.map(
    (p) => `<a href="${p.href}"${p.page === current ? ' class="active"' : ''}>${p.label}</a>`
  ).join('');
  header.className = 'header';
  header.innerHTML = `
    <div class="container header-inner">
      <a href="/" class="logo" data-content="general.nom"></a>
      <nav class="nav" id="nav">
        ${links}
        <a href="/contact.html" class="btn btn-primary${current === 'contact' ? ' active' : ''}">Me contacter</a>
      </nav>
      <button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">☰</button>
    </div>`;
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
}

function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  const links = [...PAGES, { href: '/contact.html', label: 'Me contacter' }]
    .map((p) => `<a href="${p.href}">${p.label}</a>`)
    .join('');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-inner">
        <div>
          <a href="/" class="logo" data-content="general.nom"></a>
          <p data-content="general.metier"></p>
        </div>
        <nav>${links}</nav>
      </div>
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} <span data-content="general.nom"></span></p>
        <a href="/mentions-legales.html">Mentions légales</a>
      </div>
    </div>`;
}

function fillTexts(data) {
  document.querySelectorAll('[data-content]').forEach((el) => {
    const value = get(data, el.dataset.content);
    if (value != null) el.innerHTML = rich(value);
  });
  document.querySelectorAll('[data-img]').forEach((el) => {
    const value = get(data, el.dataset.img);
    if (value) el.src = value;
  });
}

function fillAccueil(data) {
  renderList('constats-list', data.accueil.constats, (c) => `
    <div class="constat reveal"><p>${rich(c.texte)}</p></div>`);

  renderList('etapes-list', data.accueil.etapes, (e) => `
    <div class="etape reveal">
      <h3>${rich(e.titre)}</h3>
      <p>${rich(e.texte)}</p>
    </div>`);

  renderList('services-apercu', data.services.liste.slice(0, 3), (s, i) => `
    <article class="card reveal">
      <div class="card-icon">${i + 1}</div>
      <h3>${rich(s.titre)}</h3>
      <p>${rich(s.description)}</p>
    </article>`);

  const messages = data.livre_dor.messages || [];
  const section = document.getElementById('livre-dor-apercu');
  if (section) {
    section.classList.toggle('hidden', messages.length === 0);
    renderList('messages-apercu', messages.slice(0, 2), messageTemplate);
  }
}

function fillAPropos(data) {
  renderList('atouts-list', data.a_propos.atouts, (a) => `
    <article class="card reveal">
      <h3>${rich(a.titre)}</h3>
      <p>${rich(a.texte)}</p>
    </article>`);
}

function fillServices(data) {
  renderList('services-list', data.services.liste, (s, i) => `
    <article class="card reveal">
      <div class="card-icon">${i + 1}</div>
      <h3>${rich(s.titre)}</h3>
      <p>${rich(s.description)}</p>
    </article>`);
  const tarifs = document.getElementById('tarifs-box');
  if (tarifs) tarifs.classList.toggle('hidden', !data.services.afficher_tarifs);
}

function messageTemplate(m) {
  return `
    <article class="message reveal">
      <blockquote>${rich(m.texte)}</blockquote>
      <cite>${rich(m.nom)}${m.entreprise ? `<span>${rich(m.entreprise)}</span>` : ''}</cite>
    </article>`;
}

function fillLivreDor(data) {
  const messages = data.livre_dor.messages || [];
  const wrap = renderList('messages-list', messages, messageTemplate);
  const empty = document.getElementById('messages-empty');
  if (wrap && empty) empty.classList.toggle('hidden', messages.length > 0);
}

function fillLinks(general) {
  document.querySelectorAll('[data-link="telephone"]').forEach((el) => {
    if (isFilled(general.telephone)) el.href = 'tel:' + general.telephone.replace(/[^\d+]/g, '');
  });
  document.querySelectorAll('[data-link="email"]').forEach((el) => {
    if (isFilled(general.email)) el.href = 'mailto:' + general.email;
  });
  // Liens facultatifs : affichés seulement s'ils sont renseignés
  [['linkedin', general.linkedin], ['rendez-vous', general.lien_rendez_vous]].forEach(([key, url]) => {
    document.querySelectorAll(`[data-link="${key}"]`).forEach((el) => {
      if (url) {
        el.href = url;
        el.classList.remove('hidden');
      }
    });
  });
}

function revealOnScroll() {
  const items = document.querySelectorAll('.reveal:not(.visible)');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach((el) => observer.observe(el));
}

async function loadContent() {
  const res = await fetch('/content/site.json?v=' + Date.now());
  if (!res.ok) throw new Error('Impossible de charger le contenu');
  return res.json();
}

const currentPage = document.body.dataset.page;
renderHeader(currentPage);
renderFooter();

loadContent()
  .then((data) => {
    fillAccueil(data);
    fillAPropos(data);
    fillServices(data);
    fillLivreDor(data);
    fillTexts(data);
    fillLinks(data.general);
    if (isFilled(data.general.nom)) {
      document.title = document.title.replace('{nom}', data.general.nom);
    } else {
      document.title = document.title.replace(' — {nom}', '');
    }
  })
  .catch((err) => console.error(err))
  .finally(revealOnScroll);
