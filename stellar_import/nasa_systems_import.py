#!/usr/bin/env python3
"""
Import des systèmes exoplanétaires NASA manquants (dist <= 500 al).

Récupère depuis NASA TAP les données stellaires et planétaires,
crée stellar_systems et system_objects pour les 1 201 systèmes absents de la base.

Règles impératives :
- Ne jamais écraser un système existant
- field_sources : uniquement les champs renseignés
- Idempotent : relancé deux fois, ne crée rien en double
"""
import argparse
import json
import logging
import math
import re
import sys
import uuid
from pathlib import Path
from typing import Any, Optional

import requests

from supabase_client import get_supabase_client
from upsert_systems import HOSTNAME_TO_ID, fetch_existing_systems

ROOT = Path(__file__).resolve().parent.parent
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
PARSEC_TO_LY = 3.26156
LIMIT_PC = 500 / PARSEC_TO_LY  # ~153.26 pc
LOG_FILE = ROOT / "nasa_systems_import.log"
AGE_MIN_GA = 0.001
AGE_MAX_GA = 14.0


def _hostname_to_slug(hn: str) -> str:
    """Kepler-452 → kepler-452, 55 Cnc → 55-cnc."""
    return hn.strip().lower().replace(" ", "-").replace("'", "").replace(".", "")


def hostname_to_id(hostname: str) -> str:
    """
    Construit l'id Supabase depuis le hostname NASA.
    Utilise HOSTNAME_TO_ID pour les systèmes LACUNA connus, sinon slug.
    """
    hn = hostname.strip().lower()
    hn_norm = " ".join(hn.split())
    if hn_norm in HOSTNAME_TO_ID:
        return HOSTNAME_TO_ID[hn_norm]
    s = re.sub(r"[^a-z0-9]+", "-", hn)
    return s.strip("-") or hn.replace(" ", "-")


def coords_from_ra_dec(ra_deg: float, dec_deg: float, dist_pc: float) -> dict:
    """
    Convertit RA/Dec/distance en coordonnées cartésiennes (années-lumière).
    Convention HYG : x vers centre galactique, z vers pôle nord.
    """
    dist_al = dist_pc * PARSEC_TO_LY
    ra_rad = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)
    x = dist_al * math.cos(dec_rad) * math.cos(ra_rad)
    y = dist_al * math.cos(dec_rad) * math.sin(ra_rad)
    z = dist_al * math.sin(dec_rad)
    return {"x": round(x, 10), "y": round(y, 10), "z": round(z, 10)}


def parse_atmoscomp(raw: Any) -> Optional[dict]:
    """Convertit la chaîne NASA en jsonb structuré."""
    if not raw or (isinstance(raw, float) and math.isnan(raw)):
        return None
    s = str(raw).strip()
    if not s or s.lower() == "nan":
        return None
    molecules = [m.strip() for m in s.split(",") if m.strip()]
    if not molecules:
        return None
    return {"molecules": molecules, "source": "NASA"}


def is_valid_age(age: Any) -> bool:
    """Ignore les âges aberrants (en Ga)."""
    if age is None:
        return False
    try:
        v = float(age)
        return AGE_MIN_GA < v < AGE_MAX_GA
    except (TypeError, ValueError):
        return False


def _safe_float(v: Any) -> Optional[float]:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _safe_int(v: Any) -> Optional[int]:
    f = _safe_float(v)
    return int(f) if f is not None else None


def _safe_str(v: Any) -> Optional[str]:
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def fetch_nasa_stars() -> list[dict]:
    """Requête NASA TAP — données étoiles hôtes."""
    query = """
        SELECT DISTINCT
            hostname,
            st_spectype, st_age, st_teff, st_rad, st_mass, st_lum,
            st_met, st_logg, sy_dist, sy_pnum,
            ra, dec
        FROM ps
        WHERE default_flag = 1
          AND sy_dist IS NOT NULL
          AND sy_dist <= 153.26
        ORDER BY sy_dist ASC
    """
    params = {"query": query.strip(), "format": "json"}
    resp = requests.get(NASA_TAP, params=params, timeout=180)
    resp.raise_for_status()
    return resp.json()


def fetch_nasa_planets() -> list[dict]:
    """Requête NASA TAP — données planètes."""
    query = """
        SELECT
            pl_name, hostname, pl_letter,
            pl_orbper, pl_orbsmax, pl_orbeccen, pl_orbincl,
            pl_rade, pl_masse, pl_eqt, pl_insol,
            pl_controv_flag, sy_dist
        FROM ps
        WHERE default_flag = 1
          AND sy_dist IS NOT NULL
          AND sy_dist <= 153.26
        ORDER BY hostname, pl_letter
    """
    params = {"query": query.strip(), "format": "json"}
    resp = requests.get(NASA_TAP, params=params, timeout=180)
    resp.raise_for_status()
    return resp.json()


def build_stellar_system(row: dict) -> Optional[dict]:
    """Construit le payload stellar_systems depuis une ligne NASA."""
    hostname = _safe_str(row.get("hostname"))
    sy_dist = _safe_float(row.get("sy_dist"))
    if not hostname or sy_dist is None or sy_dist <= 0:
        return None

    system_id = hostname_to_id(hostname)
    ra = _safe_float(row.get("ra"))
    dec = _safe_float(row.get("dec"))
    st_lum = _safe_float(row.get("st_lum"))
    st_age = _safe_float(row.get("st_age"))
    sy_pnum = _safe_int(row.get("sy_pnum"))

    coordinates = None
    if ra is not None and dec is not None:
        coordinates = coords_from_ra_dec(ra, dec, sy_dist)

    luminosity = None
    if st_lum is not None:
        try:
            luminosity = 10 ** st_lum
        except (OverflowError, ValueError):
            pass

    age = st_age if is_valid_age(st_age) else None

    payload = {
        "id": system_id,
        "name": hostname,
        "spectral_type": _safe_str(row.get("st_spectype")),
        "distance": round(sy_dist * PARSEC_TO_LY, 6),
        "age": age,
        "luminosity": round(luminosity, 10) if luminosity else None,
        "planets": sy_pnum,
        "coordinates": coordinates,
    }
    payload = {k: v for k, v in payload.items() if v is not None}
    if "name" not in payload:
        payload["name"] = hostname

    field_sources = {k: "NASA" for k, v in payload.items() if k != "id" and v is not None}
    if field_sources:
        payload["field_sources"] = field_sources

    return payload


def build_planet_object(row: dict, system_id: str) -> Optional[dict]:
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


def run(
    *,
    dry_run: bool = True,
    batch_size: int = 100,
    system_filter: Optional[str] = None,
) -> int:
    log_handlers = [logging.StreamHandler(sys.stderr)]
    try:
        fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
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

    logging.info("Requête NASA Exoplanet Archive (étoiles)...")
    try:
        stars_raw = fetch_nasa_stars()
    except Exception as e:
        logging.exception("Erreur fetch NASA stars: %s", e)
        return 1

    logging.info("Requête NASA Exoplanet Archive (planètes)...")
    try:
        planets_raw = fetch_nasa_planets()
    except Exception as e:
        logging.exception("Erreur fetch NASA planets: %s", e)
        return 1

    dans_zone = [r for r in stars_raw if _safe_float(r.get("sy_dist")) is not None]
    dans_zone = [r for r in dans_zone if _safe_float(r.get("sy_dist")) <= LIMIT_PC]
    hostnames_zone = {_safe_str(r.get("hostname")) for r in dans_zone if _safe_str(r.get("hostname"))}

    existing = fetch_existing_systems(client)
    ids_in_base = {v.get("id") for v in existing.values() if isinstance(v, dict) and v.get("id")}
    ids_in_base_norm = {str(x).lower().replace("_", "-") if x else "" for x in ids_in_base}

    to_import_hostnames = set()
    already_in_base_count = 0
    for hn in hostnames_zone:
        sid = hostname_to_id(hn)
        sid_norm = sid.lower().replace("_", "-") if sid else ""
        if sid in ids_in_base or sid_norm in ids_in_base_norm:
            already_in_base_count += 1
        else:
            to_import_hostnames.add(hn)

    if system_filter:
        filter_norm = system_filter.strip().lower().replace("_", "-")
        to_import_hostnames = {
            h
            for h in to_import_hostnames
            if _hostname_to_slug(h) == filter_norm or hostname_to_id(h) == filter_norm
        }
        if not to_import_hostnames:
            logging.warning("Filtre --system '%s' : aucun système à importer", system_filter)
            return 0

    seen_hostnames = set()
    stars_by_hostname = {}
    for r in dans_zone:
        hn = _safe_str(r.get("hostname"))
        if not hn or hn not in to_import_hostnames or hn in seen_hostnames:
            continue
        seen_hostnames.add(hn)
        built = build_stellar_system(r)
        if built:
            stars_by_hostname[hn] = built

    planets_by_system = {}
    for r in planets_raw:
        hn = _safe_str(r.get("hostname"))
        if not hn or hn not in to_import_hostnames:
            continue
        sid = hostname_to_id(hn)
        if sid not in [s["id"] for s in stars_by_hostname.values()]:
            continue
        if sid not in planets_by_system:
            planets_by_system[sid] = []
        obj = build_planet_object(r, sid)
        if obj:
            planets_by_system[sid].append(obj)

    systems_to_create = list(stars_by_hostname.values())
    planets_to_create = []
    for objs in planets_by_system.values():
        planets_to_create.extend(objs)

    errors = 0

    print()
    print("=== NASA Systems Import — LACUNA ===")
    print(f"Systèmes NASA dans les 500 al : {len(hostnames_zone)}")
    print(f"Déjà en base : {already_in_base_count}")
    print(f"À importer : {len(to_import_hostnames)}")
    print()
    print("--- Dry-run ---" if dry_run else "--- Apply ---")
    print(f"Systèmes à créer : {len(systems_to_create)}")
    print(f"Planètes à créer : {len(planets_to_create)}")
    print(f"Systèmes déjà présents (skip) : {already_in_base_count}")
    print(f"Erreurs / données invalides : {errors}")

    if dry_run:
        print()
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
        return 0

    created_systems = set()
    for i in range(0, len(systems_to_create), batch_size):
        batch = systems_to_create[i : i + batch_size]
        try:
            client.table("stellar_systems").upsert(
                batch, on_conflict="id", ignore_duplicates=True
            ).execute()
            for s in batch:
                created_systems.add(s["id"])
                logging.info("  %s : créé/ignoré (existant)", s["id"])
        except Exception as e:
            logging.exception("Erreur upsert stellar_systems batch: %s", e)
            errors += 1

    planets_to_create = [p for p in planets_to_create if p["system_id"] in created_systems]
    for obj in planets_to_create:
        obj["id"] = str(uuid.uuid4())

    for i in range(0, len(planets_to_create), batch_size):
        batch = planets_to_create[i : i + batch_size]
        try:
            client.table("system_objects").insert(batch).execute()
            for p in batch:
                logging.info("  %s / %s : planète créée", p["system_id"], p.get("designation", "?"))
        except Exception as e:
            logging.exception("Erreur insert system_objects batch: %s", e)
            errors += 1

    habitable_systems = {p["system_id"] for p in planets_to_create if p.get("in_habitable_zone")}
    for sid in habitable_systems:
        try:
            client.table("stellar_systems").update({"habitable_zone": True}).eq("id", sid).execute()
            logging.info("  %s : habitable_zone = true", sid)
        except Exception as e:
            logging.exception("Erreur update habitable_zone %s: %s", sid, e)

    print()
    print(f"Mode apply : {len(created_systems)} système(s) créé(s), {len(planets_to_create)} planète(s).")
    print(f"Log : {LOG_FILE}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import systèmes exoplanétaires NASA manquants (500 al)"
    )
    parser.add_argument("--apply", action="store_true", help="Écrire en base")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Simulation (défaut)")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=100,
        help="Taille des lots d'insertion (défaut: 100)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: Kepler-442)",
    )
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        batch_size=args.batch_size,
        system_filter=args.system,
    )


if __name__ == "__main__":
    sys.exit(main())
