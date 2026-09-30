# Mon Classeur — agenda & papiers, 100 % autonome

Application personnelle pour **classer vos papiers administratifs et médicaux** et **gérer vos rendez-vous avec rappels**.
Un seul fichier (`index.html`), aucun compte, aucun serveur : tout reste sur votre appareil.

## Démarrer

Ouvrez simplement `index.html` dans votre navigateur (double-clic), ou hébergez le dossier sur Netlify / GitHub Pages
pour l'avoir aussi sur votre téléphone. Ajoutez la page à l'écran d'accueil du téléphone pour l'utiliser comme une app.

## Ce que ça fait

- **Tableau de bord** : recherche globale, prochains rendez-vous, échéances de papiers.
- **Rendez-vous** : titre, catégorie (médical / administratif / finances / autre), date, heure, praticien, lieu, notes.
- **Calendrier** mensuel : cliquez sur un jour pour y ajouter un rendez-vous.
- **Papiers** : nom, catégorie, **type** (compte rendu, ordonnance, résultat d'analyse, facture, attestation…),
  **praticien / organisme**, **mots-clés**, référence, date, **échéance** (alerte 45 jours avant expiration),
  notes et **pièces jointes** (scans PDF, photos — plusieurs par papier, conservées sur l'appareil).
- **Retrouver un document** : la recherche ignore les accents et accepte plusieurs mots
  (`martin compte` trouve « Compte rendu — Dr Martin »). Filtres par catégorie et par type, tri par date / échéance / nom.
- **Rappels** : notification du navigateur avant chaque rendez-vous (délai réglable : 1 h à 2 jours), page ouverte.
- **Google Agenda** : bouton 🗓️ sur chaque rendez-vous → « Ajouter à Google Agenda » ; export `.ics` de tout l'agenda
  (Réglages) importable dans Google Agenda, Apple Calendrier, Outlook. Une fois dans Google Agenda, c'est Google qui
  vous rappelle sur le téléphone.
- **Sauvegarde / Restauration** : export de toutes vos données en un fichier `.json`, à garder en lieu sûr.
- Thème clair / sombre.

## À savoir

- Les données sont stockées dans le navigateur (localStorage). Vider les données du navigateur les efface :
  **faites des sauvegardes régulières**.
- Une synchronisation automatique à double sens avec Google Agenda demanderait un serveur et une connexion Google ;
  ce n'est volontairement pas inclus pour que l'application reste autonome et privée.
- Les rappels par notification ne fonctionnent que lorsque la page est ouverte. Pour des rappels garantis,
  utilisez le bouton Google Agenda ou l'export `.ics`.

## Lancer comme une application (fichiers exécutables)

- **Windows** : double-cliquez sur `Mon Classeur.bat`
- **Mac** : double-cliquez sur `Mon Classeur.command` (au premier lancement : clic droit → Ouvrir)
- **Linux** : `./mon-classeur.sh`

L'application s'ouvre dans sa propre fenêtre, sans barre d'adresse, avec ses données isolées
(Chrome, Edge ou Brave nécessaire ; sinon le navigateur par défaut est utilisé).
Astuce Windows : clic droit sur le `.bat` → *Envoyer vers* → *Bureau (créer un raccourci)*.

## Numériser vos papiers (scanner Canon + IJ Scan Utility)

1. Lancez **`Numeriser.bat`** (ou IJ Scan Utility depuis le menu Démarrer).
2. Une fois pour toutes, dans IJ Scan Utility → *Paramètres* → *Numérisation document* :
   format **PDF** (multi-pages possible) ou JPEG, et un dossier de sortie facile à retrouver,
   par ex. `Documents\Mon Classeur\Scans`.
3. Cliquez **Document** (ou **Auto**) : le fichier apparaît dans ce dossier.
4. Dans Mon Classeur → *Papiers* → **+ Nouveau papier** → **🖨️ Joindre un scan / fichier**
   (ou glissez le fichier dans la zone) → Enregistrer.

Sur téléphone, le bouton **📷 Photographier** ouvre directement l'appareil photo.
Les scans sont stockés dans le navigateur (IndexedDB, plusieurs centaines de Mo possibles) et inclus
dans le fichier de **Sauvegarde**.
