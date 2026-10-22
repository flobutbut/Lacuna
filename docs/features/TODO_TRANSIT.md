# Todo — Transit (mécanique de voyage)

*Dernière mise à jour : 2026-10-22*

## Fait

- [x] Mécanique de base : `startTransit` / `completeTransit`, timer, reprise après reload
- [x] Phases : ACCELERATING / COASTING / TURNING / DECELERATING, verrou [FIXER CAP] hors COASTING
- [x] Calibration : réglage `transit_time_scale` de `game_settings` (5 s test), doc dans Documentation-technique.md
- [x] Animation fluide : position vaisseau via `Date.now()`, dérive stellaire, cible cap en ambre
- [x] UI transit : cartouche « IN TRANSIT » au-dessus du réticule (ambre, clic → recentrage animé)
- [x] Header pendant transit : « origine → cible — XX% » en jaune
- [x] Highlight cap : cible de destination en ambre (isCapTarget), distinct de la sélection cyan
- [x] Incrément `ships.voyage` à l’arrivée
- [x] Table `ship_travels` et insertion d’un enregistrement à chaque arrivée
- [x] Transit décidé par le serveur (00050) : RPC `start_transit` / `complete_transit`, `ship_travels` écrit par le serveur avec `distance_al`

## À faire

- [ ] **SideLeft** : barre de progression ou infos transit dans le panel gauche (optionnel)
- [ ] **Documentation** : mettre à jour `LACUNA_TRANSIT.md` (section « Implémentation actuelle / mode test »)
- [ ] **Historique des voyages** : écran ou section qui lit `ship_travels` et affiche la chaîne des trajets (retracer la route depuis le premier départ)

## Pourquoi la base ne se mettait pas à jour

- Sur `ships`, la RLS autorisait l’anon **uniquement en SELECT** (policy « Anon can read prototype ship »). Aucune policy **UPDATE** pour le vaisseau prototype → les `UPDATE` (startTransit, completeTransit) étaient refusés, le store basculait en fallback local.
- La table `ship_travels` avait été créée via MCP sans migration ni policies RLS → les `INSERT` pouvaient être refusés ou la table absente en environnement déployé.
- **Correction** : migration dédiée qui ajoute une policy « Anon can update prototype ship » sur `ships`, crée `ship_travels` si besoin et ajoute les policies pour que l’anon puisse INSERT/SELECT les lignes liées au vaisseau prototype.

## Appliquer la migration

- **Supabase MCP / Dashboard** : ouvrir le SQL Editor du projet Supabase, coller le contenu de `supabase/migrations/00031_ship_transit_rls_and_travels.sql` et exécuter.
- **CLI (projet déjà lié)** : `npx supabase db push` (après `supabase link`).
- **Local (Docker)** : `npx supabase start` puis `npx supabase db reset` pour appliquer toutes les migrations.
