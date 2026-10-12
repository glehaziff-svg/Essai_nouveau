# Site vitrine — Plombier

Site vitrine moderne pour un artisan plombier, avec une **interface d'administration** permettant au client de modifier lui-même les textes et les photos, sans toucher au code.

## Contenu du site

- **Accueil** : titre accrocheur, photo principale, boutons d'appel et de devis
- **Services** : liste de services avec photo et description (ajout/suppression libre)
- **À propos** : présentation de l'entreprise avec photo
- **Réalisations** : galerie de photos avec légendes
- **Avis clients** : témoignages avec notes en étoiles
- **Contact** : coordonnées + formulaire de contact (fonctionne automatiquement sur Netlify)
- Design responsive (mobile / tablette / ordinateur), bouton d'appel flottant sur mobile

## Comment le client modifie le site

Tout le contenu (textes, photos, coordonnées) est stocké dans `content/site.json`. Le client le modifie via l'interface d'administration **Decap CMS** :

1. Aller sur `https://votre-site.netlify.app/admin/`
2. Se connecter avec son email
3. Cliquer sur **« Textes et photos du site »**
4. Modifier les textes, remplacer les photos (glisser-déposer), ajouter des services ou des avis
5. Cliquer sur **« Publier »** — le site se met à jour automatiquement en 1 à 2 minutes

## Exemples de modifications

Toutes ces modifications se font depuis `/admin/` → **« Textes et photos du site »**, puis **« Publier »**.

### Exemple 1 — Changer le numéro de téléphone

Ouvrir **Informations générales** → champ **Téléphone** → saisir par exemple `06 98 76 54 32`.
Le numéro est mis à jour partout : en-tête, page d'accueil, section contact et bouton d'appel mobile (le lien « appeler » est généré automatiquement).

### Exemple 2 — Remplacer la photo principale

Ouvrir **Page d'accueil** → **Photo principale** → **« Choisir une autre image »** → glisser-déposer la photo (JPG ou PNG, idéalement en format paysage, moins de 1 Mo).
La photo est enregistrée dans `images/uploads/`.

### Exemple 3 — Ajouter un service

Ouvrir **Services** → **« Ajouter Services »** en bas de la liste, puis remplir :

| Champ | Exemple |
|---|---|
| Titre du service | `Débouchage de canalisation` |
| Description | `Évier, douche ou WC bouché : débouchage rapide par furet ou hydrocurage, sans dégâts.` |
| Photo | une photo du chantier |

Pour changer l'ordre, faire glisser les services dans la liste. Pour en supprimer un, cliquer sur la croix à droite de son titre.

### Exemple 4 — Ajouter un avis client

Ouvrir **Avis clients** → **« Ajouter Avis clients »** :

| Champ | Exemple |
|---|---|
| Nom du client | `Thomas R.` |
| Avis | `Chauffe-eau remplacé le jour même. Très professionnel et ponctuel.` |
| Note (1 à 5) | `5` |

La note s'affiche automatiquement en étoiles (★★★★★).

### Exemple 5 — Ajouter une réalisation à la galerie

Ouvrir **Galerie de réalisations** → **Photos** → **« Ajouter Photos »**, choisir l'image et saisir une légende, par exemple `Remplacement de colonne d'eau — Paris 20e`.

### Exemple 6 — Modifier les horaires

Ouvrir **Informations générales** → **Horaires**, par exemple :
`Lun - Ven : 8h00 - 18h00 · Sam : 9h00 - 12h00 · Urgences 24h/24`

### À quoi ressemble le contenu (pour information)

L'interface d'administration écrit dans `content/site.json`. Un service y ressemble à ceci :

```json
{
  "titre": "Débouchage de canalisation",
  "description": "Évier, douche ou WC bouché : débouchage rapide par furet ou hydrocurage, sans dégâts.",
  "photo": "/images/uploads/debouchage.jpg"
}
```

Il n'est jamais nécessaire de modifier ce fichier à la main.

## Mise en ligne (Netlify — gratuit)

1. Créer un compte sur [netlify.com](https://www.netlify.com) et cliquer sur **« Add new site » → « Import an existing project »**, puis choisir ce dépôt GitHub (branche `main`).
   - Build command : *(laisser vide)* — Publish directory : `.`
2. Activer l'administration :
   - Dans le tableau de bord Netlify : **Site configuration → Identity → Enable Identity**
   - Puis **Identity → Services → Git Gateway → Enable Git Gateway**
   - Dans **Identity → Registration**, choisir **« Invite only »**
3. Inviter le client : **Identity → Invite users** → saisir son email. Il reçoit un email, définit son mot de passe, et peut se connecter sur `/admin/`.
4. (Optionnel) Relier un nom de domaine : **Domain management → Add a domain**.

Le formulaire de contact utilise **Netlify Forms** : les messages arrivent dans l'onglet **Forms** du tableau de bord (une notification email peut y être configurée).

## Structure du projet

```
├── index.html          # Page unique du site
├── css/style.css       # Styles
├── js/main.js          # Injecte le contenu de site.json dans la page
├── content/site.json   # ⭐ Tout le contenu modifiable (textes + chemins photos)
├── images/             # Images par défaut (placeholders SVG à remplacer)
│   └── uploads/        # Photos ajoutées par le client via l'admin
├── admin/
│   ├── index.html      # Interface d'administration (Decap CMS)
│   └── config.yml      # Définition des champs modifiables
└── netlify.toml        # Configuration Netlify
```

## Tester en local

```bash
npx serve .
# puis ouvrir http://localhost:3000
```

(L'interface `/admin` ne fonctionne qu'une fois le site déployé sur Netlify avec Identity activé.)
