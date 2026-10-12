# Site vitrine — Secrétariat indépendant

Site de notoriété pour un programmeur web et designer spécialisé dans le secrétariat.
Objectif : donner envie aux professionnels de confier leur charge administrative.

## Pages

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | Accroche, constats (« Vous vous reconnaissez ? »), aperçu des services, méthode en 3 étapes, extraits du livre d'or (affichés seulement s'il y a des messages), appel à l'action |
| Qui suis-je | `qui-suis-je.html` | Photo, accroche, parcours, atouts |
| Mes services | `services.html` | Liste des services, modalités de travail, tarifs (affichables ou non) |
| Me contacter | `contact.html` | Coordonnées, liens facultatifs (LinkedIn, prise de rendez-vous), formulaire |
| Livre d'or | `livre-dor.html` | Messages publiés + formulaire pour en laisser un |
| Mentions légales | `mentions-legales.html` | Obligatoires pour un site professionnel |
| Merci | `merci.html` | Page affichée après l'envoi d'un formulaire |

## Contenu à compléter

Aucune information personnelle n'a été inventée. Tant qu'un texte n'est pas fourni, il apparaît sur le site
sous la forme **« [À compléter : …] »**, surligné en jaune pour être repéré d'un coup d'œil.
Il suffit de remplacer ces textes depuis l'administration (voir ci-dessous).

À fournir :
- nom ou nom commercial, téléphone, email, ville, zone d'intervention, horaires ;
- photo, phrase d'accroche, parcours et atouts (page « Qui suis-je ») ;
- services réellement proposés, modalités de travail, tarifs éventuels ;
- mentions légales (statut, SIRET, adresse, adresse de l'hébergeur) ;
- liens LinkedIn et prise de rendez-vous si vous en avez (les boutons n'apparaissent que s'ils sont renseignés).

Les textes génériques déjà présents (titre d'accueil, constats, étapes de la méthode) sont modifiables eux aussi.

## Livre d'or : fonctionnement

1. Un visiteur laisse un message via le formulaire de la page Livre d'or (avec son accord de publication).
2. Le message arrive dans l'onglet **Forms** de Netlify (formulaire `livre-dor`) — rien n'est publié automatiquement.
3. Pour le publier : `/admin/` → **Livre d'or** → **Messages publiés** → ajouter le nom, l'activité et le message → **Publier**.

Les demandes de contact arrivent de la même façon dans le formulaire `contact`. Une notification par email peut être activée dans Netlify (**Forms → Form notifications**).

## Modifier le site

Tout le contenu est stocké dans `content/site.json` et se modifie via l'interface **Decap CMS** :

1. Aller sur `https://votre-site.netlify.app/admin/` et se connecter
2. Ouvrir **« Textes et photos du site »**
3. Modifier les textes, changer la photo, ajouter ou réordonner les services
4. Cliquer sur **« Publier »** — le site se met à jour en 1 à 2 minutes

## Mise en ligne (Netlify — gratuit)

1. Sur [netlify.com](https://www.netlify.com) : **« Add new site » → « Import an existing project »**, choisir ce dépôt (branche `main`).
   Build command : *(vide)* — Publish directory : `.`
2. Activer l'administration : **Identity → Enable Identity**, puis **Identity → Services → Git Gateway → Enable**, et **Registration → Invite only**.
3. **Identity → Invite users** : saisir votre email, puis définir votre mot de passe via le lien reçu.
4. (Optionnel) **Domain management → Add a domain** pour relier votre nom de domaine.

## Structure

```
├── index.html, qui-suis-je.html, services.html, contact.html,
│   livre-dor.html, mentions-legales.html, merci.html
├── css/style.css        # Styles (couleurs en haut du fichier)
├── js/main.js           # En-tête, pied de page et injection du contenu
├── content/site.json    # ⭐ Tout le contenu modifiable
├── images/              # Illustration d'accueil, photo par défaut
│   └── uploads/         # Photos ajoutées via l'admin
├── admin/               # Interface d'administration (Decap CMS)
└── netlify.toml
```

## Tester en local

```bash
npx serve .
# puis ouvrir http://localhost:3000
```
