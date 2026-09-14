// Logiciel CRA — saisie du compte rendu d'activité mois par mois.

let annee, mois;              // mois affiché
let selection = { type: 'projet', projetId: null }; // activité « pinceau »
let peinture = null;          // 'peindre' | 'effacer' pendant un glisser

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

function formatJours(n) {
  const txt = Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
  return `${txt} j`;
}

function echapper(txt) {
  return String(txt).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------------------------------------------------------------- Profil */

function chargerProfil() {
  const p = Store.data.profil;
  $('#profil-nom').value = p.nom || '';
  $('#profil-societe').value = p.societe || '';
  $('#profil-client').value = p.client || '';
  $('#profil-matricule').value = p.matricule || '';
}

function enregistrerProfil() {
  Store.data.profil = {
    nom: $('#profil-nom').value.trim(),
    societe: $('#profil-societe').value.trim(),
    client: $('#profil-client').value.trim(),
    matricule: $('#profil-matricule').value.trim(),
    tjm: Store.data.profil.tjm || 0,
  };
  Store.sauvegarder();
}

/* -------------------------------------------------------------- Palette */

function selectionValide() {
  if (selection.type === 'projet') {
    const existe = selection.projetId && Store.projet(selection.projetId);
    if (!existe) {
      const premier = Store.data.projets[0];
      selection = premier
        ? { type: 'projet', projetId: premier.id }
        : { type: TYPES_ABSENCE[0].id };
    }
  }
  return selection;
}

function estSelection(valeur) {
  if (selection.type === 'gomme') return false;
  return memeActivite(selection, valeur);
}

function renderPalette() {
  selectionValide();
  const projets = Store.data.projets.map((p) => ({
    valeur: { type: 'projet', projetId: p.id },
    nom: p.nom, sous: p.client, couleur: p.couleur, icone: '💼',
  }));
  const absences = TYPES_ABSENCE.map((a) => ({
    valeur: { type: a.id }, nom: a.nom, sous: '', couleur: a.couleur, icone: a.icone,
  }));

  const bouton = (item) => `
    <button class="pastille ${estSelection(item.valeur) ? 'active' : ''}"
            data-valeur='${echapper(JSON.stringify(item.valeur))}'
            style="--c:${item.couleur}">
      <span class="pastille-icone">${item.icone}</span>
      <span class="pastille-texte">
        <strong>${echapper(item.nom)}</strong>
        ${item.sous ? `<small>${echapper(item.sous)}</small>` : ''}
      </span>
    </button>`;

  $('#palette-projets').innerHTML = projets.length
    ? projets.map(bouton).join('')
    : '<p class="vide">Ajoutez un projet ci-dessous.</p>';
  $('#palette-absences').innerHTML = absences.map(bouton).join('');
  $('#btn-gomme').classList.toggle('active', selection.type === 'gomme');
}

/* -------------------------------------------------------------- Projets */

function renderProjets() {
  const liste = Store.data.projets;
  $('#projets-liste').innerHTML = liste.length
    ? liste.map((p) => `
      <li class="projet-ligne" style="--c:${p.couleur}">
        <span class="projet-infos">
          <strong>${echapper(p.nom)}</strong>
          <small>${echapper(p.client || 'Client non renseigné')}${p.tjm ? ` · ${euros.format(p.tjm)}/j` : ''}</small>
        </span>
        <span class="projet-actions">
          <button class="icone" data-editer="${p.id}" title="Modifier">✏️</button>
          <button class="icone" data-supprimer="${p.id}" title="Supprimer">🗑️</button>
        </span>
      </li>`).join('')
    : '<li class="vide">Aucun projet.</li>';
}

function remplirFormulaireProjet(p) {
  $('#projet-id').value = p ? p.id : '';
  $('#projet-nom').value = p ? p.nom : '';
  $('#projet-client').value = p ? p.client : '';
  $('#projet-tjm').value = p && p.tjm ? p.tjm : '';
  $('#form-projet-titre').textContent = p ? 'Modifier le projet' : 'Nouveau projet';
  $('#btn-annuler-projet').hidden = !p;
}

/* ----------------------------------------------------------- Calendrier */

function activiteHTML(valeur, part) {
  const label = part === 'am' ? 'Matin' : 'Après-midi';
  const info = decrireActivite(valeur);
  if (!info) return `<span class="demi-label">${label}</span><span class="demi-vide">—</span>`;
  return `<span class="demi-label">${label}</span>
          <span class="demi-nom">${info.icone} ${echapper(info.nom)}</span>`;
}

function majDemi(btn) {
  const valeur = Store.saisie(btn.dataset.cle, btn.dataset.part);
  const info = decrireActivite(valeur);
  btn.classList.toggle('rempli', !!info);
  btn.style.setProperty('--c', info ? info.couleur : 'transparent');
  btn.innerHTML = activiteHTML(valeur, btn.dataset.part);
  btn.setAttribute('aria-label',
    `${btn.dataset.part === 'am' ? 'Matin' : 'Après-midi'} du ${formatDateFR(btn.dataset.cle)} : ${info ? info.nom : 'non saisi'}`);
}

function renderCalendrier() {
  const jours = joursDuMois(annee, mois);
  // Décalage pour démarrer la grille un lundi.
  const decalage = (jours[0].jourSemaine + 6) % 7;
  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push('<div class="jour vide-case"></div>');

  jours.forEach((j) => {
    const classes = ['jour'];
    if (j.weekEnd) classes.push('week-end');
    if (j.ferie) classes.push('ferie');
    cases.push(`
      <div class="${classes.join(' ')}">
        <div class="jour-entete">
          <span class="jour-num">${j.numero}</span>
          <span class="jour-nom">${JOURS_COURTS[j.jourSemaine]}</span>
          ${j.ferie ? `<span class="jour-ferie" title="${echapper(j.ferie)}">${echapper(j.ferie)}</span>` : ''}
        </div>
        <button class="demi" data-cle="${j.cle}" data-part="am"></button>
        <button class="demi" data-cle="${j.cle}" data-part="pm"></button>
      </div>`);
  });

  $('#calendrier').innerHTML = cases.join('');
  $$('#calendrier .demi').forEach(majDemi);
  $('#mois-libelle').textContent = libelleMois(annee, mois);
}

/* --------------------------------------------------------- Peinture UI */

function appliquer(btn, action) {
  const cle = btn.dataset.cle;
  const part = btn.dataset.part;
  if (action === 'effacer') {
    Store.definirSaisie(cle, part, null);
  } else {
    Store.definirSaisie(cle, part, JSON.parse(JSON.stringify(selectionValide())));
  }
  majDemi(btn);
  renderRecap();
}

function demarrerPeinture(btn) {
  const actuel = Store.saisie(btn.dataset.cle, btn.dataset.part);
  if (selection.type === 'gomme') peinture = 'effacer';
  else peinture = memeActivite(selection, actuel) ? 'effacer' : 'peindre';
  appliquer(btn, peinture);
}

/* ---------------------------------------------------------- Récapitulatif */

function calculerRecap() {
  const jours = joursDuMois(annee, mois);
  const parProjet = {};
  const parAbsence = {};
  let travailles = 0, absences = 0, saisisOuvres = 0, horsOuvres = 0;

  jours.forEach((j) => {
    ['am', 'pm'].forEach((part) => {
      const v = Store.saisie(j.cle, part);
      if (!v) return;
      const ouvre = estOuvre(j);
      if (ouvre) saisisOuvres += 0.5; else horsOuvres += 0.5;
      if (v.type === 'projet') {
        if (!Store.projet(v.projetId)) return;
        travailles += 0.5;
        parProjet[v.projetId] = (parProjet[v.projetId] || 0) + 0.5;
      } else {
        absences += 0.5;
        parAbsence[v.type] = (parAbsence[v.type] || 0) + 0.5;
      }
    });
  });

  const ouvres = jours.filter(estOuvre).length;
  const montant = Object.entries(parProjet).reduce((total, [id, jrs]) => {
    const p = Store.projet(id);
    return total + jrs * ((p && p.tjm) || 0);
  }, 0);

  return { jours, ouvres, travailles, absences, saisisOuvres, horsOuvres, parProjet, parAbsence, montant };
}

function renderRecap() {
  const r = calculerRecap();
  $('#recap-ouvres').textContent = formatJours(r.ouvres);
  $('#recap-travailles').textContent = formatJours(r.travailles);
  $('#recap-absences').textContent = formatJours(r.absences);
  $('#recap-montant').textContent = euros.format(r.montant);

  const reste = r.ouvres - r.saisisOuvres;
  const alerte = $('#recap-alerte');
  if (reste > 0) {
    alerte.className = 'alerte attention';
    alerte.textContent = `⚠️ Il reste ${formatJours(reste)} à saisir sur les jours ouvrés.`;
  } else if (reste < 0) {
    alerte.className = 'alerte erreur';
    alerte.textContent = `⚠️ ${formatJours(-reste)} de trop par rapport aux jours ouvrés.`;
  } else {
    alerte.className = 'alerte ok';
    alerte.textContent = '✅ Mois complet : toutes les journées ouvrées sont saisies.';
  }
  $('#recap-hors-ouvres').hidden = r.horsOuvres === 0;
  if (r.horsOuvres > 0) {
    $('#recap-hors-ouvres').textContent =
      `ℹ️ Dont ${formatJours(r.horsOuvres)} saisis un week-end ou un jour férié.`;
  }

  const lignes = [];
  Store.data.projets.forEach((p) => {
    const jrs = r.parProjet[p.id];
    if (!jrs) return;
    lignes.push(`<tr>
      <td><span class="puce" style="--c:${p.couleur}"></span>${echapper(p.nom)}${p.client ? ` <small>${echapper(p.client)}</small>` : ''}</td>
      <td class="num">${formatJours(jrs)}</td>
      <td class="num">${p.tjm ? euros.format(jrs * p.tjm) : '—'}</td>
    </tr>`);
  });
  TYPES_ABSENCE.forEach((a) => {
    const jrs = r.parAbsence[a.id];
    if (!jrs) return;
    lignes.push(`<tr class="absence">
      <td><span class="puce" style="--c:${a.couleur}"></span>${a.icone} ${a.nom}</td>
      <td class="num">${formatJours(jrs)}</td>
      <td class="num">—</td>
    </tr>`);
  });
  $('#recap-detail').innerHTML = lignes.length
    ? lignes.join('')
    : '<tr><td colspan="3" class="vide">Aucune saisie pour ce mois.</td></tr>';
}

/* --------------------------------------------------------------- Export */

function telecharger(nomFichier, contenu, type) {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function nomFichierMois(ext) {
  const nom = (Store.data.profil.nom || 'cra').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `cra-${nom || 'activite'}-${annee}-${String(mois + 1).padStart(2, '0')}.${ext}`;
}

function exporterCSV() {
  const r = calculerRecap();
  const cellule = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lignes = [['Date', 'Jour', 'Matin', 'Après-midi', 'Jours travaillés'].map(cellule).join(';')];

  r.jours.forEach((j) => {
    const am = decrireActivite(Store.saisie(j.cle, 'am'));
    const pm = decrireActivite(Store.saisie(j.cle, 'pm'));
    const travail = ['am', 'pm'].filter((part) => {
      const v = Store.saisie(j.cle, part);
      return v && v.type === 'projet' && Store.projet(v.projetId);
    }).length * 0.5;
    lignes.push([
      formatDateFR(j.cle),
      JOURS_COURTS[j.jourSemaine] + (j.ferie ? ` (${j.ferie})` : ''),
      am ? am.nom : '',
      pm ? pm.nom : '',
      String(travail).replace('.', ','),
    ].map(cellule).join(';'));
  });

  lignes.push('');
  lignes.push([cellule('Jours ouvrés'), cellule(r.ouvres)].join(';'));
  lignes.push([cellule('Jours travaillés'), cellule(String(r.travailles).replace('.', ','))].join(';'));
  lignes.push([cellule('Jours d\'absence'), cellule(String(r.absences).replace('.', ','))].join(';'));
  lignes.push([cellule('Total facturable'), cellule(String(r.montant).replace('.', ','))].join(';'));

  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  telecharger(nomFichierMois('csv'), '﻿' + lignes.join('\r\n'), 'text/csv;charset=utf-8');
}

function construireFeuille() {
  const r = calculerRecap();
  const p = Store.data.profil;
  const ligneJour = (j) => {
    const am = decrireActivite(Store.saisie(j.cle, 'am'));
    const pm = decrireActivite(Store.saisie(j.cle, 'pm'));
    const classes = [];
    if (j.weekEnd) classes.push('we');
    if (j.ferie) classes.push('fer');
    return `<tr class="${classes.join(' ')}">
      <td>${j.numero}</td>
      <td>${JOURS_COURTS[j.jourSemaine]}</td>
      <td>${am ? echapper(am.nom) : (j.ferie ? echapper(j.ferie) : '')}</td>
      <td>${pm ? echapper(pm.nom) : (j.ferie ? echapper(j.ferie) : '')}</td>
    </tr>`;
  };

  const detail = [];
  Store.data.projets.forEach((pr) => {
    const jrs = r.parProjet[pr.id];
    if (jrs) detail.push(`<tr><td>${echapper(pr.nom)}${pr.client ? ` (${echapper(pr.client)})` : ''}</td><td class="num">${formatJours(jrs)}</td></tr>`);
  });
  TYPES_ABSENCE.forEach((a) => {
    const jrs = r.parAbsence[a.id];
    if (jrs) detail.push(`<tr><td>${a.nom}</td><td class="num">${formatJours(jrs)}</td></tr>`);
  });

  const moitie = Math.ceil(r.jours.length / 2);
  const tableau = (liste) => `<table class="feuille-jours">
      <thead><tr><th>J.</th><th></th><th>Matin</th><th>Après-midi</th></tr></thead>
      <tbody>${liste.map(ligneJour).join('')}</tbody>
    </table>`;

  $('#feuille-impression').innerHTML = `
    <h1>Compte rendu d'activité — ${libelleMois(annee, mois)}</h1>
    <table class="feuille-infos">
      <tr><td><strong>Intervenant :</strong> ${echapper(p.nom || '—')}</td>
          <td><strong>Société :</strong> ${echapper(p.societe || '—')}</td></tr>
      <tr><td><strong>Client :</strong> ${echapper(p.client || '—')}</td>
          <td><strong>Matricule :</strong> ${echapper(p.matricule || '—')}</td></tr>
    </table>
    <div class="feuille-colonnes">
      ${tableau(r.jours.slice(0, moitie))}
      ${tableau(r.jours.slice(moitie))}
    </div>
    <div class="feuille-bas">
      <table class="feuille-totaux">
        ${detail.join('')}
        <tr class="total"><td>Total jours travaillés</td><td class="num">${formatJours(r.travailles)}</td></tr>
        <tr><td>Jours ouvrés du mois</td><td class="num">${formatJours(r.ouvres)}</td></tr>
        ${r.montant ? `<tr class="total"><td>Total facturable</td><td class="num">${euros.format(r.montant)}</td></tr>` : ''}
      </table>
      <div class="signatures">
        <div class="signature"><span>Signature intervenant</span></div>
        <div class="signature"><span>Signature client</span></div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------ Événements */

function allerAuMois(delta) {
  const d = new Date(annee, mois + delta, 1);
  annee = d.getFullYear();
  mois = d.getMonth();
  renderCalendrier();
  renderRecap();
}

function brancherEvenements() {
  $('#btn-mois-prec').addEventListener('click', () => allerAuMois(-1));
  $('#btn-mois-suiv').addEventListener('click', () => allerAuMois(1));
  $('#btn-aujourdhui').addEventListener('click', () => {
    const now = new Date();
    annee = now.getFullYear();
    mois = now.getMonth();
    renderCalendrier();
    renderRecap();
  });

  // Sélection du pinceau
  $('#panneau-activites').addEventListener('click', (e) => {
    const btn = e.target.closest('.pastille');
    if (!btn) return;
    selection = JSON.parse(btn.dataset.valeur);
    renderPalette();
  });
  $('#btn-gomme').addEventListener('click', () => {
    selection = { type: 'gomme' };
    renderPalette();
  });

  // Saisie au clic / au glisser
  const cal = $('#calendrier');
  cal.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.demi');
    if (!btn) return;
    e.preventDefault();
    demarrerPeinture(btn);
  });
  cal.addEventListener('pointerover', (e) => {
    if (!peinture) return;
    const btn = e.target.closest('.demi');
    if (btn) appliquer(btn, peinture);
  });
  window.addEventListener('pointerup', () => { peinture = null; });
  cal.addEventListener('contextmenu', (e) => {
    const btn = e.target.closest('.demi');
    if (!btn) return;
    e.preventDefault(); // clic droit = effacer
    appliquer(btn, 'effacer');
  });

  // Remplissage rapide
  $('#btn-remplir').addEventListener('click', () => {
    const jours = joursDuMois(annee, mois).filter(estOuvre);
    const valeur = JSON.parse(JSON.stringify(selectionValide()));
    if (selection.type === 'gomme') return;
    jours.forEach((j) => {
      Store.definirSaisie(j.cle, 'am', valeur);
      Store.definirSaisie(j.cle, 'pm', valeur);
    });
    renderCalendrier();
    renderRecap();
  });
  $('#btn-vider').addEventListener('click', () => {
    if (!confirm(`Vider toutes les saisies de ${libelleMois(annee, mois)} ?`)) return;
    Store.viderMois(joursDuMois(annee, mois));
    renderCalendrier();
    renderRecap();
  });

  // Projets
  $('#form-projet').addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = $('#projet-nom').value.trim();
    if (!nom) return;
    const champs = { nom, client: $('#projet-client').value.trim(), tjm: $('#projet-tjm').value };
    const id = $('#projet-id').value;
    if (id) Store.modifierProjet(id, champs);
    else selection = { type: 'projet', projetId: Store.ajouterProjet(champs) };
    remplirFormulaireProjet(null);
    e.target.reset();
    renderProjets();
    renderPalette();
    renderCalendrier();
    renderRecap();
  });
  $('#btn-annuler-projet').addEventListener('click', () => {
    remplirFormulaireProjet(null);
    $('#form-projet').reset();
  });
  $('#projets-liste').addEventListener('click', (e) => {
    const editer = e.target.closest('[data-editer]');
    const supprimer = e.target.closest('[data-supprimer]');
    if (editer) remplirFormulaireProjet(Store.projet(editer.dataset.editer));
    if (supprimer) {
      const p = Store.projet(supprimer.dataset.supprimer);
      if (!p || !confirm(`Supprimer « ${p.nom} » ? Les demi-journées associées seront effacées.`)) return;
      Store.supprimerProjet(p.id);
      remplirFormulaireProjet(null);
      renderProjets();
      renderPalette();
      renderCalendrier();
      renderRecap();
    }
  });

  // Profil
  ['#profil-nom', '#profil-societe', '#profil-client', '#profil-matricule']
    .forEach((sel) => $(sel).addEventListener('input', enregistrerProfil));

  // Export / import
  $('#btn-csv').addEventListener('click', exporterCSV);
  $('#btn-imprimer').addEventListener('click', () => {
    construireFeuille();
    window.print();
  });
  $('#btn-sauvegarde').addEventListener('click', () => {
    telecharger(`cra-sauvegarde-${annee}-${String(mois + 1).padStart(2, '0')}.json`,
      Store.exporterJSON(), 'application/json');
  });
  $('#input-restauration').addEventListener('change', async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    try {
      Store.importerJSON(await fichier.text());
      chargerProfil();
      renderProjets();
      renderPalette();
      renderCalendrier();
      renderRecap();
      alert('Sauvegarde restaurée.');
    } catch (err) {
      alert('Restauration impossible : ' + err.message);
    }
    e.target.value = '';
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Effacer toutes les données (projets et saisies) ? Cette action est définitive.')) return;
    Store.reinitialiser();
    chargerProfil();
    remplirFormulaireProjet(null);
    renderProjets();
    renderPalette();
    renderCalendrier();
    renderRecap();
  });

  // Raccourcis clavier : flèches pour changer de mois
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') allerAuMois(-1);
    if (e.key === 'ArrowRight') allerAuMois(1);
  });
  window.addEventListener('beforeprint', construireFeuille);
}

function init() {
  Store.charger();
  const now = new Date();
  annee = now.getFullYear();
  mois = now.getMonth();
  chargerProfil();
  remplirFormulaireProjet(null);
  renderProjets();
  renderPalette();
  renderCalendrier();
  renderRecap();
  brancherEvenements();
}

document.addEventListener('DOMContentLoaded', init);
