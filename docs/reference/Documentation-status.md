*Dernière modification : 2026-10-23*

# LACUNA — État du projet

*Dernière mise à jour : Mars 2026*

---

## Vue d'ensemble

| Composant | Statut | Notes |
|-----------|--------|-------|
| **Git** | ✅ Initialisé | Remote GitHub configuré |
| **Supabase** | ✅ Configuré | Schéma appliqué, seed exécuté |
| **Documentation** | ✅ Créée | Technique, Backend, Status, Fonctionnelle, Interface-DB-mapping, LACUNA_I18N_SETTINGS ; conception : LACUNA_GDD, LACUNA_ARCS, LACUNA_LORE, LACUNA_SCENARIOS, LACUNA_PHYSICS ; config : LACUNA_TRACES ; procédural (docs/procedural/) : LACUNA_PROCEDURAL_DATA_MODEL, LACUNA_PROCEDURAL_PLANETS, LACUNA_PROCEDURAL_TRACES ; features : LACUNA_LABORATOIRE_INSTRUMENTS, LACUNA_INSTRUMENTAL_EXTRAPOLATION, LACUNA_NOTIFICATIONS, LACUNA_VUE_3D_ETOILES_CONCEPTION |
| **Maquette UI** | ✅ Migrée | Composants Vue |
| **Intégration Vue** | ✅ Faite | Ciel, Header, Panels, Instruments |
| **Auth** | ✅ Fait | Email + mot de passe, confirmation obligatoire, un vaisseau par compte, RLS par joueur (`docs/architecture/PLAN_COMPTES_JOUEURS.md`) |
| **Gameplay** | ⏳ À faire | Voyage, traces, journal |

---

## Détail par module

### Backend (Supabase)
- [x] Client installé et configuré
- [x] Schéma SQL (migrations)
- [x] RLS et policies
- [x] Traces immuables (WOW, Oumuamua, Bennu + PROXIMA-001, BARNARD-001, ROSS128-001, EPSILON-001, TAU-CETI-001, GLIESE667-001)
- [x] Systèmes stellaires — Base distante (audit 2026-03-16) : **48 195** stellar_systems, **2 155** system_objects. Répartition stellar_systems par object_type : STAR 43 775, PULSAR 3 918, WHITE_DWARF 500, BLACK_HOLE 2. Répartition system_objects : PLANET 2 052, STAR 97, DEBRIS_DISK 4, NEUTRON_STAR 1. (PULSAR supprimé — migration 00035.) Système solaire détaillé (Soleil + 8 planètes : Mercure→Neptune).
- [x] Support constellations — stellar_systems.constellation_abbr (HYG colonne con), table constellations (88 IAU), constellation_lines (stick-figures IAU). Migration 00025. Source : constellation.shapes.iau.txt (paires HR explicites). Scripts : complete_hyg_fields.py (con→constellation_abbr), populate_constellations.py (88 constellations + segments HR→stellar_systems via HYG).
- [x] Patch HYG (hyg_patch.py) — 55 systèmes mis à jour (constellation_abbr, luminosity, color_index) depuis HYG v42.
- [x] Patch NASA âge (nasa_age_patch.py) — 647 systèmes mis à jour (age en Ga) depuis NASA Exoplanet Archive st_age.
- [x] Patch constellation (constellation_patch.py) — 363 systèmes mis à jour (constellation_abbr depuis x/y/z, IAU astropy).
- [x] Patch coordonnées (coords_patch.py) — 651 systèmes mis à jour (coordinates x/y/z + constellation depuis NASA TAP).
- [x] Déduplication stellar_systems (dedup_stellar_systems.py) — 37 doublons supprimés (43 813 → 43 776).
- [x] Déduplication system_objects (dedup_system_objects.py) — 992 doublons supprimés (3 260 → 2 268).
- [x] Résolution conflits (resolve_conflicts.py) — Rapport NASA default_flag=1 vs doublons en base (dry-run).
- [x] Patch luminosity (luminosity_patch.py) — 367 systèmes (luminosité extrapolée depuis spectral_type, EXTRAPOLATED).
- [x] Patch Gaia DR3 (gaia_patch.py) — ~4 944 systèmes (color_index bp_rp, age estimation HR, matching HIP + cone search).
- [x] Patch ATNF (atnf_pulsar_patch.py) — 2 945 pulsars (coordinates, distance, attributes, age depuis ATNF Catalogue). Total 3 918 pulsars en base (stellar_systems.object_type).
- [x] Table observations (file Laboratoire) — persistée en base, rattachée au vaisseau du joueur (ship_id)
- [x] Auth (inscription, confirmation d'email, connexion, mot de passe oublié) — store auth, garde de routeur
- [x] Vaisseau du joueur — current_system_id, store ship, Header/PageSystemes, table ship_systems. Prototype ARCA partagé supprimé (migration 00048).
- [x] Création de partie au premier login — écran /bienvenue (pseudo, nom du vaisseau), RPC start_new_game
- [x] Modèle Option A validé — sources de signaux : objets émetteurs (PULSAR, NEUTRON_STAR, MAGNETAR) dans system_objects ; événements transients dans signal_events ; table signals. Doc backend mise à jour.
- [x] Migrations Option A — migration 00005 (extension system_objects, signal_events, signals). Seed : système PSR_B1919 (pulsar via stellar_systems.object_type, pas d'objet system_objects).
- [x] Store signaux branché sur table signals (fetch + INSERT). Migration 00011 : colonne anomalous sur observations. Support dérivé depuis la source (SignalModal). Seed signaux démo (seed-demo), clonage à la première visite. captureFromSystemObjects() pour objets émetteurs du système courant.

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
- [x] Unification coordonnées x/y/z — stellar_systems et nebulas en référentiel galactique (Sol à l'origine). Migration 00018. Projection ciel depuis viewerCoords (système courant).
- [x] Observatoire : vue Ciel profond / Système (onglets) — vue Système : étoile (SVG), planètes (grille 3 col ou ordre orbital), zone habitable (Kopparapu)
- [x] Observatoire : vue Radar — spectrogramme temps réel + courbe d'intensité, pause/scroll, sélection zone (col×bin), bouton RETOUR AU LIVE, reprise via visibilitychange

### Fonctionnalités
- [x] Onboarding — écrans 1 à 4 avant le nommage, écran 5 en visite de sept étapes sur le ciel, traces embarquées (`LACUNA_LORE.md` §3–5, migration 00071) ; notice de bord à écrire
- [x] Ciel / Observatoire — clic étoile → TravelWidget (distance, durée, carburant, anomalie, [OUVRIR OBSERVATOIRE] [FIXER CAP]), double-clic → panel Observatoire (corps, probas, Analyser, Ajouter au lab)
- [x] Signaux captés — store signaux (durée de vie temps joueur), bloc panel gauche (cards, tooltip, clic → modale, [×] ignorer), modale signal ([ANALYSER AU LABO →] → Laboratoire), marqueurs directionnels sur le ciel (hover + clic)
- [x] Sélection système, fixation cap — TravelWidget, vue de confirmation du départ
- [x] Voyage — transit décidé par le serveur (start_transit / complete_transit, 00050), quatre phases, historique ship_travels ; pas encore : détection en transit, déviation, carburant consommé
- [x] Journal de bord — entrées écrites par le serveur (fondatrice, départ, arrivée, ciel de départ, premier passage de génération), entrées du joueur, filtre par type (00068, 00069)
- [x] Calendrier du vaisseau et générations — date de bord depuis 2041, génération = 1 + années ÷ 25 (00068, 00069)
- [x] Ciel de départ — supernova de Bételgeuse (SN-001), signal de 22 minutes (LPT-001), détecteur et analyseur de neutrinos, sources de départ au Radar (00062–00067)
- [x] Page Artefacts — grille, détail trace, interprétations, suppression (conformité LACUNA_UI)
- [x] Page Laboratoire — 2 colonnes (file d'observations | observation sélectionnée avec barre d'instruments), clic instrument, rapports + fiabilité, « Créer un artefact », sorties visuelles : spectrogramme, structure temporelle, polarisation, spectre énergétique, gravimétrique, spectre stellaire, analyseur orbital, spectromètre atmosphérique (profil moléculaire)
- [x] Carte — 3 colonnes (planètes | carte | détails), store mapNodes, ajout depuis Observatoire/Labo, suppression, tooltip, visited ciel
- [x] Équation de Drake — affichage Header + Page Drake (valeurs de référence, 00053) ; pas encore : recalcul selon les découvertes collectives
- [x] Page Population — 3 onglets (Générations, Génération actuelle, Registre des Raisons)
- [x] Page Systèmes — plan ARCA SVG, menu 1:1 avec 9 groupes (plasma-shield, bumper-shield, population-quarters, fission-reactors, thermal-radiators, fuel-tanks, propulsion, comms, navigation), highlight sur le plan, overlays par groupe
- [ ] Galaxie procédurale
- [x] Vue 3D étoiles (conception) — `/conception-etoiles`, Three.js, barycentre origine, zoom/dézoom, recherche + focus

---

## Couverture des champs (base Supabase — 2026-03-16)

| Champ | Table | Couverture |
|-------|-------|------------|
| color_index | stellar_systems | 87,3 % |
| age | stellar_systems | 14,8 % |
| luminosity | stellar_systems | 90,0 % |
| constellation_abbr | stellar_systems | 100 % |
| coordinates | stellar_systems | 100 % |
| object_type | stellar_systems | 100 % |
| atmosphere_composition | system_objects | 1,0 % |

---

## Prochaines étapes prioritaires

1. **Avant une mise en ligne** — liste priorisée dans `docs/architecture/PLAN_COMPTES_JOUEURS.md` §9 (emails, RGPD, anti-triche, migrations, sauvegardes, hébergement)
2. **Voyage** — détection en transit, déviation, carburant consommé (`LACUNA_TRANSIT.md` §6–7)
3. **Scénarios 03 à 08** et traces hors scénario ; entrées de Yael (textes à écrire)
4. **Fil de notifications** (`LACUNA_NOTIFICATIONS.md`)

---

## Historique des mises à jour

| Date | Modifications |
|------|---------------|
| Mars 2026 | Initialisation projet, Git, Supabase, schéma, seed, documentation |
| Mars 2026 | Migration maquette → Vue (SkyCanvas, Header, Panels, Instruments, design system) |
| Mars 2026 | Navigation par routes — panels convertis en pages pleines (plus d'overlay) |
| Mars 2026 | Page Artefacts (grille + détail, interprétations Supabase, suppression) · Page Population (3 onglets, layout 2 colonnes) · Page Systèmes (plan ARCA, overlay fermable) · Doc LACUNA_UI · Migration interpretations DELETE |
| Mars 2026 | Page Laboratoire — 3 colonnes (observations / sélectionnée / instruments), clic sur instrument, 4 états par instrument, rapports + fiabilité, « Créer un artefact » |
| Mars 2026 | Observatoire — TravelWidget (clic étoile), panel détail (double-clic), corps + probas anomalie, Analyser → Laboratoire, Ajouter au laboratoire. Store observations partagé. |
| Mars 2026 | Signaux — store signaux (listWithRemaining, add/remove, durée 2h temps joueur), SideLeft bloc Signaux captés (cards, tooltip, modale), SignalModal + [ANALYSER AU LABO →], marqueurs azimut sur SkyCanvas, SignalTooltip. |
| Mars 2026 | Barre instruments — bordures alignées, tab actif avec border-top. Page Systèmes — menu par groupe SVG, highlight plan, overlays par système. |
| Mars 2026 | Doc LACUNA_LABORATOIRE_INSTRUMENTS — distinction capteurs (à bord) / instruments (Laboratoire). Ajout 5 instruments d'analyse pour signaux. LACUNA_TRACES v0.8, LACUNA_UI mis à jour. |
| Mars 2026 | Page Laboratoire — instruments conformes à la doc (5 analyseurs signaux + 8 observation). Filtrage par type/support. Champ support sur observations SIGNAL. |
| Mars 2026 | Stack visualisation Laboratoire : D3.js + spectrogram-js. Thématisation typos/couleurs via tokens.css. Doc technique + LACUNA_LABORATOIRE_INSTRUMENTS mis à jour. |
| Mars 2026 | Sortie spectrogramme pour l'analyseur spectral — LabReportSpectrogram (spectrogram-js, viridis), spectrogramData.js (données synthétiques seed obsId), intégration PageLaboratoire, durationSec sur observations SIGNAL. |
| Mars 2026 | Sortie structure temporelle — LabReportStructureTemporelle (forme d'onde + autocorrélation, D3), génération pulsée optionnelle, intégration PageLaboratoire. |
| Mars 2026 | Sortie polarisation — LabReportPolarisation (ellipse + paramètres Stokes I/Q/U/V), polarisationData.js, intégration PageLaboratoire. |
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
| Mars 2026 | composables/useStoreReady.js — ensureStoresLoaded() centralise le pattern "if (!store.loaded) await store.fetch()". AppHeader, SideLeft, PageDrake, PageLaboratoire, PageSystemes, SystemView, SkyCanvas mis à jour. |
| Mars 2026 | Flux signaux Supabase — store signaux branché sur table signals (fetch, addSignal→INSERT, removeSignal→DELETE). Migration 00011 anomalous sur observations. SignalModal dérive support depuis la source. Seed signaux démo (PSR B1919+21, 1420 MHz, 408 MHz), clonage pour nouvelles sessions. captureFromSystemObjects() pour objets émetteurs. lib/session.js, formatUtils (formatFrequency, parseFrequency). |
| Mars 2026 | Couche conversion — astroConstants.js, systemObjectConverters.js (toPhysicalUnits, toVisualParams, toLuminosityAndHz). bodyRadius, orbitalUtils, ringUtils refactorés pour utiliser astroConstants. SystemView branché sur convertisseurs. Dépendances mises à jour (yarn upgrade). |
| Mars 2026 | Documentation-backend.md — migrations 00011–00014 documentées : observations (anomalous, structure), lab_reports, system_objects (composition, anneaux, orbital_semi_major_axis_km), seed SOL enrichi. |
| Mars 2026 | LACUNA_I18N_SETTINGS.md — doc dédiée i18n (Vue I18n, locales), détection automatique langue (navigator.languages), menu Settings (langue, notifications, accessibilité, affichage), menu User Profile (compte, mon vaisseau, stats perso, anonymat). |
| Mars 2026 | Analyseur gravimétrique — LabReportGravimetrique.vue (schéma sources + courbe résidus, D3), gravimetriqueData.js. Signal GRAVITATIONNEL ou données orbitales (PLANETE, MINEUR, OBJET). LACUNA_LABORATOIRE_INSTRUMENTS mis à jour. |
| Mars 2026 | Seed signaux gravitationnels — stellar_system GW_REGION_A, signal_event (GW), system_object (NEUTRON_STAR emission_support GRAVITATIONNEL). 2 signaux GRAVITATIONNEL en base (EVENT + OBJECT). |
| Mars 2026 | Tooltips Observatoire harmonisés — composant ObservatoireTooltip.vue commun (format rows, status, actionLabel), StarTooltip, SignalTooltip, SystemView refactorisés pour l'utiliser. Styles unifiés (panel, border-bright, cyan/amber). |
| Mars 2026 | Cards unifiées — ObservationCard.vue pour signaux (SideLeft Observatoire) et observations (PageLaboratoire : signal, système, astre). Props iconType/iconValue, title, rows, badge, progress, state. Styles obsolètes signal-card et lab-observation-item supprimés. |
| Mars 2026 | Composants menu/barre — NavMenuItem (variants menu, slot) : menu Systèmes + Population (items pleine largeur), grille Artefacts. NavTabButton (barre navigation). InstrumentButton (grille boutons carrés, Laboratoire, réutilisable). PageLaboratoire : instruments via InstrumentButton. constants/menus.js : SYSTEMS_MENU_ITEMS, POPULATION_MENU_ITEMS, INSTRUMENTS, TRACE_ICONS. |
| Mars 2026 | Script import stellaires — stellar_import/ (HYG + NASA Exoplanet Archive). parse_hyg, parse_nasa, upsert_systems, upsert_objects, report. Lots 500, progression import_progress.json, rapport stellar_import/import_report.md. Migration 00016 (luminosity, color_index, apparent_magnitude, has_magnetic_field, surface_temperature_k, atmosphere_composition, magnetic_field_detected). |
| Mars 2026 | Page Carte — store mapNodes (Supabase), layout 3 colonnes (planètes | carte | détails), graphe nœuds/arêtes x/y/z, sélection cliquable, ObservatoireTooltip, PlanetSvgInline, détails planète + rapports lab, suppression nœud. Observatoire + Labo : bouton « Ajouter à la carte ». useSkyStars : visited depuis map_nodes. Migration 00022 : anon policy map_nodes/edges. |
| Mars 2026 | Unification coordonnées x/y/z — Migration 00018 : stellar_systems (97) et nebulas (4) convertis de ra/dec vers x/y/z (référentiel galactique, Sol origine). useSkyStars, projectNebulaShape, ObservatoireSpectralFilters : projection depuis viewerCoords. SkyCanvas watch currentSystemId pour recalcul. |
| Mars 2026 | Chargement étoiles en deux passes — Migration 00019 : RPC get_visible_systems pagination (p_magnitude_min, p_limit, p_offset). Passe 1 : mag≤8 (5000). Passe 2 : mag 8–18 par pages de 5000. Indicateur "CATALOGUE EN COURS…" en bas à gauche. Filtres spectraux en local. |
| Mars 2026 | stellar_import — Option --fix-ids pour réimport ciblé (Sirius, PROXIMA, ROSS128, TAU_CETI). Correction champs NULL (apparent_magnitude, luminosity, coordinates x/y/z) : migration 00016 ajoutée après import initial. Script check_systems.py pour diagnostic. LACUNA_ID_MAP étendu (gl-gl-71 → TAU_CETI), LACUNA_DISPLAY_NAMES pour noms préférés. |
| Mars 2026 | Migration 00020 — Correction SOL (coordinates x/y/z = 0, apparent_magnitude -26.74, luminosity 1.0). Sol exclu de l'import HYG (dist=0) ; nécessaire pour afficher Sol quand le joueur stationne ailleurs. Règle d'affichage : le système courant (current_system_id) est toujours masqué du ciel — doc LACUNA_UI clarifiée. |
| Mars 2026 | Recherche "tau" / tooltip "Gliese" — Diagnostic : doublon gl-gl-71 (HYG) + TAU_CETI (seed) à la même position. Suppression gl-gl-71 (migration 00021). Scripts diagnose_names.py, check_duplicate_systems.py. |
| Mars 2026 | Vue 3D étoiles (conception) — Page /conception-etoiles (hors interface jeu), Three.js + OrbitControls, barycentre comme origine, zoom/dézoom, recherche + focus caméra. useStars3DConception, Stars3DCanvas, design system. |
| Mars 2026 | Refactoring Observatoire / Vue 3D — constants/starDisplay.js, lib/stellarCoordinates.js, composables useStellarSearch et useStarTooltipData. ObservatoireSpectralFilters migré vers useStellarSearch. StarTooltip vers useStarTooltipData. skyRenderers et Stars3DCanvas utilisent starDisplay. |
| Mars 2026 | Vue 3D conception — sprites circulaires (lib/starSpriteTexture.js), lignes constellation, désélection (bouton × et clic vide). useStellarSearch onClearFocus. lib/constellationSegments.js partagé. STAR_SPRITE_BASE_SIZE, STAR_SPRITE_MIN_PIXELS. |
| Mars 2026 | Sélection manuelle étoile — useStarSelection (observatoire / standalone), clic étoile Vue 3D (raycast), clic étoile Observatoire (highlight + centrage). |
| Mars 2026 | composables/useTransitLines3d.js — Lignes de transit 3D (LineSegments, opacité 0.45) extraites. CarteMap3D et Stars3DCanvas utilisent buildTransitLinesMesh(segments, positionsById). Documentation-technique.md mise à jour. |
| 2026-03-19 | Patch stellaires appliqués — hyg_patch.py : 55. nasa_age_patch.py : 647 (age). constellation_patch.py : 363 (constellation). coords_patch.py : 651 (coordinates x/y/z depuis NASA TAP). Scripts utilitaires : analyze_unmatched_hyg.py, nasa_systems_by_distance.py, analyze_nasa_age_matching.py. |
| 2026-03-20 | Déduplication stellar_systems — dedup_stellar_systems.py : 37 doublons supprimés (43 813 → 43 776), 73 champs transférés, 81 FK redirigées. |
| 2026-03-20 | Déduplication system_objects — dedup_system_objects.py : 992 doublons supprimés (3 260 → 2 268), 34 conflits catégorie B loggés. |
| 2026-03-20 | Patch luminosity — luminosity_patch.py : 367 systèmes (luminosité extrapolée depuis spectral_type). |
| 2026-03-20 | Patch Gaia DR3 — gaia_patch.py : ~4 944 systèmes (color_index, age depuis Gaia DR3, matching HIP + cone search). |
| 2026-03-21 | simbad_exotic_import.py : 4 419 créés (WD, PSR, BH) ; atnf_pulsar_patch.py : 2 945 pulsars. |
| 2026-03-15 | Documentation Vue Radar — Documentation-technique (section RadarView), -status, -fonctionnelle. |
| 2026-03-16 | Audit documentation — stats réelles : 48 195 stellar_systems, 2 155 system_objects ; couverture champs (color_index 87,3 %, age 14,8 %, luminosity 90 %, constellation/coords/object_type 100 %, atmosphere_composition 1 %) ; resolve_conflicts. |
| 2026-10-21 | Audit global (docs/audits/AUDIT_GLOBAL_2026-10-21.md) et lots 1–3 : bugs, code mort, ESLint / Prettier / Vitest, tokens couleur, stores par domaine (observatoire, radar, transit, notifications), scène Three.js partagée, CSS par page. |
| 2026-10-21 | Comptes joueurs (migrations 00046–00048) : inscription / connexion par email, écran Bienvenue à bord (pseudo et vaisseau privés), données rattachées au vaisseau, RLS par joueur, suppression du prototype, identité modifiable, Vue 3D réservée aux admins. |
| 2026-10-22 | Mise en cohérence de la documentation de conception avec le projet Claude « Lacuna » : GDD v0.5, Lore v0.4, Arcs v0.3, Hypothèses v0.2, Scénarios v0.5, Transit v0.4, Physique v0.2, Traces v1.3, nouveau `config/LACUNA_TRACES_IMMUABLES.md`, Traces v0.9 archivée (`archive/`), Notifications v0.3 ; onboarding : 5 écrans |
| 2026-10-23 | Scénarisation jouable : Fil des 75 en base, émetteurs à fenêtres, halo de signal, ciel de départ (SN-001, LPT-001, neutrinos, sources de départ au Radar), journal de bord, calendrier du vaisseau, générations, onboarding (migrations 00052–00071) ; fonctionnalités et prochaines étapes mises à jour. |
