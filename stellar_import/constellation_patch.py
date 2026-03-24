#!/usr/bin/env python3
"""
Patch constellation — complète constellation_abbr manquant depuis RA/Dec.

Calcule RA/Dec depuis coordinates (x, y, z), détermine la constellation via
astropy (catalogue IAU Delporte 1930). Ne remplace jamais une valeur existante.

Source : COMPUTED (dérivation depuis coordonnées).
Idempotent : relancé deux fois, ne modifie rien la deuxième fois.
"""
import argparse
import json
import logging
import math
import sys
from pathlib import Path
from typing import Any, Optional

from astropy.coordinates import SkyCoord, get_constellation
import astropy.units as u

from supabase_client import get_supabase_client
from upsert_systems import fetch_existing_systems

ROOT = Path(__file__).resolve().parent.parent
PAGE_SIZE = 1000
ERRORS_LOG = ROOT / "constellation_patch_errors.log"


def xyz_to_radec(x: float, y: float, z: float) -> tuple[float, float]:
    """
    Convertit coordonnées cartésiennes (al) en RA/Dec (degrés).
    Convention HYG : même repère équatorial J2000.
    """
    dist = math.sqrt(x * x + y * y + z * z)
    if dist == 0:
        return 0.0, 0.0
    dec = math.degrees(math.asin(z / dist))
    ra = math.degrees(math.atan2(y, x))
    if ra < 0:
        ra += 360.0
    return ra, dec


def get_constellation_abbr(ra_deg: float, dec_deg: float) -> Optional[str]:
    """
    Retourne l'abréviation IAU 3 lettres de la constellation.
    Ex: "Ori", "UMa", "Sgr"
    """
    try:
        coord = SkyCoord(
            ra=ra_deg * u.degree, dec=dec_deg * u.degree, frame="icrs"
        )
        name = get_constellation(coord, short_name=True)
        return name if name else None
    except Exception:
        return None


def _can_write(current_value: Any) -> bool:
    """Ne jamais écraser une valeur existante."""
    return current_value is None


def run(
    *,
    dry_run: bool = True,
    batch_size: int = 200,
    system_filter: Optional[str] = None,
) -> int:
    log_handlers = [logging.StreamHandler(sys.stderr)]
    try:
        fh = logging.FileHandler(ERRORS_LOG, encoding="utf-8")
        log_handlers.append(fh)
    except OSError:
        pass
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=log_handlers,
    )

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        logging.error("%s", e)
        return 1

    existing = fetch_existing_systems(client)
    all_systems = []
    seen_ids = set()
    for v in existing.values():
        if isinstance(v, dict) and v.get("id") and v["id"] not in seen_ids:
            seen_ids.add(v["id"])
            all_systems.append(v)

    missing = [s for s in all_systems if _can_write(s.get("constellation_abbr"))]
    total_missing = len(missing)

    skipped_sol = 0
    skipped_null_coords = 0
    skipped_filter = 0
    computed = 0
    errors = 0
    dist_by_abbr = {}

    if system_filter:
        filter_norm = system_filter.strip().lower().replace("_", "-")
        missing = [
            s
            for s in missing
            if (s.get("id") or "").lower().replace("_", "-") == filter_norm
        ]
        if not missing:
            logging.warning("Filtre --system '%s' : aucun système à traiter", system_filter)
            return 0

    to_update = []

    for s in missing:
        sid = s.get("id", "")
        coords = s.get("coordinates")
        distance = s.get("distance")

        if sid == "SOL" or (distance is not None and float(distance) == 0):
            skipped_sol += 1
            continue

        if not coords or not isinstance(coords, dict):
            skipped_null_coords += 1
            logging.debug("  %s : coordinates manquantes ou invalides", sid)
            continue

        x = coords.get("x")
        y = coords.get("y")
        z = coords.get("z")

        if x is None and y is None and z is None:
            ra = coords.get("ra")
            dec = coords.get("dec")
            if ra is not None and dec is not None:
                try:
                    ra_f = float(ra)
                    dec_f = float(dec)
                except (TypeError, ValueError):
                    skipped_null_coords += 1
                    continue
                ra_deg, dec_deg = ra_f, dec_f
            else:
                skipped_null_coords += 1
                logging.debug("  %s : coords x/y/z nulles et pas de ra/dec", sid)
                continue
        else:
            try:
                x_f = float(x or 0)
                y_f = float(y or 0)
                z_f = float(z or 0)
            except (TypeError, ValueError):
                skipped_null_coords += 1
                continue
            if x_f == 0 and y_f == 0 and z_f == 0:
                skipped_null_coords += 1
                logging.debug("  %s : coords (0,0,0) hors SOL", sid)
                continue
            ra_deg, dec_deg = xyz_to_radec(x_f, y_f, z_f)

        abbr = get_constellation_abbr(ra_deg, dec_deg)
        if not abbr:
            errors += 1
            logging.warning("  %s : constellation non déterminée (ra=%.4f, dec=%.4f)", sid, ra_deg, dec_deg)
            continue

        computed += 1
        dist_by_abbr[abbr] = dist_by_abbr.get(abbr, 0) + 1

        fs = dict(s.get("field_sources") or {})
        if isinstance(fs, str):
            try:
                fs = json.loads(fs) if fs.strip() else {}
            except json.JSONDecodeError:
                fs = {}
        fs["constellation_abbr"] = "COMPUTED"

        to_update.append({
            "id": sid,
            "constellation_abbr": abbr,
            "field_sources": fs,
        })
        logging.info("  %s : %s (ra=%.2f, dec=%.2f)", sid, abbr, ra_deg, dec_deg)

    print()
    print("=== Constellation Patch — LACUNA ===")
    print(f"Systèmes sans constellation_abbr : {total_missing}")
    print(f"Systèmes skippés (SOL, coords nulles) : {skipped_sol + skipped_null_coords}")
    print(f"Constellations calculées : {computed}")
    print(f"Erreurs : {errors}")
    print()
    print("Distribution des constellations :")
    for abbr in sorted(dist_by_abbr.keys()):
        print(f"  {abbr} : {dist_by_abbr[abbr]}")
    print()

    if dry_run:
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
        return 0

    for i in range(0, len(to_update), batch_size):
        batch = to_update[i : i + batch_size]
        for row in batch:
            try:
                client.table("stellar_systems").update({
                    "constellation_abbr": row["constellation_abbr"],
                    "field_sources": row["field_sources"],
                }).eq("id", row["id"]).execute()
                logging.info("  %s : constellation_abbr=%s écrit", row["id"], row["constellation_abbr"])
            except Exception as e:
                errors += 1
                logging.exception("Erreur update %s : %s", row["id"], e)

    print(f"Mode apply : {len(to_update)} système(s) mis à jour.")
    print(f"Log erreurs : {ERRORS_LOG}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch constellation_abbr depuis coordonnées (RA/Dec)"
    )
    parser.add_argument("--apply", action="store_true", help="Écrire en base")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=200,
        help="Taille des lots (défaut: 200)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: barnards-star)",
    )
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        batch_size=args.batch_size,
        system_filter=args.system,
    )


if __name__ == "__main__":
    sys.exit(main())
