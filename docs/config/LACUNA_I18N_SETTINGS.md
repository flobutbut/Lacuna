*Dernière modification : 2026-03-12 15:11*

# LACUNA — Internationalisation, Paramètres & Profil utilisateur

*Dernière mise à jour : Mars 2026*

---

## Table des matières

1. [Internationalisation (i18n)](#1-internationalisation-i18n)
2. [Détection automatique de la langue](#2-détection-automatique-de-la-langue)
3. [Menu Settings (Paramètres)](#3-menu-settings-paramètres)
4. [Menu User Profile (Profil utilisateur)](#4-menu-user-profile-profil-utilisateur)
5. [Organisation UI](#5-organisation-ui)

---

## 1. Internationalisation (i18n)

### Vue d'ensemble

Pour supporter plusieurs langues dans Lacuna (Vue 3 + Vite), la solution recommandée est **Vue I18n**.

### Bibliothèque : Vue I18n

- Dictionnaires de traductions par langue
- Changement de locale à la volée (sans rechargement)
- Pluriels et interpolations

### Fichiers de locale

Les traductions sont stockées dans des **fichiers JSON** (un par langue) :

- `locales/fr.json` — français
- `locales/en.json` — anglais
- etc.

Exemple :

```json
{
  "nav.observatoire": "Observatoire",
  "nav.laboratoire": "Laboratoire",
  "nav.carte": "Carte"
}
```

Possibilité de découper par module : `locales/fr/observatoire.json`, `locales/fr/laboratoire.json`, etc.

### Utilisation dans les composants

| Contexte | Syntaxe |
|----------|---------|
| Template | `{{ $t('nav.observatoire') }}` ou `<i18n-t keypath="...">` |
| Script | `const { t } = useI18n()` puis `t('nav.observatoire')` |

### Persistance de la locale

- Stocker la locale active dans **Pinia** ou **localStorage**
- Au démarrage : initialiser Vue I18n avec cette valeur

### Points d'attention pour Lacuna

| Aspect | Détail |
|--------|--------|
| **Contenu généré** | Noms de systèmes, planètes, signaux — décider si traduction ou conservation en base |
| **Laboratoire** | Labels techniques, axes, unités (GHz, %, etc.) |
| **Dates / nombres** | Adapter `formatDate`, `formatRelativeTime` (formatUtils.js) selon la locale |
| **Typographie** | Certaines langues prennent plus de place (allemand, russe) — tester les layouts |
| **SEO** | Si SSR plus tard : URLs localisées (`/fr/...`, `/en/...`) |

### Chargement des traductions

- **Tout au démarrage** : simple, mais bundle plus lourd
- **Lazy-load** : charger chaque fichier de langue à la demande pour réduire le poids initial

---

## 2. Détection automatique de la langue

### Principe

Le navigateur expose la langue préférée de l'utilisateur via l'API JavaScript :

- **`navigator.language`** : première langue (ex. `"fr-FR"`, `"en-US"`)
- **`navigator.languages`** : liste ordonnée des préférences (ex. `["fr-FR", "fr", "en-US", "en"]`)

### Flux de détection

1. Au chargement : lire `navigator.languages` (ou `navigator.language`)
2. Pour chaque code : mapper vers une locale supportée (ex. `"fr-FR"` → `"fr"`, `"en-US"` → `"en"`)
3. Choisir la **première langue de la liste** que l'app supporte
4. Si aucune ne correspond : **fallback** (ex. `"en"` ou `"fr"`)

### Limites

| Point | Explication |
|-------|-------------|
| **Précision** | Reflète les paramètres navigateur/OS, pas forcément la préférence pour l'app |
| **Variantes** | Codes `"fr"`, `"fr-FR"`, `"fr-CA"` — définir quelles variantes mappent vers quelle locale |
| **Pas de choix explicite** | L'utilisateur ne choisit pas dans l'app ; si la détection est incorrecte, correction difficile |
| **Reproductible** | Même utilisateur, même appareil = même détection (sauf si override stocké) |

### Override recommandé

Conserver une **surcharge manuelle** légère :

- Paramètre d'URL : `?lang=fr`
- Ou valeur en `localStorage` si l'utilisateur a une fois changé la langue

Cela permet :

- **Cas normal** : détection automatique
- **Cas particulier** : l'utilisateur garde sa préférence sans sélecteur visible en permanence

---

## 3. Menu Settings (Paramètres)

Contenu proposé pour le menu Paramètres.

### Section Langue

- Détection automatique activée par défaut
- Option pour forcer une locale manuellement (surcharge de la détection)

### Section Notifications

- Activer/désactiver les notifications in-game
- Son des notifications (si audio implémenté)

### Section Accessibilité

- Contraste renforcé
- Taille de police (petit / normal / grand)
- Réduction des animations (pulse anomalie, transitions)

### Section Affichage

- Format date/heure (12h vs 24h)
- Format des nombres (virgule vs point décimal)
- Unités (UA, al, R⊕, etc.) — à préciser si plusieurs conventions possibles

### Extensions futures

- Volume audio global
- Raccourcis clavier personnalisables (si pertinent)

### Principe

Garder les paramètres **purement techniques ou de préférence** — rien qui brise l’immersion ou l’anonymat.

---

## 4. Menu User Profile (Profil utilisateur)

### Contrainte Lacuna : anonymat

- Pas de pseudo, pas d’avatar, pas de profil social
- Interprétations anonymes : "Génération 7 — vaisseau inconnu"
- Le "profil" correspond au vaisseau / à la civilisation, pas à une identité sociale

### Section Compte

| Élément | Détail |
|---------|--------|
| Email | Affiché (Supabase Auth), non partagé |
| Mot de passe | Lien "Changer le mot de passe" |
| Déconnexion | Bouton de déconnexion |

### Section Mon vaisseau

| Élément | Détail |
|---------|--------|
| Nom du vaisseau | ARCA par défaut, personnalisable |
| Lien Systèmes | Accès rapide au module état technique du vaisseau |

### Section Statistiques personnelles (optionnel)

- Génération actuelle
- Système actuel
- Nombre de traces formalisées

*Ces données restent privées — jamais partagées aux autres joueurs.*

### À éviter

- Avatar, bio, liens sociaux
- Pseudo ou identifiant public
- Historique de voyages partagé

---

## 5. Organisation UI

### Points d’accès proposés

| Menu | Emplacement | Comportement |
|------|-------------|--------------|
| **Settings** | Header — icône engrenage ou libellé "Paramètres" | Ouvre une page ou modale Paramètres |
| **User Profile** | Header — icône utilisateur générique ou "Compte" | Ouvre un dropdown ou modale |

### Contenu du dropdown / modale Profil

1. Bloc **Mon vaisseau** — nom + lien vers Systèmes
2. Bloc **Compte** — email, mot de passe, déconnexion
3. Lien vers **Paramètres** (si menus séparés)

### Variante simplifiée

Fusionner en un seul menu **Paramètres / Compte** pour réduire la complexité :

- Onglets ou sections : Compte | Mon vaisseau | Préférences

---

## Références

- Vue I18n : https://vue-i18n.intlify.dev/
- `navigator.language` / `navigator.languages` : MDN Web API
- Design et anonymat : `LACUNA_UI.md` §10 (Système social)
- Stack technique : `Documentation-technique.md`

---

*LACUNA — Internationalisation, Paramètres & Profil — Mars 2026*
