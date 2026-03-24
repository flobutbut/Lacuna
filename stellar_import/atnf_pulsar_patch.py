#!/usr/bin/env python3
"""
Patch ATNF — complète coordonnées, distance et paramètres pulsars depuis le catalogue ATNF.

Pour chaque pulsar en base (object_type = 'PULSAR'), cherche la correspondance
dans l'ATNF Pulsar Catalogue et complète les champs manquants :
coordinates, distance, attributes (période, champ magnétique, cône d'émission).

Priorité ATNF = SIMBAD. Ne jamais écraser field_sources MANUAL.
Idempotent.
"""
import argparse
import json
import logging
import math
import re
import sys
from pathlib import Path
from typing import Any, Optional

import pandas as pd
from astropy.coordinates import SkyCoord
import astropy.units as u

from constellation_patch import get_constellation_abbr
from supabase_client import get_supabase_client

SCRIPT_DIR = Path(__file__).resolve().parent
UNMATCHED_LOG = SCRIPT_DIR / "atnf_unmatched.log"

KPC_TO_LY = 3261.5638  # 1 kpc ≈ 3261.56 al

ATNF_PARAMS = [
    "JNAME",
    "BNAME",
    "RAJ",
    "DECJ",
    "DIST",
    "DIST_DM",
    "P0",
    "P1",
    "F0",
    "BSURF",
    "W50",
    "W10",
    "TYPE",
    "AGE",
]


def _safe_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    if hasattr(v, "filled"):
        v = v.filled()
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _safe_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    if hasattr(v, "filled"):
        v = v.filled()
    s = str(v).strip()
    return s if s and s.lower() != "nan" and s.lower() != "--" else None


def load_atnf_catalogue() -> dict[str, dict]:
    """Télécharge et indexe le catalogue ATNF par noms normalisés."""
    try:
        from psrqpy import QueryATNF
    except ImportError:
        raise ImportError("psrqpy requis : pip install psrqpy astropy")

    query = QueryATNF(params=ATNF_PARAMS, include_errs=False)
    df = query.pandas
    catalogue: dict[str, dict] = {}

    for _, row in df.iterrows():
        data = {}
        for k in ATNF_PARAMS:
            if k in df.columns:
                val = row[k] if k in row.index else None
                if val is None or pd.isna(val):
                    data[k] = None
                elif isinstance(val, (int, float, str)):
                    data[k] = val
                else:
                    try:
                        data[k] = float(val) if isinstance(val, (int, float)) else str(val)
                    except (ValueError, TypeError):
                        data[k] = None

        jname = _safe_str(data.get("JNAME"))
        bname = _safe_str(data.get("BNAME"))

        def add_key(key: str) -> None:
            if key and key not in catalogue:
                catalogue[key] = data

        if jname:
            jn = jname.lower().replace(" ", "")
            add_key(f"psr-{jn}")
            add_key(jn)
            add_key(jname)
        if bname:
            bn = bname.lower().replace(" ", "")
            add_key(f"psr-{bn}")
            add_key(bn)
            add_key(bname)

    return catalogue


def find_atnf_match(system_id: str, system_name: str, catalogue: dict) -> Optional[dict]:
    """Cherche la correspondance ATNF pour un pulsar en base."""
    if not system_id and not system_name:
        return None

    sid = (system_id or "").strip().lower()
    sname = (system_name or "").strip()

    if sid in catalogue:
        return catalogue[sid]
    slug = sname.lower().replace(" ", "-").replace("+", "+")
    if slug in catalogue:
        return catalogue[slug]
    flat = slug.replace("-", "")
    if flat in catalogue:
        return catalogue[flat]

    m = re.search(r"[jb]\d{4}[+-]\d{2,4}", (sid + " " + sname), re.IGNORECASE)
    if m:
        key = m.group(0).lower()
        if key in catalogue:
            return catalogue[key]
        if f"psr-{key}" in catalogue:
            return catalogue[f"psr-{key}"]

    return None


def radec_to_deg(raj: Any, decj: Any) -> tuple[float, float]:
    """Convertit RAJ/DECJ ATNF (hh:mm:ss / dd:mm:ss) en degrés décimaux."""
    try:
        raj_s = str(raj).strip() if raj is not None else ""
        decj_s = str(decj).strip() if decj is not None else ""
        if not raj_s or not decj_s:
            return 0.0, 0.0
        coord = SkyCoord(raj_s, decj_s, unit=(u.hourangle, u.deg))
        return float(coord.ra.deg), float(coord.dec.deg)
    except Exception:
        return 0.0, 0.0


def xyz_from_radec_al(ra_deg: float, dec_deg: float, dist_al: float) -> dict:
    """RA/Dec (deg) + distance (al) → coordonnées cartésiennes (al)."""
    ra_rad = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)
    return {
        "x": round(dist_al * math.cos(dec_rad) * math.cos(ra_rad), 3),
        "y": round(dist_al * math.cos(dec_rad) * math.sin(ra_rad), 3),
        "z": round(dist_al * math.sin(dec_rad), 3),
    }


def dist_kpc_to_al(dist_kpc: float) -> float:
    return dist_kpc * KPC_TO_LY


def build_pulsar_attributes(atnf_data: dict) -> dict:
    """Construit le jsonb attributes pour un pulsar depuis les données ATNF."""
    attrs: dict[str, Any] = {}

    if atnf_data.get("P0") is not None:
        p0 = _safe_float(atnf_data["P0"])
        if p0 is not None:
            attrs["pulse_period_s"] = p0
            attrs["pulse_period_ms"] = p0 * 1000

    if atnf_data.get("F0") is not None:
        f0 = _safe_float(atnf_data["F0"])
        if f0 is not None:
            attrs["rotation_frequency_hz"] = f0

    if atnf_data.get("BSURF") is not None:
        b = _safe_float(atnf_data["BSURF"])
        if b is not None:
            attrs["magnetic_field_gauss"] = b

    if atnf_data.get("W50") is not None:
        w = _safe_float(atnf_data["W50"])
        if w is not None:
            attrs["emission_width_w50_ms"] = w

    if atnf_data.get("W10") is not None:
        w = _safe_float(atnf_data["W10"])
        if w is not None:
            attrs["emission_width_w10_ms"] = w

    if atnf_data.get("AGE") is not None:
        a = _safe_float(atnf_data["AGE"])
        if a is not None:
            attrs["characteristic_age_yr"] = a

    if atnf_data.get("TYPE") is not None:
        t = _safe_str(atnf_data["TYPE"])
        if t:
            attrs["pulsar_type"] = t

    return attrs


def _can_write_field(field: str, current_value: Any, field_sources: dict) -> bool:
    if field_sources.get(field) == "MANUAL":
        return False
    return True


def run(
    *,
    dry_run: bool = True,
    apply: bool = False,
    batch_size: int = 500,
    pulsar_filter: Optional[str] = None,
) -> int:
    log = logging.getLogger("atnf_pulsar")
    log.setLevel(logging.INFO)
    log.propagate = False
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    log.addHandler(h)

    log.info("=== ATNF Pulsar Patch — LACUNA ===")

    try:
        sb = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    # 1. Charger les pulsars en base (pagination complète)
    select_cols = "id,name,object_type,coordinates,distance,age,field_sources"
    has_attributes_col = True
    try:
        sb.table("stellar_systems").select(f"{select_cols},attributes").eq("object_type", "PULSAR").limit(1).execute()
    except Exception as e:
        if "attributes" in str(e) and "does not exist" in str(e).lower():
            log.warning("Colonne 'attributes' absente — exécuter migration 00033. Mise à jour coords/distance/age uniquement.")
            has_attributes_col = False
        else:
            raise

    pulsars: list[dict] = []
    offset = 0
    fetch_batch = 1000
    while True:
        cols = f"{select_cols},attributes" if has_attributes_col else select_cols
        q = sb.table("stellar_systems").select(cols).eq("object_type", "PULSAR")
        if pulsar_filter:
            q = q.eq("id", pulsar_filter.strip())
            resp = q.execute()
            pulsars = resp.data or []
            break
        q = q.range(offset, offset + fetch_batch - 1)
        resp = q.execute()
        if not resp.data:
            break
        pulsars.extend(resp.data)
        offset += fetch_batch

    for p in pulsars:
        p.setdefault("attributes", {})
    log.info("Pulsars en base (object_type = PULSAR) : %d", len(pulsars))

    if not pulsars:
        return 0

    # 2. Charger le catalogue ATNF
    try:
        catalogue = load_atnf_catalogue()
    except Exception as e:
        log.exception("Erreur chargement ATNF: %s", e)
        return 1
    log.info("Catalogue ATNF chargé : %d pulsars", len(catalogue))

    matched: list[tuple[dict, dict]] = []
    unmatched: list[dict] = []
    with_dist = 0
    without_dist = 0
    to_write_coords = 0
    to_write_dist = 0
    to_write_attrs = 0
    to_write_age = 0

    for row in pulsars:
        atnf = find_atnf_match(row.get("id", ""), row.get("name", ""), catalogue)
        if not atnf:
            unmatched.append({"id": row.get("id"), "name": row.get("name")})
            continue

        matched.append((row, atnf))
        dist_kpc = _safe_float(atnf.get("DIST")) or _safe_float(atnf.get("DIST_DM"))
        if dist_kpc and dist_kpc > 0:
            with_dist += 1
        else:
            without_dist += 1

        fs = dict(row.get("field_sources") or {})
        if isinstance(fs, str):
            try:
                fs = json.loads(fs) if fs.strip() else {}
            except json.JSONDecodeError:
                fs = {}

        if atnf.get("RAJ") and atnf.get("DECJ") and _can_write_field("coordinates", row.get("coordinates"), fs):
            if dist_kpc and dist_kpc > 0:
                to_write_coords += 1
        if dist_kpc and dist_kpc > 0 and _can_write_field("distance", row.get("distance"), fs):
            to_write_dist += 1
        if has_attributes_col:
            attrs = build_pulsar_attributes(atnf)
            if attrs and _can_write_field("attributes", row.get("attributes"), fs):
                to_write_attrs += 1
        age_yr = _safe_float(atnf.get("AGE"))
        if age_yr and age_yr > 0 and _can_write_field("age", row.get("age"), fs):
            age_ga = age_yr / 1e9
            if 0.0001 < age_ga < 20:
                to_write_age += 1

    log.info("")
    log.info("Matchings trouvés : %d / %d", len(matched), len(pulsars))
    log.info("  Avec distance ATNF : %d", with_dist)
    log.info("  Sans distance (pas de DM fiable) : %d", without_dist)
    log.info("")
    log.info("Champs à écrire :")
    log.info("  coordinates : %d", to_write_coords)
    log.info("  distance    : %d", to_write_dist)
    log.info("  attributes  : %d (période, champ magnétique, cône)", to_write_attrs)
    log.info("  age         : %d (depuis AGE caractéristique)", to_write_age)
    log.info("")
    log.info("Non matchés : %d (loggés dans %s)", len(unmatched), UNMATCHED_LOG)

    if unmatched:
        UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
            for u in unmatched:
                f.write(f"{u.get('id', '')}\t{u.get('name', '')}\n")

    if not apply:
        log.info("")
        log.info("Mode dry-run — aucune écriture. Lancer avec --apply pour exécuter.")
        return 0

    written = 0
    for row, atnf in matched:
        updates: dict[str, Any] = {}
        fs = dict(row.get("field_sources") or {})

        ra_j = _safe_str(atnf.get("RAJ"))
        dec_j = _safe_str(atnf.get("DECJ"))
        dist_kpc = _safe_float(atnf.get("DIST")) or _safe_float(atnf.get("DIST_DM"))

        if ra_j and dec_j and dist_kpc and dist_kpc > 0 and _can_write_field("coordinates", row.get("coordinates"), fs):
            ra_deg, dec_deg = radec_to_deg(ra_j, dec_j)
            dist_al = dist_kpc_to_al(dist_kpc)
            coords = xyz_from_radec_al(ra_deg, dec_deg, dist_al)
            updates["coordinates"] = coords
            fs["coordinates"] = "ATNF"

        if dist_kpc and dist_kpc > 0 and _can_write_field("distance", row.get("distance"), fs):
            updates["distance"] = round(dist_kpc_to_al(dist_kpc), 6)
            fs["distance"] = "ATNF"

        if updates.get("coordinates") and ra_j and dec_j:
            ra_deg, dec_deg = radec_to_deg(ra_j, dec_j)
            const = get_constellation_abbr(ra_deg, dec_deg)
            if const:
                updates["constellation_abbr"] = const
                fs["constellation_abbr"] = "ATNF"

        if has_attributes_col:
            attrs = build_pulsar_attributes(atnf)
            if attrs and _can_write_field("attributes", row.get("attributes"), fs):
                existing_attrs = dict(row.get("attributes") or {})
                existing_attrs.update(attrs)
                updates["attributes"] = existing_attrs
                fs["attributes"] = "ATNF"

        age_yr = _safe_float(atnf.get("AGE"))
        if age_yr and age_yr > 0 and _can_write_field("age", row.get("age"), fs):
            age_ga = age_yr / 1e9
            if 0.0001 < age_ga < 20:
                updates["age"] = round(age_ga, 6)
                fs["age"] = "ATNF"

        if updates:
            updates["field_sources"] = fs
            try:
                sb.table("stellar_systems").update(updates).eq("id", row["id"]).execute()
                written += 1
                log.debug("  Mis à jour %s", row.get("id"))
            except Exception as e:
                log.error("  Erreur update %s : %s", row.get("id"), e)

    log.info("")
    log.info("Mises à jour effectuées : %d", written)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Patch pulsars : coordonnées et paramètres depuis ATNF")
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    parser.add_argument("--apply", action="store_true", help="Appliquer les écritures")
    parser.add_argument("--batch-size", type=int, default=500, help="Taille des lots (info)")
    parser.add_argument("--pulsar", type=str, help="Tester sur un pulsar (id)")
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        apply=args.apply,
        batch_size=args.batch_size,
        pulsar_filter=args.pulsar,
    )


if __name__ == "__main__":
    sys.exit(main())
