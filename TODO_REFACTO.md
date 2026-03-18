# TODO Refactoring

*Points repérés en fin de session — à traiter ultérieurement.*

---

## Session du 18 mars 2026

### Fichiers modifiés ou créés


| Fichier                                         | 1. Fonction → composable/lib ? | 2. Import dupliqué ? | 3. CSS en dur au lieu de token ? |
| ----------------------------------------------- | ------------------------------ | -------------------- | -------------------------------- |
| `src/assets/utilities.css`                      | N/A (pas de fonction)          | N/A                  | Non (tous `var(--*)`)            |
| `src/assets/components/panel.css`               | N/A                            | N/A                  | **Oui** (voir ci‑dessous)        |
| `src/components/panels/PanelDrake.vue`          | Non                            | Non                  | N/A                              |
| `src/components/panels/PanelArtefacts.vue`      | Non                            | Non                  | N/A                              |
| `src/components/panels/PanelJournal.vue`        | Non                            | Non                  | N/A                              |
| `src/components/panels/PanelPopulation.vue`     | Non                            | Non                  | N/A                              |
| `src/views/PageSystemes.vue`                    | Non                            | Non                  | N/A                              |
| `docs/audits/AUDIT_css.md`                      | —                              | —                    | —                                |
| `docs/reference/Documentation-technique.md`     | —                              | —                    | —                                |
| `docs/audits/AUDIT_doc_technique.md`            | —                              | —                    | —                                |
| `docs/reference/Documentation-fonctionnelle.md` | —                              | —                    | —                                |
| `docs/design/Design-system.md`                  | —                              | —                    | —                                |


---

### Entrées à corriger

#### `src/assets/components/panel.css`

- **Lignes 19–32** : `.panel-overlay--right`, `.panel-overlay--left`, `.panel-overlay--center` utilisent des valeurs en dur :
  - `top: 60px` (lignes 20, 25, 30) — pourrait être un token type `--panel-offset-top` ou `calc(var(--header-height) + var(--space-6))` si cohérent avec le design
  - `right: 220px` / `left: 220px` (lignes 21, 26) — pas de token équivalent dans `tokens.css` ; à définir (ex. `--panel-offset-side`) ou documenter comme valeur de layout volontaire
- **Action suggérée** : Ajouter des tokens dans `tokens.css` pour ces valeurs (ou une note dans le Design system si la valeur est intentionnellement fixe) et les utiliser dans `panel.css`.

