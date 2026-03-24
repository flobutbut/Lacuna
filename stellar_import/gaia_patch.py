#!/usr/bin/env python3
"""
Patch Gaia DR3 — complète color_index (depuis bp_rp) et optionnellement age
depuis le catalogue Gaia DR3.

Matching : par HIP (prioritaire) ou par coordonnées (cone search fallback).
Source : GAIA pour color_index, EXTRAPOLATED pour age estimé.

Idempotent : respecte la hiérarchie des sources (ne remplace pas NASA/MANUAL).
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
from upsert_systems import fetch_existing_systems

ROOT = Path(__file__).resolve().parent.parent
GAIA_TAP = "https://gea.esac.esa.int/tap-server/tap/sync"
PAGE_SIZE = 1000
UNMATCHED_LOG = Path(__file__).resolve().parent / "gaia_patch_unmatched.log"

SOURCE_PRIORITY = {
    "GAIA": 100,
    "NASA": 100,
    "JWST": 100,
    "HYG": 80,
    "SIMBAD": 80,
    "MANUAL": 60,
    "EXTRAPOLATED": 30,
    "PROCEDURAL": 10,
}


def should_update(incoming: str, existing: Optional[str]) -> bool:
    """True si la source entrante peut remplacer l'existante."""
    if existing == "MANUAL":
        return False
    return SOURCE_PRIORITY.get(incoming, 0) > SOURCE_PRIORITY.get(existing or "", 0)


def bp_rp_to_bv(bp_rp: float) -> float:
    """
    Conversion approximative BP-RP → B-V (Jordi et al. 2010).
    Valide pour séquence principale FGK. Précision ~0.05 mag.
    """
    x = float(bp_rp)
    bv = 0.0981 + 0.6933 * x - 0.1820 * (x**2) + 0.0304 * (x**3)
    return round(bv, 4)


def estimate_age_from_hr(teff: float, logg: float, feh: float) -> Optional[float]:
    """
    Estimation d'âge très approximative depuis la position HR.
    Uniquement FGK séquence principale. Retourne l'âge en Ga ou None.
    """
    if not (4000 < teff < 7500 and 4.0 < logg < 5.0):
        return None
    age_proxy = (logg - 4.44) * 15 + 4.6
    age = max(0.1, min(14.0, age_proxy))
    return round(age, 1)


def query_gaia(adql: str) -> list[dict]:
    """Exécute une requête ADQL sur Gaia TAP et retourne une liste de dicts."""
    params = {
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "json",
        "QUERY": adql,
    }
    resp = requests.get(GAIA_TAP, params=params, timeout=120)
    resp.raise_for_status()
    data = resp.json()

    # Format TAP JSON : metadata + data
    if "metadata" in data and "data" in data:
        cols = [c["name"] for c in data["metadata"]]
        return [dict(zip(cols, row)) for row in data["data"]]
    # Format alternatif (certains endpoints)
    if "results" in data:
        cols = [c["name"] for c in data["results"].get("metadata", [])]
        return [dict(zip(cols, row)) for row in data["results"].get("data", [])]
    return []


def extract_hip_from_id(system_id: str) -> Optional[int]:
    """
    Extrait le numéro Hipparcos depuis l'id du système.
    Forme attendue : "hip-NNNNN" (ex: hip-570, hip-6).
    Retourne None si l'id ne matche pas.
    """
    if not system_id:
        return None
    m = re.match(r"^hip-(\d+)$", system_id.strip().lower())
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def xyz_to_radec(x: float, y: float, z: float) -> tuple[float, float]:
    """Convertit x,y,z (al) en RA, Dec (degrés)."""
    import math

    dist = (x * x + y * y + z * z) ** 0.5
    if dist == 0:
        return 0.0, 0.0
    dec = math.degrees(math.asin(z / dist))
    ra = math.degrees(math.atan2(y, x))
    if ra < 0:
        ra += 360.0
    return ra, dec


def run(
    *,
    dry_run: bool = True,
    batch_size: int = 1000,
    system_filter: Optional[str] = None,
) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    log = logging.getLogger(__name__)

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    existing = fetch_existing_systems(client)
    all_systems = []
    seen = set()
    for v in existing.values():
        if isinstance(v, dict) and v.get("id") and v["id"] not in seen:
            seen.add(v["id"])
            all_systems.append(v)

    total = len(all_systems)
    log.info("Systèmes en base : %d", total)

    if system_filter:
        fn = system_filter.strip().lower().replace("_", "-")
        all_systems = [
            s
            for s in all_systems
            if (s.get("id") or "").lower().replace("_", "-") == fn
        ]
        if not all_systems:
            log.warning("Filtre --system '%s' : aucun système", system_filter)
            return 0

    # Systèmes à traiter (besoin color_index ou age)
    need_ci = [s for s in all_systems if s.get("color_index") is None]
    need_age = [s for s in all_systems if s.get("age") is None]
    candidates = list({s["id"]: s for s in need_ci + need_age}.values())

    # Matching par HIP
    hip_ids = []
    systems_by_hip: dict[int, dict] = {}
    for s in candidates:
        hip = extract_hip_from_id(s["id"])
        if hip:
            hip_ids.append(hip)
            systems_by_hip[hip] = s

    hip_ids = list(set(hip_ids))
    gaia_by_hip: dict[int, dict] = {}
    hip_matched = 0

    if hip_ids:
        log.info("Matching par HIP : %d / %d tentés", len(hip_ids), len(candidates))
        for i in range(0, len(hip_ids), 200):
            batch = hip_ids[i : i + 200]
            placeholders = ",".join(str(h) for h in batch)
            query = f"""
            SELECT g.source_id, g.ra, g.dec, g.parallax,
                   g.bp_rp, g.teff_gspphot, g.logg_gspphot, g.mh_gspphot,
                   g.phot_g_mean_mag, g.parallax_over_error,
                   xm.original_ext_source_id AS hip
            FROM gaiadr3.gaia_source g
            JOIN gaiadr3.hipparcos2_best_neighbour xm ON xm.source_id = g.source_id
            WHERE xm.original_ext_source_id IN ({placeholders})
              AND g.parallax_over_error > 5
            """
            try:
                rows = query_gaia(query)
                for r in rows:
                    hip_val = r.get("hip") or r.get("original_ext_source_id")
                    if hip_val is not None:
                        try:
                            h = int(float(hip_val))
                            gaia_by_hip[h] = r
                            hip_matched += 1
                        except (ValueError, TypeError):
                            pass
            except Exception as e:
                log.warning("Erreur requête Gaia HIP batch: %s", e)

    log.info("Matching par HIP : %d trouvés", len(gaia_by_hip))

    # Matching par coordonnées (limité pour perf — 100 systèmes max)
    coords_tried = 0
    coords_matched = 0
    matched_ids = {systems_by_hip[k]["id"] for k in gaia_by_hip if k in systems_by_hip}
    no_hip = [s for s in candidates if s["id"] not in matched_ids]

    for s in no_hip[:100]:
        coords = s.get("coordinates")
        if not coords or not isinstance(coords, dict):
            continue
        try:
            x = float(coords.get("x") or 0)
            y = float(coords.get("y") or 0)
            z = float(coords.get("z") or 0)
        except (TypeError, ValueError):
            continue
        if x == 0 and y == 0 and z == 0:
            continue
        ra, dec = xyz_to_radec(x, y, z)
        coords_tried += 1
        query = f"""
        SELECT TOP 1 source_id, ra, dec, bp_rp, teff_gspphot, logg_gspphot,
               parallax, parallax_over_error, phot_g_mean_mag
        FROM gaiadr3.gaia_source
        WHERE 1=CONTAINS(
          POINT('ICRS', ra, dec),
          CIRCLE('ICRS', {ra}, {dec}, 0.00139)
        )
        AND parallax_over_error > 5
        ORDER BY phot_g_mean_mag ASC
        """
        try:
            rows = query_gaia(query)
            if rows:
                r = rows[0]
                fake_key = -(coords_tried + 1)
                gaia_by_hip[fake_key] = r
                systems_by_hip[fake_key] = s
                coords_matched += 1
        except Exception as e:
            log.debug("Cone search %s: %s", s["id"], e)

    log.info("Matching par coordonnées : %d / %d tentés", coords_matched, min(len(no_hip), 100))

    # Construire updates
    to_update = []
    color_index_count = 0
    age_count = 0
    teff_count = 0

    for key in gaia_by_hip:
        gaia_row = gaia_by_hip[key]
        sys_row = systems_by_hip.get(key)
        if not sys_row:
            continue
        sid = sys_row["id"]
        fs = dict(sys_row.get("field_sources") or {})
        if isinstance(fs, str):
            try:
                fs = json.loads(fs) if fs.strip() else {}
            except json.JSONDecodeError:
                fs = {}
        attrs = dict(sys_row.get("attributes") or {})
        if isinstance(attrs, str):
            try:
                attrs = json.loads(attrs) if attrs.strip() else {}
            except json.JSONDecodeError:
                attrs = {}
        updates = {}

        bp_rp = gaia_row.get("bp_rp")
        if bp_rp is not None:
            try:
                bv = bp_rp_to_bv(float(bp_rp))
                existing_src = fs.get("color_index")
                if should_update("GAIA", existing_src) or sys_row.get("color_index") is None:
                    updates["color_index"] = bv
                    fs["color_index"] = "GAIA"
                    color_index_count += 1
            except (TypeError, ValueError):
                pass

        teff = gaia_row.get("teff_gspphot")
        if teff is not None:
            try:
                attrs["teff_gspphot"] = float(teff)
                teff_count += 1
            except (TypeError, ValueError):
                pass

        logg = gaia_row.get("logg_gspphot")
        mh = gaia_row.get("mh_gspphot")
        if teff and logg and mh is not None:
            try:
                age = estimate_age_from_hr(float(teff), float(logg), float(mh))
                if age and sys_row.get("age") is None:
                    existing_src = fs.get("age")
                    if should_update("EXTRAPOLATED", existing_src):
                        updates["age"] = age
                        fs["age"] = "EXTRAPOLATED"
                        age_count += 1
            except (TypeError, ValueError):
                pass

        if updates:
            updates["field_sources"] = fs
            # Note: stellar_systems n'a pas de colonne attributes — teff_gspphot non persisté
            to_update.append({"id": sid, **updates})

    updated_ids = {u["id"] for u in to_update}
    matched_ids = {systems_by_hip[k]["id"] for k in gaia_by_hip if k in systems_by_hip}
    unmatched = [s["id"] for s in candidates if s["id"] not in matched_ids]

    print()
    print("=== Gaia DR3 Patch — LACUNA ===")
    print(f"Systèmes en base : {total}")
    print()
    print(f"Matching par HIP : {len(gaia_by_hip)} / {len(hip_ids)} tentés")
    print(f"Matching par coordonnées : {coords_matched} / {coords_tried} tentés")
    print(f"Total matchings Gaia : {len(gaia_by_hip)}")
    print(f"Non matchés : {len(unmatched)}")
    print()
    print("Champs à écrire :")
    print(f"  color_index  : {color_index_count} (depuis bp_rp)")
    print(f"  age          : {age_count} (estimation HR — source EXTRAPOLATED)")
    print(f"  teff lu      : {teff_count} (non persisté — pas de colonne attributes)")
    print()

    if unmatched:
        UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
            for u in sorted(set(unmatched))[:5000]:
                f.write(u + "\n")

    if dry_run:
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
        if unmatched:
            print(f"Non matchés loggés : {UNMATCHED_LOG}")
        return 0

    for row in to_update:
        try:
            payload = {k: v for k, v in row.items() if k != "id"}
            client.table("stellar_systems").update(payload).eq("id", row["id"]).execute()
            log.info("  %s : color_index=%s age=%s", row["id"], payload.get("color_index"), payload.get("age"))
        except Exception as e:
            log.exception("Erreur update %s : %s", row["id"], e)

    print(f"Mode apply : {len(to_update)} système(s) mis à jour.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Patch Gaia DR3 — color_index, age")
    parser.add_argument("--apply", action="store_true", help="Écrire en base")
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Taille des lots HIP (défaut: 1000)",
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
