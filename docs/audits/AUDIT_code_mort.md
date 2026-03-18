# 18 mars 2025 — Audit code mort et legacy

Vérification du dossier **src/components/panels/** (marqué legacy en documentation) et du reste de **src/** pour identifier les fichiers encore importés, ceux jamais référencés (code mort), et les points d’entrée. Mode lecture seule — aucune modification des fichiers source.

---

## 1. Fichiers dans panels/ — références

| Fichier | Importé dans |
|--------|---------------|
| **src/components/panels/PanelDrake.vue** | [aucun] |
| **src/components/panels/PanelPopulation.vue** | [aucun] |
| **src/components/panels/PanelPlaceholder.vue** | [aucun] |
| **src/components/panels/PanelArtefacts.vue** | [aucun] |
| **src/components/panels/PanelJournal.vue** | [aucun] |

Aucun des cinq composants du dossier `panels/` n’est importé ailleurs dans `src/`. Les vues correspondantes (PageDrake, PagePopulation, PageArtefacts, PageJournal) n’utilisent pas ces composants et embarquent leur propre contenu. Le store **ui** expose bien `activePanel`, `openPanel`, `closePanel`, `togglePanel` (utilisés dans le code des panels), mais aucun fichier ne monte les composants **Panel***.vue.

---

## 2. Fichiers dans panels/ — code mort

- **src/components/panels/PanelDrake.vue**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**

- **src/components/panels/PanelPopulation.vue**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**

- **src/components/panels/PanelPlaceholder.vue**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**

- **src/components/panels/PanelArtefacts.vue**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**

- **src/components/panels/PanelJournal.vue**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**

---

## 3. Autres fichiers dans src/ non importés (hors points d’entrée)

Points d’entrée exclus de l’audit : **main.js**, **router/index.js**, et les vues chargées dynamiquement par le routeur (elles sont référencées par le routeur).

- **src/stores/counter.js**  
  → Importé dans : [aucun] → **PEUT ÊTRE SUPPRIMÉ**  
  (Store Pinia exemple « counter » ; aucun import dans le reste de `src/`.)

---

## 4. Synthèse

| Type | Nombre | Fichiers |
|------|--------|----------|
| Panels legacy non importés | 5 | PanelDrake, PanelPopulation, PanelPlaceholder, PanelArtefacts, PanelJournal |
| Autres fichiers non importés | 1 | stores/counter.js |
| **Total code mort identifié** | **6** | — |

Tous les autres fichiers parcourus dans **src/** (composants, vues, stores, lib, constants, composables, assets) sont soit des points d’entrée (main.js, router), soit importés au moins une fois dans la chaîne d’imports issue de l’application.
