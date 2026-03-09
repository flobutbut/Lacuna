# LACUNA — État du projet

*Dernière mise à jour : Mars 2026*

---

## Vue d'ensemble

| Composant | Statut | Notes |
|-----------|--------|-------|
| **Git** | ✅ Initialisé | Remote GitHub configuré |
| **Supabase** | ✅ Configuré | Schéma appliqué, seed exécuté |
| **Documentation** | ✅ Créée | Technique, Status, Fonctionnelle |
| **Maquette UI** | ✅ Migrée | Composants Vue |
| **Intégration Vue** | ✅ Faite | Ciel, Header, Panels, Instruments |
| **Auth** | ⏳ À faire | Supabase Auth |
| **Gameplay** | ⏳ À faire | Voyage, traces, journal |

---

## Détail par module

### Backend (Supabase)
- [x] Client installé et configuré
- [x] Schéma SQL (migrations)
- [x] RLS et policies
- [x] Traces immuables (WOW, Oumuamua, Bennu)
- [x] Système Sol
- [ ] Auth (inscription/connexion)
- [ ] Création vaisseau au premier login

### Frontend (Vue)
- [x] Projet Vue 3 + Vite
- [x] Design tokens (tokens.css)
- [x] CSS modulaires (panels, bars, tooltips...)
- [x] Router (pages : Observatoire, Carte, Artefacts, Laboratoire, Journal, Drake, Population, Systèmes)
- [x] Pinia (stores de base)
- [x] Composants UI (Header, Sky, Panels, Instruments, Sidebars)
- [x] Migration maquette HTML → Vue
- [ ] Intégration données Supabase
- [x] Ciel interactif (Canvas 2D)

### Fonctionnalités
- [ ] Onboarding (4 écrans GDD)
- [x] Ciel / Observatoire — clic étoile → TravelWidget (distance, durée, carburant, anomalie, [OUVRIR OBSERVATOIRE] [FIXER CAP]), double-clic → panel Observatoire (corps, probas, Analyser, Ajouter au lab)
- [x] Signaux captés — store signaux (durée de vie temps joueur), bloc panel gauche (cards, tooltip, clic → modale, [×] ignorer), modale signal ([ANALYSER AU LABO →] → Laboratoire), marqueurs directionnels sur le ciel (hover + clic)
- [ ] Sélection système, fixation cap
- [ ] Voyage (logique temps réel)
- [ ] Journal de bord
- [x] Page Artefacts — grille, détail trace, interprétations, suppression (conformité LACUNA_UI)
- [x] Page Laboratoire — 3 colonnes (file d'observations | observation sélectionnée | instruments), clic instrument, rapports + fiabilité, [GARDER UNE TRACE]
- [ ] Carte
- [ ] Équation de Drake (affichage temps réel)
- [x] Page Population — 3 onglets (Générations, Génération actuelle, Registre des Raisons)
- [x] Page Systèmes — plan ARCA SVG, menu 1:1 avec 9 groupes (plasma-shield, bumper-shield, population-quarters, fission-reactors, thermal-radiators, fuel-tanks, propulsion, comms, navigation), highlight sur le plan, overlays par groupe
- [ ] Galaxie procédurale

---

## Prochaines étapes prioritaires

1. **Données Supabase** — Connexion Artefacts, Population, Systèmes
2. **Auth** — Mise en place Supabase Auth + création vaisseau
3. **Onboarding** — Premiers écrans selon GDD
4. **Observatoire complet** — Détail système, scan, fixer cap

---

## Historique des mises à jour

| Date | Modifications |
|------|---------------|
| Mars 2026 | Initialisation projet, Git, Supabase, schéma, seed, documentation |
| Mars 2026 | Migration maquette → Vue (SkyCanvas, Header, Panels, Instruments, design system) |
| Mars 2026 | Navigation par routes — panels convertis en pages pleines (plus d'overlay) |
| Mars 2026 | Page Artefacts (grille + détail, interprétations Supabase, suppression) · Page Population (3 onglets, layout 2 colonnes) · Page Systèmes (plan ARCA, overlay fermable) · Doc LACUNA_UI · Migration interpretations DELETE |
| Mars 2026 | Page Laboratoire — 3 colonnes (observations / sélectionnée / instruments), clic sur instrument, 4 états par instrument, rapports + fiabilité, [GARDER UNE TRACE] |
| Mars 2026 | Observatoire — TravelWidget (clic étoile), panel détail (double-clic), corps + probas anomalie, Analyser → Laboratoire, Ajouter au laboratoire. Store observations partagé. |
| Mars 2026 | Signaux — store signaux (listWithRemaining, add/remove, durée 2h temps joueur), SideLeft bloc Signaux captés (cards, tooltip, modale), SignalModal + [ANALYSER AU LABO →], marqueurs azimut sur SkyCanvas, SignalTooltip. |
| Mars 2026 | Barre instruments — bordures alignées, tab actif avec border-top. Page Systèmes — menu par groupe SVG, highlight plan, overlays par système. |
