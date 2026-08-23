// Utilitaires de dates : jours fériés français, jours ouvrés, formatage.
// Aucun appel réseau : tout est calculé localement.

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Clé de stockage d'un jour : "2026-08-03"
function cleDate(annee, mois, jour) {
  return `${annee}-${String(mois + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

function nbJoursDansMois(annee, mois) {
  return new Date(annee, mois + 1, 0).getDate();
}

// Dimanche de Pâques (algorithme de Meeus / Jones / Butcher, calendrier grégorien)
function paques(annee) {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 2 = mars, 3 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(annee, mois, jour);
}

function ajouterJours(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

// { "2026-05-01": "Fête du Travail", ... } pour une année donnée (métropole).
const cacheFeries = {};
function feriesDeLAnnee(annee) {
  if (cacheFeries[annee]) return cacheFeries[annee];
  const p = paques(annee);
  const liste = [
    [new Date(annee, 0, 1), "Jour de l'an"],
    [ajouterJours(p, 1), 'Lundi de Pâques'],
    [new Date(annee, 4, 1), 'Fête du Travail'],
    [new Date(annee, 4, 8), 'Victoire 1945'],
    [ajouterJours(p, 39), 'Ascension'],
    [ajouterJours(p, 50), 'Lundi de Pentecôte'],
    [new Date(annee, 6, 14), 'Fête nationale'],
    [new Date(annee, 7, 15), 'Assomption'],
    [new Date(annee, 10, 1), 'Toussaint'],
    [new Date(annee, 10, 11), 'Armistice 1918'],
    [new Date(annee, 11, 25), 'Noël'],
  ];
  const map = {};
  liste.forEach(([d, nom]) => {
    map[cleDate(d.getFullYear(), d.getMonth(), d.getDate())] = nom;
  });
  cacheFeries[annee] = map;
  return map;
}

function estWeekEnd(date) {
  const j = date.getDay();
  return j === 0 || j === 6;
}

// Jours du mois avec leurs métadonnées (week-end, férié).
function joursDuMois(annee, mois) {
  const feries = feriesDeLAnnee(annee);
  const total = nbJoursDansMois(annee, mois);
  const jours = [];
  for (let n = 1; n <= total; n++) {
    const date = new Date(annee, mois, n);
    const cle = cleDate(annee, mois, n);
    jours.push({
      cle,
      numero: n,
      date,
      jourSemaine: date.getDay(),
      weekEnd: estWeekEnd(date),
      ferie: feries[cle] || null,
    });
  }
  return jours;
}

function estOuvre(jour) {
  return !jour.weekEnd && !jour.ferie;
}

function libelleMois(annee, mois) {
  return `${MOIS[mois]} ${annee}`;
}

function formatDateFR(cle) {
  const [a, m, j] = cle.split('-');
  return `${j}/${m}/${a}`;
}
