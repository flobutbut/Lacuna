*Dernière modification : 2026-03-11 15:11*

# LACUNA — Mapping Interface ↔ Base de données

*Dernière mise à jour : Mars 2026*

Audit des valeurs affichées dans l'interface et de leur source (base ou mock). Objectif : indexer ce qui reste à brancher.

---

## Légende


| Symbole | Signification                                                    |
| ------- | ---------------------------------------------------------------- |
| ✅       | Valeur en base, branchée                                         |
| ❌       | Mock / hardcodé — à implémenter                                  |
| ⏳       | Dépend d'une feature non implémentée (voyages, relativité, etc.) |


---

## Header (AppHeader)


| Affichage             | Source                                | Statut |
| --------------------- | ------------------------------------- | ------ |
| Nom vaisseau          | `ships.name`                          | ✅      |
| Voyage                | `ships.voyage`                        | ✅      |
| Génération            | `ships.generation`                    | ✅      |
| Coordonnées (α, δ, d) | `stellar_systems` (current_system_id) | ✅      |
| N = Drake             | `drake_equation.n`                    | ✅      |


---

## Panel gauche (SideLeft) — Systèmes vaisseau


| Affichage           | Source                               | Statut                                                    |
| ------------------- | ------------------------------------ | --------------------------------------------------------- |
| Propulsion          | `ship_systems.propulsion`            | ✅                                                         |
| Carburant He³       | `ship_systems.he3_current / he3_max` | ✅                                                         |
| Intégrité coque     | `ship_systems.hull`                  | ✅                                                         |
| Bouclier plasma     | `ship_systems.plasma_shield`         | ✅                                                         |
| Systèmes résolus    | —                                    | ❌ Hardcodé "3" — dériver de map_nodes ou systèmes visités |
| Anomalies détectées | —                                    | ❌ Hardcodé "2"                                            |
| Scan en cours       | —                                    | ❌ Hardcodé "ACTIF"                                        |


**Signaux captés** : store `signaux` (mémoire) — pas de persistance signaux en base pour le prototype.

---

## Page Systèmes (Identité)


| Affichage   | Source                  | Statut                                                   |
| ----------- | ----------------------- | -------------------------------------------------------- |
| Nom         | `ships.name`            | ✅                                                        |
| Classe      | `ships.classe`          | ✅                                                        |
| Construit   | `ships.built_year`      | ✅                                                        |
| Âge relatif | —                       | ⏳ Calcul depuis voyages (stationnement étoiles massives) |
| Âge réel    | —                       | ⏳ Temps simulé joueur                                    |
| Écart       | —                       | ⏳ ageReal - ageRelative                                  |
| Masse sèche | `ship_systems.dry_mass` | ✅                                                        |
| Capacité    | `ship_systems.capacity` | ✅                                                        |
| Population  | `populations.total`     | ✅                                                        |
| Génération  | `ships.generation`      | ✅                                                        |


---

## Page Systèmes (onglets techniques)


| Affichage                                    | Source                     | Statut                                                          |
| -------------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| Propulsion, Hull, PlasmaShield               | `ship_systems`             | ✅                                                               |
| Reservoir, Alimentation, Atmosphere, Medical | `ship_systems`             | ✅                                                               |
| Observatory                                  | `ship_systems.observatory` | ✅                                                               |
| He³, Deutérium (tonnes, %)                   | `ship_systems`             | ✅                                                               |
| Vitesse actuelle, Autonomie                  | —                          | ❌ `fuel.speed`, `fuel.autonomy` en dur                          |
| Historique technique                         | —                          | ❌ `history` en dur — future table `ship_systems_history` ou log |


---

## Page Systèmes (fullName, planDesc, blueprintLegend)


| Affichage                | Source                                         | Statut                                                    |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------- |
| fullName                 | "A R C A — AUTONOMOUS RELATIVISTIC COLONY ARK" | ❌ Constant statique (ou `ships.full_name` si on l’ajoute) |
| planDesc                 | "VUE LATÉRALE — ÉCHELLE 1:8000..."             | ❌ Constant (pas critique)                                 |
| Légende systèmes (specs) | —                                              | ❌ Constant (Vitesse 4,8%c, etc.)                          |


---

## Page Population


| Affichage                                                  | Source        | Statut                                                                 |
| ---------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| Génération actuelle (effectif, will, cohesion, food, care) | `populations` | ✅                                                                      |
| heritage, courant                                          | —             | ❌ `populations.culture` / `governance` existent mais heritage hardcodé |
| Générations (startYear, events)                            | —             | ❌ `generations` mock — pas de table `generations`                      |
| Registre des Raisons                                       | —             | ❌ `reasons` mock — pas de table `reasons`                              |


---

## Page Artefacts


| Affichage        | Source                               | Statut                                    |
| ---------------- | ------------------------------------ | ----------------------------------------- |
| Traces immuables | `traces` (origin IMMUABLE)           | ✅                                         |
| Traces joueur    | `tracesStore.playerTraces` (mémoire) | ⏳ Pas lié à ship_traces pour le prototype |
| Interprétations  | `interpretations`                    | ✅                                         |


---

## Page Laboratoire


| Affichage            | Source                    | Statut                                      |
| -------------------- | ------------------------- | ------------------------------------------- |
| File d'observations  | `observations` (Supabase) | ✅                                           |
| Rapports instruments | —                         | Calculés côté client (données synthétiques) |


---

## Page Drake


| Affichage                 | Source             | Statut |
| ------------------------- | ------------------ | ------ |
| R*, fp, ne, fl, fi, fc, L | `drake_equation`   | ✅      |
| N (résultat)              | `drake_equation.n` | ✅      |


---

## Observatoire / Ciel


| Affichage                          | Source                      | Statut |
| ---------------------------------- | --------------------------- | ------ |
| Étoiles (position, distance, type) | `stellar_systems`           | ✅      |
| Objets système (ObservatoirePanel) | `system_objects`            | ✅      |
| TravelWidget (distance, transit)   | Données étoile sélectionnée | ✅      |


---

---

## Carte — onglet Map (vue projetée)

| Donnée | Source | Statut |
|--------|--------|--------|
| Nœuds (systèmes sur la carte) | `map_nodes` (Supabase) | ✅ |
| Liens de transit (voyages) | `ship_travels` (Supabase, MCP ou API) — origin_system_id → destination_system_id | ✅ |
| Visité vs observé | Dérivé : nœud avec au moins une arête = visité ; nœud sans arête = observé uniquement | — |

Un nœud par système. Positionnement par système parent (étoile). Réf. `LACUNA_CARTE_MAP.md`.

---

## Récapitulatif — À faire

### Priorité haute (valeurs déjà en base, à brancher)

- **SideLeft** — Propulsion, He³, Hull, PlasmaShield depuis `ship_systems` ✅
- **Page Drake** — Termes + N depuis `drake_equation` ✅
- **Header** — Coordonnées depuis `current_system_id` + stellar_systems ✅
- **Header** — N Drake depuis `drake_equation` ✅

### Priorité moyenne (nouvelles tables ou champs)

- **fullName** — Colonne `ships.full_name` ou constant par classe
- **fuel.speed, fuel.autonomy** — Calcul ou colonnes `ship_systems`
- **Historique technique** — Table `ship_systems_history` ou log
- **Systèmes résolus / Anomalies** — Dériver de `map_nodes` + stellar_systems.anomaly_level

### Priorité basse (dépendant de features)

- **Âge relatif, Âge réel, Écart** — Voyages + relativité
- **Générations (Population)** — Table `generations` quand système de temps OK
- **Registre des Raisons** — Table `reasons` si gameplay prévu

