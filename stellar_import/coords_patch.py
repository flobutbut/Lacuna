#!/usr/bin/env python3
"""
Patch coordonnées — complète coordinates (x, y, z) depuis NASA TAP (RA/Dec, sy_dist).

Pour les systèmes sans coordonnées valides (hors SOL). Recalcule constellation_abbr
si absente (source COMPUTED). Ne remplace jamais des coordonnées valides.

Idempotent : relancé deux fois, ne modifie rien la deuxième fois.
"""
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Optional

import requests

from constellation_patch import get_constellation_abbr
from nasa_age_patch import _resolve_hostname_fast
from nasa_systems_import import PARSEC_TO_LY, coords_from_ra_dec
from supabase_client import get_supabase_client
from upsert_systems import fetch_existing_systems

ROOT = Path(__file__).resolve().parent.parent
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
PAGE_SIZE = 1000
UNMATCHED_LOG = ROOT / "coords_patch_unmatched.log"


def has_valid_coords(coordinates: Any) -> bool:
    """Coordonnées cartésiennes non nulles (une composante suffit pour être valide)."""
    if not coordinates or not isinstance(coordinates, dict):
        return False
    try:
        x = float(coordinates.get("x") or 0)
        y = float(coordinates.get("y") or 0)
        z = float(coordinates.get("z") or 0)
    except (TypeError, ValueError):
        return False
    return not (x == 0 and y == 0 and z == 0)


def _safe_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def fetch_nasa_coords() -> list[dict]:
    """RA/Dec/sy_dist par hostname depuis la table ps."""
    query = """
        SELECT DISTINCT hostname, ra, dec, sy_dist
        FROM ps
        WHERE default_flag = 1
          AND ra IS NOT NULL
          AND dec IS NOT NULL
          AND sy_dist IS NOT NULL
          AND sy_dist > 0
        ORDER BY hostname
    """
    params = {"query": query.strip(), "format": "json"}
    resp = requests.get(NASA_TAP, params=params, timeout=240)
    resp.raise_for_status()
    return resp.json()


def _merge_field_sources(
    row: dict, updates: dict
) -> dict:
    fs = dict(row.get("field_sources") or {})
    if isinstance(fs, str):
        try:
            fs = json.loads(fs) if fs.strip() else {}
        except json.JSONDecodeError:
            fs = {}
    fs.update(updates)
    return fs


def _can_write_constellation(current: Any) -> bool:
    return current is None


def run(
    *,
    dry_run: bool = True,
    batch_size: int = 200,
    system_filter: Optional[str] = None,
) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        logging.error("%s", e)
        return 1

    logging.info("Chargement stellar_systems...")
    existing = fetch_existing_systems(client)
    all_systems = []
    seen = set()
    for v in existing.values():
        if isinstance(v, dict) and v.get("id") and v["id"] not in seen:
            seen.add(v["id"])
            all_systems.append(v)

    without_valid = [
        s
        for s in all_systems
        if s.get("id") != "SOL" and not has_valid_coords(s.get("coordinates"))
    ]

    if system_filter:
        fn = system_filter.strip().lower().replace("_", "-")
        without_valid = [
            s
            for s in without_valid
            if (s.get("id") or "").lower().replace("_", "-") == fn
        ]
        if not without_valid:
            logging.warning("Filtre --system '%s' : aucun système à traiter", system_filter)
            return 0

    total_without = len(without_valid)
    need_ids = {s["id"] for s in without_valid}

    logging.info("Requête NASA TAP (hostname, ra, dec, sy_dist)...")
    try:
        nasa_rows = fetch_nasa_coords()
    except Exception as e:
        logging.exception("Erreur NASA: %s", e)
        return 1

    nasa_by_system_id: dict[str, dict] = {}
    for row in nasa_rows:
        hn = str(row.get("hostname", "")).strip()
        if not hn:
            continue
        sid = _resolve_hostname_fast(hn, existing)
        if not sid or sid not in need_ids:
            continue
        if sid not in nasa_by_system_id:
            nasa_by_system_id[sid] = row

    matched = len(nasa_by_system_id)
    unmatched_ids = need_ids - set(nasa_by_system_id.keys())
    unmatched_count = len(unmatched_ids)

    to_write: list[dict] = []
    constellations = 0

    for sid in sorted(nasa_by_system_id.keys()):
        row_db = existing.get(sid)
        if not row_db:
            for v in existing.values():
                if isinstance(v, dict) and v.get("id") == sid:
                    row_db = v
                    break
        if not row_db or has_valid_coords(row_db.get("coordinates")):
            continue
        nasa = nasa_by_system_id[sid]
        ra = _safe_float(nasa.get("ra"))
        dec = _safe_float(nasa.get("dec"))
        sy_dist = _safe_float(nasa.get("sy_dist"))
        if ra is None or dec is None or sy_dist is None or sy_dist <= 0:
            continue
        coords = coords_from_ra_dec(ra, dec, sy_dist)
        fs_updates = {"coordinates": "NASA"}
        new_fs = _merge_field_sources(row_db, fs_updates)

        payload: dict[str, Any] = {
            "id": sid,
            "coordinates": coords,
            "field_sources": new_fs,
        }

        if _can_write_constellation(row_db.get("constellation_abbr")):
            abbr = get_constellation_abbr(ra, dec)
            if abbr:
                payload["constellation_abbr"] = abbr
                new_fs = dict(new_fs)
                new_fs["constellation_abbr"] = "COMPUTED"
                payload["field_sources"] = new_fs
                constellations += 1

        to_write.append(payload)

    print()
    print("=== Coords Patch — LACUNA ===")
    print(f"Systèmes sans coordonnées valides : {total_without}")
    print(f"Matchings NASA trouvés : {matched}")
    print(f"Matchings non trouvés : {unmatched_count} (loggés)")
    print()
    print(f"Coordonnées à écrire : {len(to_write)}")
    print(f"Constellations à calculer : {constellations}")
    print()

    UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
        for uid in sorted(unmatched_ids):
            f.write(uid + "\n")

    if dry_run:
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
        print(f"Non-matchés : {UNMATCHED_LOG}")
        return 0

    for i in range(0, len(to_write), batch_size):
        batch = to_write[i : i + batch_size]
        for pl in batch:
            sid = pl["id"]
            update = {
                "coordinates": pl["coordinates"],
                "field_sources": pl["field_sources"],
            }
            if "constellation_abbr" in pl:
                update["constellation_abbr"] = pl["constellation_abbr"]
            try:
                client.table("stellar_systems").update(update).eq("id", sid).execute()
                logging.info("  %s : coords OK", sid)
            except Exception as e:
                logging.exception("Erreur update %s : %s", sid, e)

    print(f"Mode apply : {len(to_write)} système(s) mis à jour.")
    print(f"Non-matchés : {UNMATCHED_LOG}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch coordinates depuis NASA TAP (RA/Dec + sy_dist)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulation explicite (équivalent au défaut sans --apply)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Écrire en base",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=200,
        help="Taille des lots (défaut: 200)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: k2-141)",
    )
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        batch_size=args.batch_size,
        system_filter=args.system,
    )


if __name__ == "__main__":
    sys.exit(main())
