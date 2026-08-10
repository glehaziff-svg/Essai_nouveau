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
