# Architecture : systèmes vs objets — type stellaire

*Réf. Vue conception, filtres par type d'étoile (Pulsar, L/T/Y, etc.)*

---

## 1. Modèle de données

| Table | Rôle | Type / classification |
|-------|------|------------------------|
| **stellar_systems** | Un **système** (position, distance, coords). Une ligne = un système. | `object_type` (STAR, PULSAR…) + `spectral_type` (G2V, NULL pour pulsars). |
| **system_objects** | Les **objets** d’un système (étoile, planète, lune, disque…). | **`type`** : STAR, PLANET, MOON, MINOR_BODY, DEBRIS_DISK. Pas d'objet pulsar (exotiques via stellar_systems.object_type). |

Donc :
- **Filtrer « Pulsar »** = filtrer les **systèmes** dont stellar_systems.object_type = PULSAR (ou NEUTRON_STAR, MAGNETAR), i.e. les **systèmes dont l’objet principal** est un pulsar.
- Le type « étoile vs pulsar » est porté par **stellar_systems.object_type**. system_objects = corps orbitaux uniquement (migration 00035).

La RPC `get_systems_for_conception` (migration 00034) expose un champ **`object_type`** : type de l’objet principal du système (STAR, PULSAR, NEUTRON_STAR, MAGNETAR) : priorité à stellar_systems.object_type.

---

## 2. Source HYG (Ressources/hyg_v42.csv)

Le catalogue **HYG** (Hipparcos–Yale–Gliese) décrit des **étoiles** avec notamment :

- **Colonne `spect`** : **type spectral** (Morgan–Keenan) : O, B, A, F, G, K, M, avec sous-types (ex. G2V, M5V). C’est la seule information « type » dans HYG.
- **Pas de colonne** « type d’objet » (star vs pulsar vs naine brune).
- **Pas de types L, T, Y** dans le CSV (naines brunes absentes du catalogue HYG).
- **Pas de PSR / Pulsar / Neutron** dans `spect`.

Donc :
- Si **stellar_systems** est alimenté depuis HYG, on n’a que **spectral_type** (depuis `spect`) ; le « type objet » (Pulsar, etc.) doit venir d’ailleurs (ex. **system_objects** renseigné manuellement ou par un autre import).
- Les filtres **Pulsar** et **Naines brunes L/T/Y** s’appuient sur :
  - **object_type** (RPC conception) pour Pulsar / Neutron / Magnetar ;
  - **spectral_type** (stellar_systems ou objet) pour L, T, Y (et O, B, A, F, G, K, M, D).

---

## 3. Récap

- **Type déterminé en base** : **stellar_systems.object_type** (STAR, PULSAR, WHITE_DWARF, …). **system_objects.type** pour corps orbitaux (STAR, PLANET, MOON) — pas de pulsar.
- **stellar_systems** : object_type + spectral_type.
- **HYG** : ne décrit pas le type d’objet de façon précise (pas de Pulsar/L/T/Y) ; uniquement le type spectral via `spect`.
