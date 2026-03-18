# Todo — Carte : onglet Map (vue projetée)

*Dernière mise à jour : 2026-03*

Plan d’action pour l’onglet **Map** de la vue Carte (vue projetée : nœuds + transits, visité vs observé). Réf. `LACUNA_CARTE_MAP.md`, `Interface-DB-mapping.md`.

---

## Contexte

- **Onglets Carte** : **System** (actuel) et **Map** (nouvelle vue projetée).
- **Données** : nœuds = `map_nodes` (store existant) ; liens = `ship_travels` (store ship : `travels`, `fetchTravels()`).
- **Visité** = nœud avec au moins une arête (transit) ; **observé** = nœud sans arête.
- **Positionnement** : par système parent (coordonnées stellaires, ex. `stellar_systems.coordinates`).

---

## Plan d’action

### Phase 1 — Structure et données

- [x] **1.1** Ajouter les onglets **System** / **Map** dans `PageCarte.vue` (tabs au-dessus de la zone contenu, sans casser le layout 3 colonnes).
- [x] **1.2** S’assurer que `shipStore.fetchTravels()` est appelé au chargement de la Carte (ex. dans `onMounted` de PageCarte, avec `ensureStoresLoaded` ou après `mapStore.fetch()`).
- [x] **1.3** Exposer les transits pour la Map : soit utiliser `shipStore.travels` (déjà exposé), soit ajouter un computed dans le store mapNodes qui dérive les arêtes depuis `ship_travels` si on veut tout centraliser côté carte. *Recommandation : utiliser directement `shipStore.travels` dans le composant Map.*

### Phase 2 — Composant vue Map

- [x] **2.1** Créer le composant **CarteMapView.vue** (ou équivalent) : affichage en 2D projeté des nœuds (systèmes) et des arêtes (transits).
- [x] **2.2** Données d’entrée : `mapStore.nodes`, `shipStore.travels` (origine → destination). Calcul des arêtes : pour chaque entrée de `travels`, tracer un segment entre le nœud `origin_system_id` et le nœud `destination_system_id` si les deux sont dans `nodes`.
- [x] **2.3** Positionnement des nœuds : utiliser `stellar_systems.coordinates` (composable useCarteMapProjection + getSystemXyz) (x, y, z) pour chaque `system_id` des nodes ; projeter en 2D (ex. xy ou ra/dec → canvas/SVG). Réutiliser si possible la logique de projection du moteur étoiles (diagnostic_moteur_rendu_etoiles, Vue 3D étoiles) pour cohérence.
- [x] **2.4** Rendu : un nœud par système (cercle) ; lignes entre nœuds pour chaque transit ; visité = avec arêtes. Pas de libellé « visité » / « observé » : le fait d’avoir des liens ou non suffit.
- [x] **2.5** Interaction : clic nœud → select-system ; clic fond → désélection ; title = nom. (même comportement que la liste : `selectedSystemId`, affichage détail à droite). Optionnel : survol → tooltip (nom, visite ou non).

### Phase 3 — Intégration et polish

- [x] **3.1** Dans PageCarte : onglet **Map** affiche `CarteMapView` ; liste et détail partagés. (et éventuellement une légende ou titre). Les colonnes gauche (liste) et droite (détails) peuvent rester partagées entre les deux onglets ou être adaptées (ex. liste masquée en Map, détail au clic sur nœud).
- [x] **3.2** Layout : Map en zone centrale à la place de CarteOrbitalView. (à la place de CarteOrbitalView quand onglet Map actif). Liste des systèmes à gauche et panneau détail à droite conservés pour la sélection depuis la Map.
- [x] **3.3** Styles : tokens design system, onglets carte-tabs (pattern Observatoire). (couleurs, traits). Arêtes en style discret (ex. ligne fine, couleur secondaire) pour ne pas surcharger.

### Phase 4 — Optionnel / suite

- [ ] **4.1** Alimenter `map_edges` à l’arrivée d’un transit (completeTransit) en miroir de `ship_travels`, si on souhaite une source unique côté carte (actuellement la Map peut ne lire que `ship_travels`).
- [ ] **4.2** Vue 3D étoiles (développeur) : réutiliser composables/patterns pour la projection (coords → 2D) dans CarteMapView si pas déjà fait.
- [ ] **4.3** Légende courte sur la vue Map : « Lignes = voyages effectués » (sans forcément expliciter visité/observé).

---

## Dépendances

| Tâche | Dépend de |
|-------|-----------|
| 1.1 | — |
| 1.2 | — |
| 1.3 | — |
| 2.1 | 1.1 |
| 2.2 | 1.2, 1.3 |
| 2.3 | stellar_systems chargés (déjà le cas en Carte), coords disponibles |
| 2.4 | 2.1, 2.2, 2.3 |
| 2.5 | 2.4 |
| 3.x | 2.x |

---

## Fichiers concernés

- `src/views/PageCarte.vue` — onglets System/Map, appel `fetchTravels`, layout.
- `src/components/carte/CarteMapView.vue` — à créer (vue projetée).
- `src/stores/ship.js` — déjà exposé : `travels`, `fetchTravels`.
- `src/stores/mapNodes.js` — déjà : `nodes`, `edges` (edges optionnels si on utilise uniquement ship_travels pour la Map).
- `docs/conception/LACUNA_CARTE_MAP.md` — spec (fait).
- `docs/architecture/Interface-DB-mapping.md` — section Carte Map (fait).

---

## Liens avec les autres TODOs

- **TODO_TRANSIT.md** : « Historique des voyages : écran ou section qui lit ship_travels » — la vue Map *est* cette visualisation pour la Carte ; une fois Map en place, on peut considérer cette tâche couverte pour le module Carte.
- **Documentation-status.md** : mettre à jour quand l’onglet Map est livré (Carte — vue projetée, transits, visité/observé).
