# LACUNA — Carte : onglet Map (vue projetée)

*Version 0.1 — Mars 2026*

> Spécification de l’onglet **Map** de la vue Carte : vue projetée des systèmes (nœuds), des transits (liens) et distinction visité / observé. À lire avec `LACUNA_TRANSIT.md`, `LACUNA_UI.md` et `Interface-DB-mapping.md`.

---

## Périmètre

- **Onglets Carte** : **System** (vue système actuelle, orbites + barre lecture) et **Map** (vue projetée).
- Contenu Map : uniquement les systèmes et planètes **présents sur la carte** (mécanique d’ajout depuis l’Observatoire déjà en place). Positionnement des nœuds par **système parent** (étoile).

---

## Source des données — Supabase (accès MCP ou API)

| Donnée | Table | Usage |
|--------|--------|--------|
| **Nœuds** | `map_nodes` | Un nœud par système (system_id, name, visited_at, generation, etc.). |
| **Transits (liens)** | `ship_travels` | Un enregistrement par voyage terminé : `origin_system_id` → `destination_system_id` (departure_at, arrival_at, distance_al, voyage_number, ship_id). Source des **arêtes** de la vue Map. |
| **Arêtes dérivées** | — | Les liens affichés sur la Map sont dérivés de `ship_travels` (origine → destination). Optionnel : table `map_edges` si elle est alimentée en miroir (from_system, to_system, travel_time, generation). |

Accès : base Supabase du projet, via MCP (ex. `execute_sql`) ou via l’API cliente (store / services) dans l’app.

---

## Règles d’affichage

- **Un nœud par système** : chaque système présent sur la carte est un seul nœud (pas de sous-nœuds par planète dans la vue Map).
- **Visité vs observé** : la différence est portée par la **présence des liens de transit** :
  - **Visité** : système ayant au moins un transit (entrant ou sortant) dans `ship_travels` pour le vaisseau courant → au moins une arête connectée au nœud.
  - **Observé** : système présent dans `map_nodes` mais sans aucune arête (jamais atteint par un voyage) → ajouté depuis l’Observatoire uniquement.

Aucun libellé distinct « visité » / « observé » n’est nécessaire : le graphe (nœuds + arêtes) suffit à lire le statut.

---

## Documents liés

- `LACUNA_TRANSIT.md` — définition du transit (voyage), modèle `travelState`, `ship_travels`.
- `Interface-DB-mapping.md` — mapping Carte / Map et sources Supabase.
- `Documentation-backend.md` — schéma `ship_travels`, `map_nodes`, `map_edges`, RLS.
