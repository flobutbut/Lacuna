"""
Logique upsert stellar_systems.
- LACUNA systems : compléter uniquement les champs NULL
- Autres : upsert complet, corriger si différent (sauf champs protégés)
"""
import re
import logging
from pathlib import Path
from typing import Any, Optional

from supabase import Client

PAGE_SIZE = 1000
ROOT = Path(__file__).resolve().parent.parent
UNRESOLVED_HOSTS_FILE = ROOT / "unresolved_hosts.txt"

PROTECTED_FIELDS = {"anomaly_level", "created_at"}

# Map slugified ids (HYG) → id en base pour les systèmes LACUNA
LACUNA_ID_MAP = {
    "sol": "SOL",
    "proxima-centauri": "PROXIMA",
    "proxima-cen": "PROXIMA",
    "proxima": "PROXIMA",
    "ross-128": "ROSS128",
    "ross128": "ROSS128",
    "gliese-667c": "GLIESE667",
    "gl-667c": "GLIESE667",
    "tau-ceti": "TAU_CETI",
    "tau-cet": "TAU_CETI",
    "gl-gl-71": "TAU_CETI",  # Tau Ceti dans HYG (proper vide, id Gl 71)
    "epsilon-eridani": "EPSILON_ERIDANI",
    "epsilon-erid": "EPSILON_ERIDANI",
    "ran": "EPSILON_ERIDANI",  # Epsilon Eridani (proper dans HYG)
    "gl-gl-144": "EPSILON_ERIDANI",
    "hd-22049": "EPSILON_ERIDANI",
    "barnard": "BARNARD",
    "barnard-star": "BARNARD",
    "barnards-star": "BARNARD",  # Barnard's Star (proper dans HYG)
    "gl-gl-699": "BARNARD",
    "gl-gl-667c": "GLIESE667",  # Gl 667 C (Gliese 667C) dans HYG
    "hd-44594": "HD44594",
    "hd44594": "HD44594",
}

# Noms affichés préférés pour systèmes LACUNA (éviter "Gliese Gl 71" → "Tau Ceti")
LACUNA_DISPLAY_NAMES = {
    "TAU_CETI": "Tau Ceti",
    "PROXIMA": "Proxima Centauri",
    "ROSS128": "Ross 128",
    "SOL": "Sol",
    "BARNARD": "Étoile de Barnard",
    "EPSILON_ERIDANI": "Epsilon Eridani",
    "GLIESE667": "Gliese 667 C",
    "HD44594": "HD 44594",
}


def _normalize_id(s: str) -> str:
    return s.lower().replace("_", "-").strip() if s else ""


def _slugify(s: str) -> str:
    """Espaces → tirets, caractères spéciaux supprimés, lowercase."""
    if not s:
        return ""
    s = str(s).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return s.strip("-") or ""


# Abréviations constellation IAU → nom complet (pour variantes hostname NASA)
_CONST_ABBREV = {
    "cnc": "cancri", "uma": "ursae majoris", "umi": "ursae minoris",
    "and": "andromedae", "her": "herculis", "cyg": "cygni", "sco": "scoorpii",
    "del": "delphini", "boo": "bootis", "sex": "sextantis", "eri": "eridani",
    "peg": "pegasi", "cet": "ceti", "hya": "hydrae", "psc": "piscium",
}
_CONST_FULL_TO_ABBREV = {v: k for k, v in _CONST_ABBREV.items()}


def _hostname_variants(name: str) -> list[str]:
    """Génère des variantes pour le matching (ex: 55 Cancri → 55-cnc, 55-cancri)."""
    if not name:
        return []
    n = name.strip().lower()
    parts = n.split()
    variants = {_slugify(n), n.replace(" ", "-"), n.replace(" ", "_")}
    # Expansion : "55 cnc" → "55 cancri"
    if len(parts) >= 2:
        last = parts[-1]
        if last in _CONST_ABBREV:
            expanded = " ".join(parts[:-1] + [_CONST_ABBREV[last]])
            variants.add(_slugify(expanded))
    # Réduction : "55 cancri" → "55 cnc" (NASA utilise souvent l'abréviation)
    if len(parts) >= 2:
        last = parts[-1]
        if last in _CONST_FULL_TO_ABBREV:
            abbreviated = " ".join(parts[:-1] + [_CONST_FULL_TO_ABBREV[last]])
            variants.add(_slugify(abbreviated))
    return list(variants)


def _is_lacuna_system(system_id: str) -> bool:
    return _normalize_id(system_id) in LACUNA_ID_MAP or system_id in LACUNA_ID_MAP.values()


def _resolve_lacuna_id(system_id: str) -> str:
    """Pour un id HYG, retourne l'id DB LACUNA si c'est un système connu."""
    return LACUNA_ID_MAP.get(_normalize_id(system_id), system_id)


def upsert_systems_batch(
    client: Client,
    rows: list[dict[str, Any]],
    existing: dict[str, dict],
    stats: dict[str, int],
    corrections: list[str],
    force_update_ids: Optional[set[str]] = None,
) -> None:
    """
    Upsert un lot de stellar_systems.
    existing: {id: {col: val}} des systèmes déjà en base
    stats: compteurs inserted, completed, corrected, ignored, errors
    """
    to_upsert = []

    for row in rows:
        sys_id = row.get("id")
        if not sys_id:
            continue

        # Résolution id LACUNA : proxima-centauri → PROXIMA
        db_id = _resolve_lacuna_id(sys_id)
        row["id"] = db_id

        try:
            existing_row = existing.get(db_id) or existing.get(_normalize_id(db_id))
            is_lacuna = _is_lacuna_system(db_id)

            if existing_row:
                if force_update_ids and _normalize_id(db_id) in {_normalize_id(x) for x in force_update_ids}:
                    # Force mise à jour complète (réparation)
                    new_row = _merge_force(existing_row, row, db_id, stats, corrections)
                elif is_lacuna:
                    # Compléter uniquement NULL
                    new_row = _merge_lacuna(existing_row, row, db_id, stats, corrections)
                else:
                    # Corriger si différent
                    new_row = _merge_correct(existing_row, row, db_id, stats, corrections)

                if new_row:
                    # Garder name si absent (requis pour upsert)
                    if "name" not in new_row and existing_row.get("name"):
                        new_row["name"] = existing_row["name"]
                    to_upsert.append(new_row)
            else:
                # Nouveau — exiger un name valide
                payload = _to_payload(row)
                if payload and payload.get("name"):
                    to_upsert.append(payload)
                    stats["inserted"] += 1

        except Exception as e:
            stats["errors"] += 1
            logging.exception("[ERREUR] système %s : %s", db_id, e)

    # Exclure les lignes sans name (NOT NULL)
    to_upsert = [r for r in to_upsert if r.get("name")]

    # Dédupliquer par id (plusieurs HYG rows peuvent mapper au même système LACUNA)
    seen = {}
    for r in to_upsert:
        sid = r.get("id")
        if sid:
            seen[sid] = r  # dernier écrase
    to_upsert = list(seen.values())

    if to_upsert:
        try:
            client.table("stellar_systems").upsert(
                to_upsert,
                on_conflict="id",
                ignore_duplicates=False,
            ).execute()
        except Exception as e:
            err = str(e).lower()
            if "row-level security" in err or "42501" in err:
                raise RuntimeError(
                    "RLS Supabase : ajouter SUPABASE_SERVICE_ROLE_KEY dans .env "
                    "(Dashboard > Settings > API > service_role)"
                ) from e
            raise


def _merge_lacuna(
    existing: dict,
    incoming: dict,
    sys_id: str,
    stats: dict,
    corrections: list,
) -> Optional[dict]:
    """Complète uniquement les champs NULL. Ne touche pas aux protégés."""
    payload = {}
    changed = False

    for k, v in incoming.items():
        if k.startswith("_") or k in PROTECTED_FIELDS:
            continue
        ev = existing.get(k)
        if ev is None and v is not None:
            payload[k] = v
            changed = True
            msg = f"[LACUNA] {sys_id} | {k}: NULL → {v}"
            corrections.append(msg)
            logging.info("Champ complété: %s", msg)

    if not changed:
        stats["ignored"] += 1
        return None

    payload["id"] = existing.get("id", sys_id)
    stats["completed"] += 1
    return payload


def _merge_force(
    existing: dict,
    incoming: dict,
    sys_id: str,
    stats: dict,
    corrections: list,
) -> Optional[dict]:
    """Force la mise à jour de tous les champs HYG (réparation systèmes incomplets)."""
    payload = {"id": existing.get("id", sys_id)}
    for k, v in incoming.items():
        if k.startswith("_") or k in PROTECTED_FIELDS:
            continue
        if k == "name":
            preferred = LACUNA_DISPLAY_NAMES.get(sys_id)
            if preferred:
                payload[k] = preferred
                msg = f"[FORCE] {sys_id} | {k}: {existing.get(k)} → {preferred} (préféré)"
                corrections.append(msg)
                logging.info("Champ complété: %s", msg)
            elif existing.get("name"):
                pass  # garder le nom existant (éviter "Gliese Gl 71")
            else:
                payload[k] = v
                msg = f"[FORCE] {sys_id} | {k}: {existing.get(k)} → {v}"
                corrections.append(msg)
                logging.info("Champ complété: %s", msg)
            continue
        if v is not None:
            payload[k] = v
            msg = f"[FORCE] {sys_id} | {k}: {existing.get(k)} → {v}"
            corrections.append(msg)
            logging.info("Champ complété: %s", msg)
    stats["corrected"] += 1
    return payload


def _merge_correct(
    existing: dict,
    incoming: dict,
    sys_id: str,
    stats: dict,
    corrections: list,
) -> Optional[dict]:
    """Corrige les champs différents. Ne touche pas aux protégés."""
    payload = {"id": existing.get("id", sys_id)}
    changed = False

    for k, v in incoming.items():
        if k.startswith("_") or k in PROTECTED_FIELDS:
            continue
        ev = existing.get(k)
        if ev != v and v is not None:
            payload[k] = v
            changed = True
            corrections.append(f"[CORRECTION] système: {sys_id} | champ: {k} | ancien: {ev} | nouveau: {v}")

    if not changed:
        stats["ignored"] += 1
        return None

    stats["corrected"] += 1
    return payload


def _to_payload(row: dict) -> Optional[dict]:
    """Extrait le payload Supabase (sans clés internes). Exclut les valeurs None."""
    payload = {}
    for k, v in row.items():
        if k.startswith("_"):
            continue
        if k in PROTECTED_FIELDS:
            continue
        if v is None:
            continue
        payload[k] = v
    # name est NOT NULL — ne pas insérer si absent
    if not payload.get("name") and "name" not in payload:
        return None
    return payload if payload else None


def fetch_existing_systems(client: Client) -> dict[str, dict]:
    """
    Charge TOUS les stellar_systems en mémoire (pagination 1000 par 1000).
    Construit un dictionnaire de lookup multi-clés : id, name lowercase, slugifié,
    variantes constellation (ex: 55 Cnc → 55-cnc, 55-cancri).
    """
    out = {}
    total_systems = 0
    offset = 0
    while True:
        resp = (
            client.table("stellar_systems")
            .select("*")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break
        for row in rows:
            sid = row.get("id")
            name = (row.get("name") or "").strip()
            if not sid:
                continue
            total_systems += 1
            # Clés principales
            out[sid] = row
            out[_normalize_id(sid)] = row
            out[_slugify(sid)] = row
            if name:
                out[name.lower()] = row
                out[_slugify(name)] = row
            # Variantes constellation (55 Cancri → 55-cnc)
            for v in _hostname_variants(name):
                if v:
                    out[v] = row
        offset += PAGE_SIZE
        if len(rows) < PAGE_SIZE:
            break
    logging.info("[fetch_existing_systems] %d systèmes chargés, %d clés de lookup", total_systems, len(out))
    return out


# Map hostname NASA → id DB pour systèmes connus
HOSTNAME_TO_ID = {
    "proxima centauri": "PROXIMA",
    "proxima cen": "PROXIMA",
    "ross 128": "ROSS128",
    "gliese 667 c": "GLIESE667",
    "gl 667 c": "GLIESE667",
    "tau ceti": "TAU_CETI",
    "epsilon eridani": "EPSILON_ERIDANI",
    "barnard's star": "BARNARD",
    "barnard star": "BARNARD",
    "hd 44594": "HD44594",
}


def resolve_hostname_to_system_id(
    hostname: str,
    existing: dict[str, dict],
    unresolved_collector: Optional[set] = None,
) -> Optional[str]:
    """
    Trouve l'id stellar_systems correspondant au hostname NASA.
    a) Exact match id
    b) Exact match name (case insensitive)
    c) slugify(hostname) == id
    d) slugify(hostname) contenu dans id ou inversement
    e) Hostnames non résolus ajoutés à unresolved_collector pour audit.
    """
    if not hostname:
        return None
    hn = hostname.strip().lower()
    hn_norm = " ".join(hn.split())
    hn_slug = _slugify(hostname)

    # Mapping connu
    if hn_norm in HOSTNAME_TO_ID:
        return HOSTNAME_TO_ID[hn_norm]

    # a) Exact match sur id
    if hn in existing:
        return existing[hn].get("id")
    if hn_slug in existing:
        return existing[hn_slug].get("id")

    # b) Exact match sur name (case insensitive)
    # c) slugify(hostname) == id — déjà couvert par hn_slug in existing
    # d) slugify contenu dans id ou inversement
    for key, row in existing.items():
        rid = row.get("id")
        if not rid or not isinstance(key, str):
            continue
        name = (row.get("name") or "").lower()
        if hn == name:
            return rid
        if hn_slug == _slugify(rid) or hn_slug == _slugify(name):
            return rid
        if hn_slug in key or key in hn_slug:
            return rid
        if hn_slug in _normalize_id(rid) or _normalize_id(rid) in hn_slug:
            return rid

    if unresolved_collector is not None:
        unresolved_collector.add(hostname)
    return None


def write_unresolved_hosts(unresolved: set[str], path: Path = UNRESOLVED_HOSTS_FILE) -> None:
    """Écrit les hostnames non résolus dans un fichier pour audit manuel."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for h in sorted(unresolved):
            f.write(h + "\n")
    logging.info("[resolve] %d hostnames non résolus écrits dans %s", len(unresolved), path)
