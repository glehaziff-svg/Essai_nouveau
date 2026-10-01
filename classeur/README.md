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
- **Papiers** : nom, catégorie, **dossier** (intercalaire : Impôts, Logement, Mutuelle & Sécu, Ordonnances… proposés
  par catégorie, libres à compléter ; deviné d'après le scan ; vue *Par dossier* et filtre), **type** (compte rendu, ordonnance, résultat d'analyse, facture, attestation…),
  **praticien / organisme**, **mots-clés**, référence, date, **échéance** (alerte 45 jours avant expiration),
  notes et **pièces jointes** (scans PDF, photos — plusieurs par papier, conservées sur l'appareil).
- **Retrouver un document** : la recherche ignore les accents et accepte plusieurs mots
  (`martin compte` trouve « Compte rendu — Dr Martin »). Filtres par catégorie et par type, tri par date / échéance / nom.
- **Rappels** : notification du navigateur avant chaque rendez-vous (délai réglable : 1 h à 2 jours), page ouverte.
- **Récupérer ses rendez-vous Google Agenda** : import d'un fichier `.ics` (récurrences développées, catégorie devinée,
  doublons ignorés) — voir plus bas.
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

## Version bureau (Electron) — `Mon Classeur.exe`

Application Windows complète, sans navigateur. En plus de tout ce qui précède :

- **🖨️ Numériser maintenant** (dans la fiche d'un papier, ou clic droit sur l'icône de la zone de notification) :
  lance IJ Scan Utility et **joint automatiquement** le scan dès qu'il apparaît dans le dossier des scans
  (réglable dans *Réglages → Dossier des scans* ; par défaut *Documents*, comme IJ Scan Utility).
- L'application reste dans la **zone de notification** (près de l'horloge) quand on ferme la fenêtre :
  les **rappels de rendez-vous** s'affichent même fenêtre fermée. *Quitter* via le clic droit sur l'icône.
- **🔍 Lecture du texte des scans (OCR)**, hors-ligne, en français : à l'ajout d'un scan ou d'une photo, le texte est
  extrait (Tesseract ; les PDF « texte » sont lus directement). Résultat : la **recherche trouve un papier par son
  contenu** (un nom de médicament, un mot du compte rendu…), la fiche est **pré-remplie** (type, date, praticien,
  catégorie, titre) et le texte est consultable / copiable (bouton 📝 ou 🔍). Désactivable dans *Réglages*.
- **🔄 Synchronisation Google Agenda** : collez une fois l'*adresse secrète au format iCal* de votre agenda
  (*Réglages → Synchronisation Google Agenda*) ; l'app récupère vos rendez-vous au démarrage puis toutes les heures,
  sans doublons ; les rendez-vous **modifiés, déplacés ou supprimés** dans Google sont répercutés (uniquement ceux
  venus de Google, badge « G » ; votre catégorie et vos notes sont conservées ; l'historique de plus de 30 jours n'est
  jamais effacé). Lecture seule : rien n'est modifié dans Google. Pour obtenir l'adresse : calendar.google.com →
  ⚙️ Paramètres → votre agenda dans la colonne de gauche → tout en bas, *Adresse secrète au format iCal* → copier.
- Sauvegardes et exports `.ics` via une vraie boîte de dialogue « Enregistrer sous ».

**Installer** : décompressez `Mon-Classeur-Windows-x64.zip` dans un dossier (ex. `C:\Mon Classeur`) et lancez
`Mon Classeur.exe`. Pas d'installation ; créez un raccourci sur le Bureau si vous le souhaitez.
Windows SmartScreen peut avertir au premier lancement (application non signée) : *Informations complémentaires* →
*Exécuter quand même*. Les données sont dans `%APPDATA%\mon-classeur`.

**Reconstruire le .exe** : `npm install && npm run build:win` dans ce dossier (résultat dans `dist/` ; le script
`vendor` copie Tesseract/pdf.js et télécharge le modèle français `fra.traineddata` une fois), ou via
l'action GitHub *Build Mon Classeur* (artefact téléchargeable dans l'onglet Actions).

## Lancer comme une application (fichiers exécutables, sans Electron)

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

## Récupérer mes rendez-vous Google Agenda

1. Sur un ordinateur, ouvrez [calendar.google.com](https://calendar.google.com) → ⚙️ **Paramètres** → menu de gauche
   **Importer et exporter** → **Exporter**. Un fichier `.zip` se télécharge.
2. Décompressez-le : il contient un fichier `.ics` par agenda (ex. `votre.nom@gmail.com.ics`).
3. Dans Mon Classeur → *Rendez-vous* → **⬆︎ Google Agenda** (ou *Réglages* → *Importer .ics*) → choisissez le `.ics`.

Les rendez-vous des 30 derniers jours et à venir sont importés (les récurrents sur 12 mois), avec une catégorie
devinée d'après le titre (Dr, dentiste → médical ; impôts, CAF → administratif ; banque → finances) que vous pouvez
corriger. Vous pouvez réimporter plus tard : les rendez-vous déjà présents ne sont pas dupliqués.
