// Charge le contenu depuis content/site.json et remplit la page.
// Le client modifie ce fichier via l'interface d'administration (/admin),
// jamais en touchant au code.

async function loadContent() {
  const res = await fetch('/content/site.json?v=' + Date.now());
  if (!res.ok) throw new Error('Impossible de charger le contenu');
  return res.json();
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function fillTexts(data) {
  document.querySelectorAll('[data-content]').forEach((el) => {
    const value = get(data, el.dataset.content);
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll('[data-img]').forEach((el) => {
    const value = get(data, el.dataset.img);
    if (value) el.src = value;
  });
}

function fillServices(services) {
  const wrap = document.getElementById('services-list');
  wrap.innerHTML = services
    .map(
      (s) => `
    <article class="card">
      <img src="${s.photo}" alt="${s.titre}" loading="lazy">
      <div class="card-body">
        <h3>${s.titre}</h3>
        <p>${s.description}</p>
      </div>
    </article>`
    )
    .join('');
}

function fillAvis(avis) {
  const wrap = document.getElementById('avis-list');
  wrap.innerHTML = avis
    .map(
      (a) => `
    <article class="avis-card">
      <div class="avis-stars">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</div>
      <blockquote>« ${a.texte} »</blockquote>
      <cite>${a.nom}</cite>
    </article>`
    )
    .join('');
}

function fillGallery(galerie) {
  const wrap = document.getElementById('gallery-list');
  wrap.innerHTML = galerie.photos
    .map(
      (p) => `
    <figure>
      <img src="${p.image}" alt="${p.legende}" loading="lazy">
      <figcaption>${p.legende}</figcaption>
    </figure>`
    )
    .join('');
}

function fillLinks(general) {
  const tel = 'tel:' + general.telephone.replace(/\s/g, '');
  ['phone-link', 'phone-link-hero', 'phone-link-contact', 'phone-link-fab'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = tel;
  });
  const email = document.getElementById('email-link');
  if (email) email.href = 'mailto:' + general.email;
  document.title = general.nom_entreprise + ' — Plombier';
}

loadContent()
  .then((data) => {
    fillTexts(data);
    fillServices(data.services);
    fillAvis(data.avis);
    fillGallery(data.galerie);
    fillLinks(data.general);
  })
  .catch((err) => console.error(err));

// Menu mobile
document.getElementById('burger').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('open');
});
document.querySelectorAll('#nav a').forEach((a) =>
  a.addEventListener('click', () => document.getElementById('nav').classList.remove('open'))
);

document.getElementById('year').textContent = new Date().getFullYear();
