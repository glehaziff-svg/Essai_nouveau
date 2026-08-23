// État de l'application et sauvegarde locale (localStorage).
// Aucune donnée n'est envoyée sur un serveur : tout reste dans le navigateur.

const CLE_STOCKAGE = 'cra-data-v1';

// Types d'absence (les activités « projet » sont définies par l'utilisateur).
const TYPES_ABSENCE = [
  { id: 'conges', nom: 'Congés payés', couleur: '#f59e0b', icone: '🌴' },
  { id: 'rtt', nom: 'RTT', couleur: '#10b981', icone: '🕒' },
  { id: 'maladie', nom: 'Maladie', couleur: '#ef4444', icone: '🌡️' },
  { id: 'formation', nom: 'Formation', couleur: '#8b5cf6', icone: '🎓' },
  { id: 'sans_solde', nom: 'Sans solde', couleur: '#64748b', icone: '⏸️' },
  { id: 'intercontrat', nom: 'Intercontrat', couleur: '#0ea5e9', icone: '📋' },
];

const COULEURS_PROJET = [
  '#2563eb', '#0891b2', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#4f46e5', '#0d9488', '#b45309', '#be123c',
];

function donneesParDefaut() {
  return {
    version: 1,
    profil: { nom: '', societe: '', matricule: '', client: '', tjm: 0 },
    projets: [
      { id: 'p1', nom: 'Mission principale', client: '', couleur: COULEURS_PROJET[0], tjm: 0 },
    ],
    // saisies["2026-08-03"] = { am: {...}, pm: {...} }
    // une demi-journée = { type: 'projet', projetId } ou { type: 'conges' }
    saisies: {},
  };
}

const Store = {
  data: donneesParDefaut(),

  charger() {
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE);
      if (brut) {
        const parse = JSON.parse(brut);
        this.data = Object.assign(donneesParDefaut(), parse);
      }
    } catch (e) {
      console.warn('Données illisibles, réinitialisation.', e);
      this.data = donneesParDefaut();
    }
    return this.data;
  },

  sauvegarder() {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Sauvegarde impossible (stockage plein ou navigation privée).', e);
    }
  },

  // --- Projets ---
  projet(id) {
    return this.data.projets.find((p) => p.id === id) || null;
  },

  ajouterProjet({ nom, client, tjm }) {
    const id = 'p' + Date.now().toString(36);
    const couleur = COULEURS_PROJET[this.data.projets.length % COULEURS_PROJET.length];
    this.data.projets.push({ id, nom, client: client || '', couleur, tjm: Number(tjm) || 0 });
    this.sauvegarder();
    return id;
  },

  modifierProjet(id, champs) {
    const p = this.projet(id);
    if (!p) return;
    Object.assign(p, champs, { tjm: Number(champs.tjm) || 0 });
    this.sauvegarder();
  },

  supprimerProjet(id) {
    this.data.projets = this.data.projets.filter((p) => p.id !== id);
    // Les demi-journées rattachées au projet supprimé sont vidées.
    Object.keys(this.data.saisies).forEach((cle) => {
      ['am', 'pm'].forEach((part) => {
        const v = this.data.saisies[cle][part];
        if (v && v.type === 'projet' && v.projetId === id) delete this.data.saisies[cle][part];
      });
      if (!this.data.saisies[cle].am && !this.data.saisies[cle].pm) delete this.data.saisies[cle];
    });
    this.sauvegarder();
  },

  // --- Saisies ---
  saisie(cle, part) {
    const j = this.data.saisies[cle];
    return (j && j[part]) || null;
  },

  definirSaisie(cle, part, valeur) {
    if (!valeur) {
      if (this.data.saisies[cle]) {
        delete this.data.saisies[cle][part];
        if (!this.data.saisies[cle].am && !this.data.saisies[cle].pm) delete this.data.saisies[cle];
      }
    } else {
      if (!this.data.saisies[cle]) this.data.saisies[cle] = {};
      this.data.saisies[cle][part] = valeur;
    }
    this.sauvegarder();
  },

  viderMois(jours) {
    jours.forEach((j) => delete this.data.saisies[j.cle]);
    this.sauvegarder();
  },

  // --- Import / export ---
  exporterJSON() {
    return JSON.stringify(this.data, null, 2);
  },

  importerJSON(texte) {
    const parse = JSON.parse(texte);
    if (!parse || typeof parse !== 'object' || !parse.saisies) {
      throw new Error('Fichier de sauvegarde non reconnu.');
    }
    this.data = Object.assign(donneesParDefaut(), parse);
    this.sauvegarder();
  },

  reinitialiser() {
    this.data = donneesParDefaut();
    this.sauvegarder();
  },
};

// Description affichable d'une demi-journée.
function decrireActivite(valeur) {
  if (!valeur) return null;
  if (valeur.type === 'projet') {
    const p = Store.projet(valeur.projetId);
    if (!p) return null;
    return { nom: p.nom, client: p.client, couleur: p.couleur, icone: '💼', tjm: p.tjm };
  }
  const t = TYPES_ABSENCE.find((a) => a.id === valeur.type);
  if (!t) return null;
  return { nom: t.nom, client: '', couleur: t.couleur, icone: t.icone, tjm: 0 };
}

function memeActivite(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  return a.type !== 'projet' || a.projetId === b.projetId;
}
