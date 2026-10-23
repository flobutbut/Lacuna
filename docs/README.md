*Dernière modification : 2026-10-22*

# Documentation LACUNA

Organisation du dossier de documentation par catégories.

## Structure

| Dossier | Contenu |
|---------|---------|
| **reference/** | Documentation de référence — Technique, Backend, Status, Fonctionnelle (état projet, stack, règles métier, schéma DB) |
| **conception/** | Game design — GDD, arcs, lore, scénarios, physique du voyage, hypothèses, vision |
| **procedural/** | Génération procédurale — modèle de données, planètes, traces (seed, field_sources, lazy generation) |
| **design/** | Design system, spécifications UI (LACUNA_UI, composants) |
| **features/** | Spécifications par feature — Laboratoire (instruments), extrapolation instrumentale, notifications ; TODOs (Transit, Carte Map) |
| **config/** | Configuration et catalogues — i18n, mécanique des traces (LACUNA_TRACES), fiches des traces immuables (LACUNA_TRACES_IMMUABLES) |
| **architecture/** | Schémas techniques, mapping DB, propositions (Interface-DB-mapping, Observatoire, secteurs) |
| **analyses/** | Analyses techniques, diagnostics, rapports d’import |
| **audits/** | Audits de code (AUDIT_*), diagnostics ciblés (DIAGNOSTIC_*) |
| **assets/** | Ressources — SVG, maquettes HTML, JSON |
| **archive/** | Versions retirées, conservées pour mémoire (LACUNA_TRACES v0.9) |

Les documents de conception sont tenus en cohérence avec le projet Claude « Lacuna » (dernière synchronisation : 2026-10-22). Le fichier `LACUNA_GDD.md` correspond à `LACUNA_GDD_v04.md` dans le projet.

## Documents de référence

- **Documentation-technique.md** — Stack, structure projet, imports
- **Documentation-status.md** — État du projet, historique
- **Documentation-fonctionnelle.md** — Spécifications fonctionnelles
- **Documentation-backend.md** — Schéma DB, migrations, RLS

Ces fichiers sont à consulter régulièrement pour l'état et les spécifications du projet.
