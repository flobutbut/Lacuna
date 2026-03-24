#!/usr/bin/env python3
"""
Import planètes HD via cone search NASA TAP.

Pour chaque étoile HD de la liste :
1. Récupère RA/Dec depuis hyg_v42.csv (ra en heures → degrés)
2. Cone search NASA TAP 5" autour des coordonnées
3. Si planètes trouvées : import normal (system_objects)
4. Si rien : log dans hyg_planets_notfound.log
"""
import argparse
import csv
import logging
import sys
import uuid
from pathlib import Path
from typing import Any, Optional

import requests

from supabase_client import get_supabase_client
from upsert_objects import fetch_existing_planets

ROOT = Path(__file__).resolve().parent.parent
HYG_CSV = ROOT / "Ressources" / "hyg_v42.csv"
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
LOG_FILE = Path(__file__).resolve().parent / "hyg_planets_notfound.log"
CONE_RADIUS_DEG = 5 / 3600  # 5 secondes d'arc en degrés

HD_NUMBERS = [
    3, 5, 17, 21, 28, 63, 70, 85, 122, 156, 199, 200, 222,
]


def _safe_float(v: Any) -> Optional[float]:
    if v is None or (isinstance(v, float) and str(v) == "nan"):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _safe_str(v: Any) -> Optional[str]:
    if v is None or (isinstance(v, float) and str(v) == "nan"):
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def load_hyg_coords() -> dict[int, tuple[float, float]]:
    """Charge HYG et retourne {hd_num: (ra_deg, dec_deg)}."""
    out = {}
    with open(HYG_CSV, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            hd_val = row.get("hd", "").strip()
            if not hd_val:
                continue
            try:
                hd_num = int(hd_val)
            except ValueError:
                continue
            if hd_num not in HD_NUMBERS or hd_num in out:
                continue
            ra = _safe_float(row.get("ra"))
            dec = _safe_float(row.get("dec"))
            if ra is None or dec is None:
                continue
            # HYG : ra en heures (0-24), dec en degrés
            ra_deg = ra * 15.0
            out[hd_num] = (ra_deg, dec)
    return out


def fetch_nasa_cone(ra_deg: float, dec_deg: float) -> list[dict]:
    """Cone search NASA TAP (5")."""
    query = f"""
        SELECT pl_name, hostname, pl_letter, pl_orbper, pl_masse, pl_rade,
               pl_orbsmax, pl_orbeccen, pl_orbincl, pl_eqt, pl_insol,
               pl_controv_flag, default_flag, hd_name
        FROM ps
        WHERE default_flag = 1
          AND ra IS NOT NULL
          AND dec IS NOT NULL
          AND CONTAINS(POINT('ICRS', ra, dec),
                       CIRCLE('ICRS', {ra_deg}, {dec_deg}, {CONE_RADIUS_DEG})) = 1
        ORDER BY hostname, pl_letter
    """
    params = {"query": query.strip(), "format": "json"}
    resp = requests.get(NASA_TAP, params=params, timeout=60)
    resp.raise_for_status()
    return resp.json()


def build_planet_payload(row: dict, system_id: str) -> Optional[dict]:
    """Construit le payload system_objects (PLANET) depuis une ligne NASA."""
    hostname = _safe_str(row.get("hostname"))
    pl_letter = _safe_str(row.get("pl_letter"))
    pl_name = _safe_str(row.get("pl_name")) or (f"{hostname or '?'} {pl_letter or '?'}".strip())
    if not pl_letter:
        return None

    pl_insol = _safe_float(row.get("pl_insol"))
    in_habitable_zone = 0.25 < pl_insol < 1.5 if pl_insol else False

    controv = row.get("pl_controv_flag")
    confirmation_status = "DEBATED" if (controv and str(controv).strip() == "1") else "CONFIRMED"

    pl_letter_lower = pl_letter.lower()
    sort_order = max(0, ord(pl_letter_lower) - ord("b")) if len(pl_letter_lower) == 1 else 0

    payload = {
        "system_id": system_id,
        "type": "PLANET",
        "designation": pl_letter_lower,
        "name": pl_name,
        "sort_order": sort_order,
        "orbital_period_days": _safe_float(row.get("pl_orbper")),
        "orbital_semi_major_axis_au": _safe_float(row.get("pl_orbsmax")),
        "orbital_eccentricity": _safe_float(row.get("pl_orbeccen")),
        "orbital_inclination_deg": _safe_float(row.get("pl_orbincl")),
        "radius_earth": _safe_float(row.get("pl_rade")),
        "mass_earth": _safe_float(row.get("pl_masse")),
        "surface_temperature_k": _safe_float(row.get("pl_eqt")),
        "in_habitable_zone": in_habitable_zone,
        "confirmation_status": confirmation_status,
        "data_source": "NASA",
    }
    payload = {k: v for k, v in payload.items() if v is not None or k == "in_habitable_zone"}
    payload["in_habitable_zone"] = payload.get("in_habitable_zone", False)

    field_sources = {
        k: "NASA"
        for k, v in payload.items()
        if k not in ("id", "system_id", "type", "in_habitable_zone") and v is not None
    }
    if field_sources:
        payload["field_sources"] = field_sources

    return payload


def run(dry_run: bool = True) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )
    log = logging.getLogger(__name__)
    log.info("=== HYG Planets Import (cone search NASA) ===")

    coords = load_hyg_coords()
    if len(coords) < len(HD_NUMBERS):
        missing = set(HD_NUMBERS) - set(coords.keys())
        log.warning("Étoiles non trouvées dans HYG : %s", sorted(missing))

    notfound: list[str] = []
    all_planets: list[dict] = []
    system_ids_seen: set[str] = set()

    for hd_num in sorted(HD_NUMBERS):
        if hd_num not in coords:
            notfound.append(f"HD {hd_num} (absent de HYG)")
            continue

        ra_deg, dec_deg = coords[hd_num]
        system_id = f"hd-{hd_num}"

        try:
            rows = fetch_nasa_cone(ra_deg, dec_deg)
        except Exception as e:
            log.error("HD %d : erreur cone search : %s", hd_num, e)
            notfound.append(f"HD {hd_num} (erreur: {e})")
            continue

        if not rows:
            notfound.append(f"HD {hd_num} (ra={ra_deg:.6f}, dec={dec_deg:.6f})")
            log.info("HD %d : aucune planète NASA (cone 5\")", hd_num)
            continue

        log.info("HD %d : %d planète(s) trouvée(s)", hd_num, len(rows))
        system_ids_seen.add(system_id)
        for row in rows:
            payload = build_planet_payload(row, system_id)
            if payload:
                payload["id"] = str(uuid.uuid4())
                all_planets.append(payload)

    if notfound:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            for line in notfound:
                f.write(line + "\n")
        log.info("Non trouvées écrites dans %s", LOG_FILE)

    if not all_planets:
        log.info("Aucune planète à importer.")
        return 0

    if dry_run:
        log.info("[DRY-RUN] %d planète(s) à importer (systèmes : %s)", len(all_planets), sorted(system_ids_seen))
        return 0

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    existing = fetch_existing_planets(client)
    to_upsert = []
    for p in all_planets:
        key = (p["system_id"], p["designation"])
        if key in existing:
            log.debug("Planète existante %s/%s, skip", p["system_id"], p["designation"])
            continue
        to_upsert.append(p)

    if to_upsert:
        client.table("system_objects").upsert(
            to_upsert,
            on_conflict="id",
            ignore_duplicates=False,
        ).execute()
        log.info("Importé : %d planète(s)", len(to_upsert))
    else:
        log.info("Toutes les planètes existaient déjà.")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Import planètes HD via cone search NASA")
    parser.add_argument("--apply", action="store_true", help="Appliquer l'import (sinon dry-run)")
    args = parser.parse_args()
    return run(dry_run=not args.apply)


if __name__ == "__main__":
    sys.exit(main())
