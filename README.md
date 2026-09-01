# ARK Ascended Hub

Compagnon communautaire non officiel pour **ARK: Survival Ascended** : actualités, créatures, cartes/ressources, tame, élevage, craft, boss et espace personnel local.

## Projet séparé

Ce dépôt doit rester totalement indépendant de `AsteriaxQG/AsteriaxVerse`.

Nom conseillé du nouveau dépôt GitHub : `ARK-Ascended-Hub`
Nom conseillé du projet Cloudflare Pages : `ark-ascended-hub`
URL Cloudflare attendue : `https://ark-ascended-hub.pages.dev`

## Stack

- HTML / CSS / JavaScript vanilla (aucun build requis)
- Cloudflare Pages Functions pour `/api/news`
- LocalStorage pour les favoris, checklists et élevages
- Wiki officiel communautaire pour la récupération dynamique des images de créatures
- Site officiel ARK / Studio Wildcard comme source des actualités

## Déploiement Cloudflare Pages

1. Créer un nouveau dépôt GitHub vide `ARK-Ascended-Hub`.
2. Envoyer le contenu de ce dossier à la racine du dépôt.
3. Dans Cloudflare Pages, créer **un nouveau projet** connecté à ce dépôt uniquement.
4. Framework preset : `None`.
5. Build command : laisser vide.
6. Build output directory : `/`.
7. Production branch : `main`.

Le fichier `_redirects` assure le fonctionnement des URLs directes et de F5 sur `/actus`, `/creatures`, etc.

## Actualités

`functions/api/news.js` lit la page officielle `survivetheark.com`, récupère les liens récents et complète les cartes via les métadonnées des articles. Si la source officielle est indisponible, le front utilise `data/news-fallback.json`.

## Important sur les calculateurs

Les données de tame et d'élevage de cette version servent de compagnon pratique et sont explicitement présentées comme estimatives. Pour une précision parfaite sur toutes les espèces, chaque nourriture et tous les multiplicateurs serveur, la prochaine étape consiste à enrichir la base de données avec les valeurs exactes vérifiées du wiki.

## Sources / affiliation

ARK Ascended Hub est un projet communautaire non officiel et n'est pas affilié à Studio Wildcard, Snail Games ou aux mainteneurs du wiki. Les actualités restent liées à leur source originale.
