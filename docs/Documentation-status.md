# LACUNA — État du projet

*Dernière mise à jour : Mars 2026*

---

## Vue d'ensemble

| Composant | Statut | Notes |
|-----------|--------|-------|
| **Git** | ✅ Initialisé | Remote GitHub configuré |
| **Supabase** | ✅ Configuré | Schéma appliqué, seed exécuté |
| **Documentation** | ✅ Créée | Technique, Backend, Status, Fonctionnelle, Interface-DB-mapping |
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
- [x] Traces immuables (WOW, Oumuamua, Bennu + PROXIMA-001, BARNARD-001, ROSS128-001, EPSILON-001, TAU-CETI-001, GLIESE667-001)
- [x] Systèmes stellaires prototype (9 de base) + ~90 systèmes étendus (Lalande 21185, TRAPPIST-1, 55 Cancri, Kepler-452, etc.) — données NASA/Wikipedia, coordonnées ra/dec. Base distante : 98 stellar_systems + 272 system_objects. Système solaire détaillé (Soleil + 8 planètes : Mercure→Neptune).
- [x] Table observations (file Laboratoire) — session_id pour prototype sans auth, persistée en base
- [ ] Auth (inscription/connexion)
- [x] Vaisseau prototype ARCA — current_system_id, store ship, Header/PageSystemes. Table ship_systems (systèmes, carburant, capacités).
- [ ] Création vaisseau au premier login (avec auth)
- [x] Modèle Option A validé — sources de signaux : objets émetteurs (PULSAR, NEUTRON_STAR, MAGNETAR) dans system_objects ; événements transients dans signal_events ; table signals. Doc backend mise à jour.
- [x] Migrations Option A — migration 00005 (extension system_objects, signal_events, signals). Seed : système PSR_B1919 + pulsar PSR B1919+21.

### Frontend (Vue)
- [x] Projet Vue 3 + Vite
- [x] Design tokens (tokens.css)
- [x] CSS modulaires (panels, bars, tooltips...)
- [x] Router (pages : Observatoire, Carte, Artefacts, Laboratoire, Journal, Drake, Population, Systèmes)
- [x] Pinia (stores de base)
- [x] Composants UI (Header, Sky, Panels, Instruments, Sidebars)
- [x] Migration maquette HTML → Vue
- [x] Intégration données Supabase (Artefacts, Population, Ciel)
- [x] Ciel interactif (Canvas 2D) — alimenté par stellar_systems si Supabase configuré, sinon fallback procédural
- [x] Observatoire : filtre systèmes visibles (RPC get_visible_systems) — magnitude apparente selon spectral_type + distance 3D depuis current_system_id
- [x] Observatoire : pan (drag souris, flèches clavier), lignes horizontales courbes (effet dôme)
- [x] Observatoire : FOV 120° — projection stéréographique, filtrage front des systèmes hors champ, pan = direction de vue (ra, dec)
- [x] Observatoire : indicateur azimut (α, δ) direction de vue, réf. ICRS
- [x] Observatoire : filtres spectraux (Visuel, IR, UV, R) — filtrage par bande, teinte visuelle
- [x] Observatoire : recherche étoile (centrage + highlight)
- [x] Observatoire : vue Ciel profond / Système (onglets) — vue Système : étoile (SVG), planètes (grille 3 col ou ordre orbital), zone habitable (Kopparapu)

### Fonctionnalités
- [ ] Onboarding (4 écrans GDD)
- [x] Ciel / Observatoire — clic étoile → TravelWidget (distance, durée, carburant, anomalie, [OUVRIR OBSERVATOIRE] [FIXER CAP]), double-clic → panel Observatoire (corps, probas, Analyser, Ajouter au lab)
- [x] Signaux captés — store signaux (durée de vie temps joueur), bloc panel gauche (cards, tooltip, clic → modale, [×] ignorer), modale signal ([ANALYSER AU LABO →] → Laboratoire), marqueurs directionnels sur le ciel (hover + clic)
- [ ] Sélection système, fixation cap
- [ ] Voyage (logique temps réel)
- [ ] Journal de bord
- [x] Page Artefacts — grille, détail trace, interprétations, suppression (conformité LACUNA_UI)
- [x] Page Laboratoire — 3 colonnes (file d'observations | observation sélectionnée | instruments), clic instrument, rapports + fiabilité, [GARDER UNE TRACE], sortie spectrogramme pour l'analyseur spectral (signaux)
- [ ] Carte
- [ ] Équation de Drake (affichage temps réel)
- [x] Page Population — 3 onglets (Générations, Génération actuelle, Registre des Raisons)
- [x] Page Systèmes — plan ARCA SVG, menu 1:1 avec 9 groupes (plasma-shield, bumper-shield, population-quarters, fission-reactors, thermal-radiators, fuel-tanks, propulsion, comms, navigation), highlight sur le plan, overlays par groupe
- [ ] Galaxie procédurale

---

## Prochaines étapes prioritaires

1. **Auth** — Mise en place Supabase Auth + création vaisseau
2. **Onboarding** — Premiers écrans selon GDD
3. **Observatoire complet** — Détail système, scan, fixer cap
4. **Migrations Option A** — signal_events, signals, extension system_objects (émetteurs permanents)

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
| Mars 2026 | Doc LACUNA_LABORATOIRE_INSTRUMENTS — distinction capteurs (à bord) / instruments (Laboratoire). Ajout 5 instruments d'analyse pour signaux. LACUNA_TRACES v0.8, LACUNA_UI mis à jour. |
| Mars 2026 | Page Laboratoire — instruments conformes à la doc (5 analyseurs signaux + 8 observation). Filtrage par type/support. Champ support sur observations SIGNAL. |
| Mars 2026 | Stack visualisation Laboratoire : D3.js + spectrogram-js. Thématisation typos/couleurs via tokens.css. Doc technique + LACUNA_LABORATOIRE_INSTRUMENTS mis à jour. |
| Mars 2026 | Sortie spectrogramme pour l'analyseur spectral — LabReportSpectrogram (spectrogram-js, viridis), spectrogramData.js (données synthétiques seed obsId), intégration PageLaboratoire, durationSec sur observations SIGNAL. |
| Mars 2026 | Sortie structure temporelle — LabReportStructureTemporelle (forme d'onde + autocorrélation, D3), génération pulsée optionnelle, intégration PageLaboratoire. |
| Mars 2026 | Seed prototype — 8 systèmes stellaires (Sol, Proxima, Barnard, Ross 128, Epsilon Eridani, Tau Ceti, Gliese 667C, HD 44594) + 6 traces voisinage (PROXIMA-001, BARNARD-001, ROSS128-001, etc.). SkyCanvas branché sur stellar_systems Supabase (projection ra/dec). Store stellarSystems. Fallback procédural si Supabase absent. |
| Mars 2026 | Table observations en base — migration 00003. Store observations : fetch/insert/update/delete via Supabase. session_id (localStorage) pour prototype sans auth. Persistance de la file d'observations Laboratoire. |
| Mars 2026 | Table system_objects — migration 00004. Objets des systèmes (étoiles, planètes, disques) avec propriétés (orbite, atmosphère, zone habitable). Seed pour 8 systèmes. Store systemObjects. ObservatoirePanel branché sur system_objects quand disponible. |
| Mars 2026 | Modèle Option A validé — sources de signaux (objets émetteurs vs événements transients). Documentation-backend.md mis à jour : system_objects (PULSAR, NEUTRON_STAR, MAGNETAR, colonnes émission), signal_events, signals. |
| Mars 2026 | Migration 00005 — Option A implémentée : extension system_object_type, colonnes émission, tables signal_events et signals. Seed : système PSR_B1919, pulsar PSR B1919+21. |
| Mars 2026 | ~90 systèmes stellaires étendus : données scientifiques (NASA Exoplanet Archive, Wikipedia). Lalande 21185, TRAPPIST-1, 55 Cancri, Kepler-452, etc. scripts/starSystemsData.js + generateExtendedSeed.js. Total ~100 systèmes. |
| Mars 2026 | Base Supabase distante — 98 stellar_systems + 264 system_objects (étoiles + planètes) insérés via MCP execute_sql. seed_extended_systems.sql appliqué. |
| Mars 2026 | Vaisseau ARCA — migration 00006 (current_system_id, systems étendus), seed prototype, store ship, Header + PageSystemes branchés. Nom personnalisable à l'avenir. |
| Mars 2026 | Audit Interface-DB — doc Interface-DB-mapping.md : valeurs en base vs mock, index des tâches restantes (SideLeft, Drake, coords Header, etc.). |
| Mars 2026 | Branchements UI↔DB : SideLeft (propulsion, He³, hull, plasma depuis ship_systems), Page Drake + Header (drake_equation), Header coords (stellar_systems + current_system_id). Store drake.js. |
| Mars 2026 | Naines brunes L/T/Y (LUHMAN16, WISE0855) + table nebulas (formes ellipse/polygone). Store nebulas, projection SkyCanvas. Filtre IR : objets IR-only. |
| Mars 2026 | Optimisation Observatoire — lib/stellarProjection.js, lib/skyRenderers.js, composables/useSkyStars.js. SkyCanvas refactorisé. views/observatoire/ créé. |
| Mars 2026 | formatUtils.js — barWidth, formatDate, barClass, valClass, formatRaDec extraits. PageSystemes, PagePopulation, PageArtefacts, SideLeft, ObservatoireAzimuth mis à jour. |
| Mars 2026 | formatRelativeTime ajouté à formatUtils. constants/objectTypes.js créé (OBJECT_TYPE_LABELS). SideLeft, PageDrake, ObservatoirePanel, PageLaboratoire, systemObjects mis à jour. |
