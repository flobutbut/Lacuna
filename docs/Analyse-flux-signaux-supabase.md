# LACUNA — Analyse des flux des signaux depuis Supabase

*Mars 2026 — Schéma DB via MCP user-supabase*

---

## 1. Vue d'ensemble des tables liées aux signaux

| Table | Rôle | Lignes actuelles | Utilisée par l'app ? |
|-------|------|------------------|----------------------|
| **signals** | Signaux captés par les capteurs (persistés) | 0 | ❌ Non |
| **signal_events** | Événements transients (GRB, sursauts) | 0 | ❌ Non |
| **observations** | File d'observations Laboratoire | 3 | ✅ Oui |
| **system_objects** | Objets émetteurs (PULSAR, MAGNETAR…) | 1 avec `emits_signals=true` | ❌ Pas pour signaux |

---

## 2. Flux actuel (implémenté)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIGNAL SOURCE (Observatoire)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  Store signaux (mémoire uniquement)
         │  - Liste hardcodée dans signaux.js (3 signaux)
         │  - addSignal() jamais appelé depuis l'UI
         │  - Pas de persistance en base
         ▼
┌──────────────────────┐
│   signauxStore.list  │  ◄── Données en ref([])
│   (mémoire)          │      Pas de table `signals` lue/écrite
└──────────────────────┘
         │
         │  Clic « Analyser » ou « Ajouter au labo » (SignalModal)
         │  → obsStore.addObservation(payload)
         │  payload.support = 'EM_RADIO' (toujours, en dur)
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OBSERVATIONS (Laboratoire)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  observations.fetch() → SELECT * FROM observations WHERE session_id = ?
         │  observations.addObservation() → INSERT INTO observations
         ▼
┌──────────────────────┐
│  Table observations  │  ✅ Branchée
│  (Supabase)          │  - session_id, type, support, duration_sec, name, etc.
│  3 lignes            │  - Pas de colonne anomalous
└──────────────────────┘
```

---

## 3. Schéma des tables

### 3.1 `observations` (branchée)

| Colonne | Type | Usage |
|---------|------|-------|
| id | uuid | PK |
| session_id | text | Filtre fetch (localStorage) |
| ship_id | uuid | FK ships, nullable |
| type | observation_type | SIGNAL, PLANETE, ATMOSPHERE, ETOILE, MINEUR, OBJET |
| support | signal_support | EM_RADIO, GAMMA_X, GRAVITATIONNEL (pour SIGNAL) |
| duration_sec | int | Pour SIGNAL |
| name, system_id, system_display, state, niveau, coords, distance, date | — | |

**Manque :** pas de colonne `anomalous` — l’info est perdue après rechargement.

### 3.2 `signals` (non branchée)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| source_type | text | OBJECT, EVENT, UNKNOWN |
| source_object_id | uuid FK | → system_objects (pulsar, magnétar) |
| source_event_id | uuid FK | → signal_events (GRB) |
| session_id | text | |
| ship_id | uuid FK | → ships |
| frequency_hz | decimal | |
| support | signal_support | EM_RADIO, GAMMA_X, GRAVITATIONNEL |
| duration_sec | int | |
| captured_at | timestamptz | |
| attributes | jsonb | Pour azimuth, polarisation, anomalous, etc. |

### 3.3 `signal_events` (non branchée)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| system_id | text FK | → stellar_systems |
| event_type | text | GRB, BURST… |
| observed_at | timestamptz | |
| duration_sec | int | |
| attributes | jsonb | |

### 3.4 `system_objects` — émetteurs

Exemple en base : 1 objet `PULSAR` avec `emits_signals=true`, `emission_support=EM_RADIO`, `emission_frequency_hz=1.33`.

---

## 4. Flux cible (conforme au schéma DB)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  CAPTURE DES SIGNAUX                                                        │
├────────────────────────────────────────────────────────────────────────────┤
│  Option A — Objet (pulsar, magnétar)                                        │
│    system_objects (emits_signals=true) → signals (source_type=OBJECT)       │
│                                                                             │
│  Option B — Événement (GRB, sursaut)                                        │
│    signal_events → signals (source_type=EVENT)                              │
│                                                                             │
│  Option C — Inconnu (détection brute)                                       │
│    signals (source_type=UNKNOWN)                                            │
└────────────────────────────────────────────────────────────────────────────┘
         │
         │  Frontend : fetch signals WHERE session_id = ? AND ship_id = ?
         │  → Afficher dans SideLeft « Signaux captés »
         ▼
┌──────────────────────┐
│   signauxStore       │  ← Remplacer list hardcodée par fetch signals
└──────────────────────┘
         │
         │  Clic « Ajouter au labo »
         │  → INSERT observations (depuis signal sélectionné)
         │  → Optionnel : lier observation à signal_id (nouvelle FK ?)
         ▼
┌──────────────────────┐
│   observations       │
└──────────────────────┘
```

---

## 5. Écarts et recommandations

### 5.1 Signaux non persistés

- **Problème :** Le store `signaux` n’utilise pas la table `signals`. Tous les signaux sont en mémoire.
- **Effet :** Perte des signaux au rechargement. Pas de GAMMA_X venant de la base.
- **Action :** Brancher le store `signaux` sur la table `signals` : `fetch()` au chargement, `addSignal()` → INSERT.

### 5.2 Champ `anomalous` manquant

- **Problème :** La table `observations` n’a pas de colonne `anomalous`. Le code envoie `anomalous` dans le payload mais `obsToDb()` ne le mappe pas.
- **Effet :** Les rapports ne peuvent pas savoir si un signal est atypique après rechargement.
- **Action :** Ajouter une migration `ALTER TABLE observations ADD COLUMN anomalous BOOLEAN DEFAULT false` et adapter `obsToDb` / `dbToObs`.

### 5.3 Support dérivé de la source (résolu)

- **Résolu :** `support` dérivé du signal source. Seed : GAMMA_X + GRAVITATIONNEL (GW_REGION_A, event GW, object NEUTRON_STAR).

### 5.4 Table `signals` vide

- **Problème :** 0 lignes dans `signals`. Rien n’insère de signaux.
- **Action :** Mettre en place un flux de capture (depuis le ciel, événements, ou seed) qui INSERT dans `signals`.

### 5.5 Source des signaux dans l’UI

- **Problème :** Les signaux affichés viennent d’une liste hardcodée. Pas de lien avec `system_objects` ni `signal_events`.
- **Action :** Au chargement de l’Observatoire, requêter les signaux détectables (objets émetteurs dans le système courant, événements récents) et alimenter le store ou la table `signals`.

---

## 6. Récapitulatif

| Composant | État | Prochaine étape |
|-----------|------|-----------------|
| Store signaux | ✅ Branché | fetch, addSignal→INSERT, removeSignal→DELETE |
| Table signals | ✅ Utilisée | Seed démo + captureFromSystemObjects |
| Table observations | ✅ Branchée | Colonne `anomalous` (migration 00011) |
| SignalModal | ✅ Dérivé | support depuis s.support ?? 'EM_RADIO' |
| system_objects | 1 pulsar émetteur | captureFromSystemObjects insère depuis objets émetteurs |
| signal_events | 0 lignes | Utiliser pour GRB / GAMMA_X si besoin |

---

*Réf. Documentation-backend.md, Interface-DB-mapping.md, LACUNA_LABORATOIRE_INSTRUMENTS.md*
