# Méridel

Site statique publié sur https://meridel.ch — HTML, CSS et JavaScript natif.
Le dépôt contient la version publiée d’origine et les améliorations de l’atelier d’identité et du questionnaire du 28 septembre 2026.

## Travailler avec une autre IA

1. Récupérer la dernière version de `main` et vérifier les modifications locales avant toute édition.
2. Conserver les polices, couleurs, animations et sections existantes, sauf demande explicite.
3. Tester les modifications en local avec un serveur HTTP, sur ordinateur et mobile.
4. Enregistrer un commit et pousser sans `--force`. Ne jamais écraser une version distante plus récente.
5. Publier séparément sur Infomaniak : ce dépôt n’est pas relié à une publication automatique.

## Publication

- Hébergement : Infomaniak Starter, domaine principal meridel.ch, alias www.meridel.ch.
- Racine : répertoire affiché à l’ouverture du Web FTP, contenant `index.html`, `css`, `js`, `fonts` et `img`.
- Configuration serveur préservée dans `.htaccess`.
- Envoyer d’abord les nouveaux fichiers CSS/JS, puis `index.html` en dernier.
- Garder les anciens fichiers pour les visiteurs ayant une page encore ouverte et pour permettre le retour à la version précédente.
- Vérifier la version distante avant tout remplacement ; conserver une sauvegarde.

## Fichiers de cette évolution

- `css/atelier.css` : styles limités aux deux sections et à leur passage au contact.
- `js/atelier.js` : typographie, palettes, symboles, composition et scènes.
- `js/quiz-atelier.js` : navigation en quatre étapes et transfert de la recommandation.
- `js/contact-atelier.js` : contact simplifié après le questionnaire.
- `js/main-atelier.js` : point d’entrée de cette version ; les autres modules restent inchangés.

Le formulaire prépare un message WhatsApp ou un e-mail. Le visiteur confirme l’envoi dans sa messagerie. Le site n’enregistre ni les réponses ni les compositions du logo.

## Validation réalisée

- 256 combinaisons de réponses vérifiées : recommandations cohérentes, tarifs définis et prise en compte des options.
- Parcours Landing Page : quatre étapes, CHF 490, contact prérempli, note personnelle conservée.
- Retour et recommencement ; étapes masquées dès le HTML initial.
- Typographie, couleur, symbole, carte recto/verso, enseigne et mobile.
- Nom long avec accents ; largeur de téléphone 390 px sans débordement horizontal.
- Vérification des ressources locales et absence d’erreurs JavaScript pendant les parcours testés.
