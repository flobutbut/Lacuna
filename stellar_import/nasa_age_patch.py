#!/usr/bin/env python3
"""
Patch NASA — complète le champ age (milliards d'années) manquant dans stellar_systems.

Source : NASA Exoplanet Archive TAP (st_age).
Règle absolue : ne jamais écraser une valeur existante.
Idempotent : relancé deux fois, ne modifie rien la deuxième fois.
"""
import argparse
import json
import logging
import re
import sys
from pathlib import Path
from typing import Optional

import requests

from supabase_client import get_supabase_client
from upsert_systems import (
    HOSTNAME_TO_ID,
    LACUNA_ID_MAP,
    fetch_existing_systems,
)

ROOT = Path(__file__).resolve().parent.parent
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
PAGE_SIZE = 1000
UNMATCHED_LOG = ROOT / "nasa_age_patch_unmatched.log"

AGE_MIN_GA = 0.001
AGE_MAX_GA = 14.0


def _normalize_id(s: str) -> str:
    return (s or "").lower().replace("_", "-").strip()


def _hostname_to_slug(hn: str) -> str:
    """Kepler-452 → kepler-452, 55 Cnc → 55-cnc."""
    return hn.strip().lower().replace(" ", "-").replace("'", "").replace(".", "")


def _resolve_hostname_fast(hostname: str, existing: dict) -> Optional[str]:
    """Résolution rapide : HOSTNAME_TO_ID, slug direct, variantes mission/catalog."""
    hn = hostname.strip().lower()
    hn_norm = " ".join(hn.split())
    if hn_norm in HOSTNAME_TO_ID:
        return HOSTNAME_TO_ID[hn_norm]
    slug = _hostname_to_slug(hostname)
    if slug in existing:
        return existing[slug].get("id")
    slug_flat = slug.replace("-", "")
    if slug_flat in existing:
        return existing[slug_flat].get("id")
    # Variante majuscule (KEPLER452)
    if slug.upper().replace("-", "") in existing:
        return existing[slug.upper().replace("-", "")].get("id")
    # Kepler-NNNN, K2-NNNN, KOI-NNNN → souvent = GJ NNNN / Gliese GJ NNNN en base
    m = re.match(r"(?:kepler|k2|koi)[- ]?(\d+)", slug)
    if m:
        num = m.group(1)
        for alt in [f"gl-gj-{num}", f"gj-{num}", f"gl-gl-{num}", f"kepler-{num}", f"k2-{num}"]:
            if alt in existing:
                return existing[alt].get("id")
    # HD NNNNNN → hd-NNNNNN (NASA peut mettre espaces)
    m = re.match(r"hd[- ]?(\d+)", slug)
    if m:
        alt = "hd-" + m.group(1)
        if alt in existing:
            return existing[alt].get("id")
    # BD+NN NNNN, BD-NN NNNN
    m = re.match(r"bd([+-])(\d+)[- ]?(\d+)", slug)
    if m:
        for sep in ["", "-"]:
            alt = f"bd{m.group(1)}{m.group(2)}{sep}{m.group(3)}"
            if alt in existing:
                return existing[alt].get("id")
    # GJ NNNN A/B → gj-NNNN-a, gj-NNNN-b
    m = re.match(r"gj[- ]?(\d+)[- ]?([a-z])?", slug)
    if m:
        base = f"gj-{m.group(1)}"
        if m.group(2):
            for suffix in [f"-{m.group(2)}", f"-{m.group(2).upper()}"]:
                if base + suffix in existing:
                    return existing[base + suffix].get("id")
        if base in existing:
            return existing[base].get("id")
    return None


def _can_write(current_value) -> bool:
    """Ne jamais écraser une valeur existante."""
    return current_value is None


def is_valid_age(age) -> bool:
    """Ignore les âges aberrants (en Ga)."""
    if age is None:
        return False
    try:
        v = float(age)
        return AGE_MIN_GA < v < AGE_MAX_GA
    except (TypeError, ValueError):
        return False


def fetch_nasa_ages() -> list[dict]:
    """Requête NASA TAP pour hostname + st_age."""
    params = {
        "query": """
            SELECT hostname, st_age, st_ageerr1, st_ageerr2
            FROM ps
            WHERE default_flag = 1
              AND st_age IS NOT NULL
            ORDER BY hostname
        """,
        "format": "json",
    }
    resp = requests.get(NASA_TAP, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()


def run(
    *,
    dry_run: bool = True,
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

    # Requête NASA
    logging.info("Requête NASA Exoplanet Archive...")
    try:
        nasa_rows = fetch_nasa_ages()
    except Exception as e:
        logging.exception("Erreur fetch NASA: %s", e)
        return 1

    nasa_with_age = len(nasa_rows)
    logging.info("Entrées NASA avec st_age : %d", nasa_with_age)

    # Charger stellar_systems
    existing = fetch_existing_systems(client)
    all_systems = list({r.get("id"): r for r in existing.values() if isinstance(r, dict)}.values())
    total_systems = len(all_systems)
    missing_age = sum(1 for s in all_systems if _can_write(s.get("age")))

    # Dédupliquer NASA par hostname (prendre le premier st_age)
    hostname_to_age = {}
    for row in nasa_rows:
        hn = str(row.get("hostname", "")).strip()
        if not hn:
            continue
        age_val = row.get("st_age")
        if age_val is None:
            continue
        try:
            age_f = float(age_val)
        except (TypeError, ValueError):
            continue
        if hn not in hostname_to_age:
            hostname_to_age[hn] = age_f

    unmatched_hostnames: set = set()
    hostname_to_system_id = {}
    for hn in hostname_to_age:
        sid = _resolve_hostname_fast(hn, existing)
        if not sid:
            unmatched_hostnames.add(hn)
        else:
            hostname_to_system_id[hn] = sid

    stats = {
        "matched": 0,
        "unmatched": 0,
        "to_write": 0,
        "skipped_existing": 0,
        "skipped_invalid_age": 0,
        "unmatched_hostnames": unmatched_hostnames,
    }

    for hostname, age in hostname_to_age.items():
        system_id = hostname_to_system_id.get(hostname)
        if not system_id:
            stats["unmatched"] += 1
            continue

        existing_row = existing.get(system_id)
        if not existing_row:
            for k, v in existing.items():
                if isinstance(v, dict) and v.get("id") == system_id:
                    existing_row = v
                    break
        if not existing_row:
            stats["unmatched"] += 1
            stats["unmatched_hostnames"].add(hostname)
            continue

        stats["matched"] += 1

        if not _can_write(existing_row.get("age")):
            stats["skipped_existing"] += 1
            continue
        if not is_valid_age(age):
            stats["skipped_invalid_age"] += 1
            continue

        if system_filter:
            norm_filter = _normalize_id(system_filter)
            resolved_filter = LACUNA_ID_MAP.get(norm_filter.replace("-", "_"), system_filter)
            if _normalize_id(system_id) not in (norm_filter, _normalize_id(resolved_filter)):
                continue

        stats["to_write"] += 1

        new_fs = dict(existing_row.get("field_sources") or {})
        if isinstance(new_fs, str):
            try:
                new_fs = json.loads(new_fs) if new_fs.strip() else {}
            except json.JSONDecodeError:
                new_fs = {}
        new_fs["age"] = "NASA"

        payload = {"age": age, "field_sources": new_fs}

        if not dry_run:
            try:
                client.table("stellar_systems").update(payload).eq("id", system_id).execute()
                logging.info("  %s : age=%.3f Ga", system_id, age)
            except Exception as e:
                logging.exception("Erreur update %s : %s", system_id, e)

    # Log unmatched
    UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
        for h in sorted(unmatched_hostnames):
            f.write(h + "\n")

    # Output
    print()
    print("=== NASA Age Patch — LACUNA ===")
    print(f"Systèmes en base sans âge : {missing_age:,}".replace(",", " "))
    print(f"Entrées NASA avec st_age : {nasa_with_age:,}".replace(",", " "))
    print(f"Matchings trouvés : {stats['matched']}")
    print(f"Matchings non trouvés : {stats['unmatched']}")
    print()
    print(f"Âges valides à écrire : {stats['to_write']}")
    print(f"Âges ignorés (valeur déjà présente) : {stats['skipped_existing']}")
    print(f"Âges ignorés (valeur aberrante) : {stats['skipped_invalid_age']}")
    print()
    if dry_run:
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
    else:
        print(f"Mode apply : {stats['to_write']} système(s) mis à jour.")
    print(f"\nHostnames non matchés loggés dans : {UNMATCHED_LOG}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch NASA — complète age depuis Exoplanet Archive"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Application réelle en base (sinon dry-run)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: k2-141)",
    )
    args = parser.parse_args()

    return run(dry_run=not args.apply, system_filter=args.system)


if __name__ == "__main__":
    sys.exit(main())
