#!/usr/bin/env python3
"""
Import SIMBAD — objets exotiques (pulsars, naines blanches, étoiles à neutrons, trous noirs).

Stratégie :
- Naines blanches (WD*) : filtre parallaxe (plx > 3.26, erreur < 30 %), max 500 objets.
- PSR, Magnetar, NS, BH : requête séparée sans filtre parallaxe (objets rares).

Ne jamais écraser object_type d'une entrée MANUAL.
Idempotent.
"""
import argparse
import json
import logging
import math
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Optional

import requests

from constellation_patch import get_constellation_abbr
from supabase_client import get_supabase_client
from upsert_systems import fetch_existing_systems

SCRIPT_DIR = Path(__file__).resolve().parent
SIMBAD_TAP = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync"
PARSEC_TO_LY = 3.26156
LIMIT_AL = 1000
PLX_MIN_MAS = 1000 / (LIMIT_AL / PARSEC_TO_LY)  # plx > 3.26 → dist < 1000 al
WD_MAX_OBJECTS = 500

RARE_OTYPES_SQL = "('PSR', 'Psr', 'Magnetar', 'NS', 'Ns', 'BH', 'Bh')"
WD_OTYPES_SQL = "('WD*', 'WD')"

OTYPE_MAP = {
    "PSR": "PULSAR",
    "Psr": "PULSAR",
    "Magnetar": "MAGNETAR",
    "WD*": "WHITE_DWARF",
    "WD": "WHITE_DWARF",
    "NS": "NEUTRON_STAR",
    "Ns": "NEUTRON_STAR",
    "BH": "BLACK_HOLE",
    "Bh": "BLACK_HOLE",
}

LABELS = {
    "PULSAR": "Pulsars",
    "MAGNETAR": "Magnétars",
    "WHITE_DWARF": "Naines blanches",
    "NEUTRON_STAR": "Étoiles à neutrons",
    "BLACK_HOLE": "Trous noirs",
}


def query_simbad(adql: str) -> list[dict]:
    """Requête SIMBAD TAP, retourne liste de dicts."""
    params = {
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "json",
        "QUERY": adql.strip(),
    }
    resp = requests.get(SIMBAD_TAP, params=params, timeout=180)
    resp.raise_for_status()
    data = resp.json()
    if "metadata" not in data or "data" not in data:
        return []
    cols = [c["name"] for c in data["metadata"]]
    return [dict(zip(cols, row)) for row in data["data"]]


def build_query_white_dwarfs(max_rows: int = WD_MAX_OBJECTS) -> str:
    """WD* : parallaxe stricte (< 1000 al), limité à max_rows."""
    return f"""
SELECT TOP {int(max_rows)}
    main_id,
    otype,
    ra,
    dec,
    plx_value,
    plx_err,
    sp_type,
    rvz_radvel
FROM basic
WHERE otype IN {WD_OTYPES_SQL}
  AND main_id NOT LIKE '%Sgr A%'
  AND main_id NOT LIKE '%Sagittarius A%'
  AND plx_value IS NOT NULL
  AND plx_value > {PLX_MIN_MAS}
  AND plx_err IS NOT NULL
  AND plx_value > 0
  AND (plx_err / plx_value) < 0.3
ORDER BY plx_value DESC
"""


def build_query_rare_exotica() -> str:
    """PSR, Magnetar, NS, BH : sans filtre parallaxe (objets rares)."""
    return f"""
SELECT
    main_id,
    otype,
    ra,
    dec,
    plx_value,
    plx_err,
    sp_type
FROM basic
WHERE otype IN {RARE_OTYPES_SQL}
  AND main_id NOT LIKE '%Sgr A%'
  AND main_id NOT LIKE '%Sagittarius A%'
ORDER BY main_id
"""


def simbad_id_to_lacuna(main_id: str) -> str:
    """Convertit le main_id SIMBAD en slug LACUNA."""
    s = str(main_id or "").strip()
    s = re.sub(r"^NAME\s+", "", s, flags=re.IGNORECASE)
    if "sgr a" in s.lower() or "sagittarius a" in s.lower():
        return "sgr-a"
    s = s.lower()
    s = re.sub(r"[^a-z0-9+\-]", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def radec_dist_to_xyz(ra_deg: float, dec_deg: float, dist_al: float) -> dict:
    """RA/Dec + distance (al) → coordonnées cartésiennes (al)."""
    ra_rad = math.radians(ra_deg)
    dec_rad = math.radians(dec_deg)
    x = dist_al * math.cos(dec_rad) * math.cos(ra_rad)
    y = dist_al * math.cos(dec_rad) * math.sin(ra_rad)
    z = dist_al * math.sin(dec_rad)
    return {"x": round(x, 5), "y": round(y, 5), "z": round(z, 5)}


def _safe_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _safe_str(v: Any) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() != "nan" else None


def is_sgr_a(main_id: str) -> bool:
    """Exclure Sgr A* (trou noir central galactique)."""
    s = (main_id or "").lower()
    return "sgr a" in s or "sagittarius a" in s or "sgr a*" in s


def _lacuna_type_from_row(row: dict) -> Optional[str]:
    otype_raw = _safe_str(row.get("otype"))
    if not otype_raw:
        return None
    return OTYPE_MAP.get(otype_raw)


def _parallax_ok_for_distance(plx: Optional[float], plx_err: Optional[float]) -> bool:
    if plx is None or plx <= 0:
        return False
    if plx_err is None:
        return False
    return (plx_err / plx) < 0.3


def _distance_from_plx(plx: float) -> float:
    return (1000.0 / plx) * PARSEC_TO_LY


def count_by_simbad_otype(rows: list[dict]) -> dict[str, int]:
    out: dict[str, int] = defaultdict(int)
    for r in rows:
        ot = _safe_str(r.get("otype")) or "?"
        out[ot] += 1
    return dict(sorted(out.items()))


def run(
    *,
    dry_run: bool = True,
    apply: bool = False,
    type_filter: Optional[str] = None,
    wd_limit: int = WD_MAX_OBJECTS,
) -> int:
    log = logging.getLogger("simbad_exotic")
    log.setLevel(logging.INFO)
    log.propagate = False
    log.handlers.clear()
    h = logging.StreamHandler(sys.stdout)
    h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    log.addHandler(h)

    log.info("=== SIMBAD Exotic Import — LACUNA ===")

    try:
        sb = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    fetch_wd = True
    fetch_rare = True
    if type_filter:
        tf = type_filter.strip().upper()
        if tf == "WHITE_DWARF":
            fetch_rare = False
        elif tf in ("PULSAR", "MAGNETAR", "NEUTRON_STAR", "BLACK_HOLE"):
            fetch_wd = False
        else:
            log.warning("Type inconnu : %s — import complet (WD + rares)", type_filter)

    rows_wd: list[dict] = []
    rows_rare: list[dict] = []

    try:
        if fetch_wd:
            rows_wd = query_simbad(build_query_white_dwarfs(max_rows=wd_limit))
            rows_wd = [r for r in rows_wd if not is_sgr_a(_safe_str(r.get("main_id")))]
        if fetch_rare:
            rows_rare = query_simbad(build_query_rare_exotica())
            rows_rare = [r for r in rows_rare if not is_sgr_a(_safe_str(r.get("main_id")))]
    except Exception as e:
        log.exception("Erreur requête SIMBAD: %s", e)
        return 1

    # --- Rapport SIMBAD par source de requête ---
    log.info("")
    log.info("--- Naines blanches (WD*, filtre parallaxe plx>%.2f mas, err/plx<0.3, max %d) ---", PLX_MIN_MAS, wd_limit)
    log.info("  Objets récupérés : %d", len(rows_wd))
    for ot, n in count_by_simbad_otype(rows_wd).items():
        log.info("    otype SIMBAD %s : %d", ot, n)

    log.info("")
    log.info("--- Objets rares (PSR, Magnetar, NS, BH — sans filtre parallaxe) ---")
    log.info("  Objets récupérés : %d", len(rows_rare))
    for ot, n in count_by_simbad_otype(rows_rare).items():
        log.info("    otype SIMBAD %s : %d", ot, n)

    # Fusion (dédoublonnage main_id)
    seen: set[str] = set()
    rows: list[dict] = []
    for r in rows_wd + rows_rare:
        mid = _safe_str(r.get("main_id"))
        if not mid or mid in seen:
            continue
        seen.add(mid)
        rows.append(r)

    log.info("")
    log.info("Total après fusion (sans doublon main_id) : %d", len(rows))

    existing = fetch_existing_systems(sb)
    existing_by_id = {}
    for v in existing.values():
        if isinstance(v, dict) and v.get("id"):
            existing_by_id[v["id"]] = v

    to_update: list[tuple[dict, dict]] = []
    to_create: list[dict] = []
    ignored: list[dict] = []

    # Stats dry-run par type LACUNA
    stats_update = defaultdict(int)
    stats_create = defaultdict(int)
    stats_ignore = defaultdict(int)

    for row in rows:
        main_id = _safe_str(row.get("main_id"))
        otype_raw = _safe_str(row.get("otype"))
        ot_lacuna = _lacuna_type_from_row(row)
        ra = _safe_float(row.get("ra"))
        dec = _safe_float(row.get("dec"))
        plx = _safe_float(row.get("plx_value"))
        plx_err = _safe_float(row.get("plx_err"))

        if not main_id or not otype_raw or not ot_lacuna:
            ignored.append({"main_id": main_id, "reason": "données manquantes / otype non mappé"})
            stats_ignore["?"] += 1
            continue

        # WD : distance obligatoire via parallaxe + plafond 1000 al
        if ot_lacuna == "WHITE_DWARF":
            if not _parallax_ok_for_distance(plx, plx_err):
                ignored.append({"main_id": main_id, "reason": "parallaxe invalide (WD)"})
                stats_ignore[ot_lacuna] += 1
                continue
            dist_al = _distance_from_plx(plx)
            if dist_al > LIMIT_AL:
                ignored.append({"main_id": main_id, "reason": f"trop loin WD: {dist_al:.0f} al"})
                stats_ignore[ot_lacuna] += 1
                continue
        else:
            # Rares : pas de filtre distance ; parallaxe optionnelle pour remplir coords
            dist_al = None
            if plx and plx > 0 and _parallax_ok_for_distance(plx, plx_err):
                dist_al = _distance_from_plx(plx)

        system_id = simbad_id_to_lacuna(main_id)
        if not system_id:
            ignored.append({"main_id": main_id, "reason": "slug vide"})
            stats_ignore[ot_lacuna] += 1
            continue

        existing_row = existing_by_id.get(system_id)
        if existing_row:
            fs = existing_row.get("field_sources") or {}
            if isinstance(fs, str):
                try:
                    fs = json.loads(fs) if fs.strip() else {}
                except json.JSONDecodeError:
                    fs = {}
            if fs.get("object_type") == "MANUAL":
                ignored.append({"main_id": main_id, "reason": "object_type MANUAL, non modifié"})
                stats_ignore[ot_lacuna] += 1
                continue
            current_ot = existing_row.get("object_type") or "STAR"
            if current_ot != "STAR" and current_ot != ot_lacuna:
                ignored.append({"main_id": main_id, "reason": f"object_type existant {current_ot} conservé"})
                stats_ignore[ot_lacuna] += 1
                continue
            if current_ot == ot_lacuna:
                continue
            to_update.append((row, existing_row))
            stats_update[ot_lacuna] += 1
        else:
            if ra is None or dec is None:
                ignored.append({"main_id": main_id, "reason": "RA/Dec manquants pour création"})
                stats_ignore[ot_lacuna] += 1
                continue
            # WD : distance déjà validée
            if ot_lacuna == "WHITE_DWARF":
                to_create.append(row)
                stats_create[ot_lacuna] += 1
            else:
                # Rares : créer même sans parallaxe (distance / coords optionnels)
                to_create.append(row)
                stats_create[ot_lacuna] += 1

    log.info("")
    log.info("--- Dry-run par type LACUNA (actions) ---")
    all_types = sorted(set(stats_update) | set(stats_create) | set(stats_ignore) | set(LABELS.keys()))
    for t in all_types:
        if t == "?":
            continue
        su, sc, si = stats_update[t], stats_create[t], stats_ignore[t]
        if su or sc or si:
            log.info(
                "  %s : object_type à corriger %d | à créer %d | ignorés %d",
                LABELS.get(t, t),
                su,
                sc,
                si,
            )
    if stats_ignore["?"]:
        log.info("  (non typés) : ignorés %d", stats_ignore["?"])

    log.info("")
    log.info("Synthèse globale : object_type à corriger %d | à créer %d | ignorés %d", len(to_update), len(to_create), len(ignored))

    if not apply:
        log.info("")
        log.info("Mode dry-run — aucune écriture. Lancer avec --apply pour exécuter.")
        return 0

    updated = 0
    created = 0
    for row, ex in to_update:
        main_id = _safe_str(row.get("main_id"))
        otype_raw = _safe_str(row.get("otype"))
        ot_lacuna = OTYPE_MAP.get(otype_raw, "STAR")
        system_id = simbad_id_to_lacuna(main_id)
        fs = dict(ex.get("field_sources") or {})
        fs["object_type"] = "SIMBAD"
        payload = {"object_type": ot_lacuna, "field_sources": fs}
        try:
            sb.table("stellar_systems").update(payload).eq("id", system_id).execute()
            updated += 1
            log.debug("  Mis à jour %s → %s", system_id, ot_lacuna)
        except Exception as e:
            log.error("  Erreur update %s : %s", system_id, e)

    for row in to_create:
        main_id = _safe_str(row.get("main_id"))
        otype_raw = _safe_str(row.get("otype"))
        ot_lacuna = OTYPE_MAP.get(otype_raw, "STAR")
        ra = _safe_float(row.get("ra"))
        dec = _safe_float(row.get("dec"))
        plx = _safe_float(row.get("plx_value"))
        plx_err = _safe_float(row.get("plx_err"))
        sp_type = _safe_str(row.get("sp_type"))

        dist_al = None
        coords = None
        const_abbr = get_constellation_abbr(ra, dec) if ra is not None and dec is not None else None

        if ot_lacuna == "WHITE_DWARF" and plx and plx > 0:
            dist_al = _distance_from_plx(plx)
            coords = radec_dist_to_xyz(ra, dec, dist_al)
        elif ot_lacuna != "WHITE_DWARF":
            if plx and plx > 0 and _parallax_ok_for_distance(plx, plx_err):
                dist_al = _distance_from_plx(plx)
                if dist_al is not None:
                    coords = radec_dist_to_xyz(ra, dec, dist_al)

        fs: dict[str, str] = {"object_type": "SIMBAD"}
        if dist_al is not None:
            fs["distance"] = "SIMBAD"

        system_id = simbad_id_to_lacuna(main_id)
        payload: dict[str, Any] = {
            "id": system_id,
            "name": main_id,
            "object_type": ot_lacuna,
            "spectral_type": sp_type,
            "distance": round(dist_al, 6) if dist_al is not None else None,
            "coordinates": coords,
            "constellation_abbr": const_abbr,
            "field_sources": fs,
            "anomaly_level": 1,
        }
        payload = {k: v for k, v in payload.items() if v is not None}
        try:
            sb.table("stellar_systems").insert(payload).execute()
            created += 1
            log.debug("  Créé %s (%s)", system_id, ot_lacuna)
        except Exception as e:
            log.error("  Erreur insert %s : %s", system_id, e)

    log.info("")
    log.info("Mises à jour : %d — Créations : %d", updated, created)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import objets exotiques SIMBAD (pulsars, naines blanches, NS, trous noirs)"
    )
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    parser.add_argument("--apply", action="store_true", help="Appliquer les écritures")
    parser.add_argument("--type", dest="type_filter", type=str, help="Filtrer par type (PULSAR, WHITE_DWARF, etc.)")
    parser.add_argument(
        "--wd-limit",
        type=int,
        default=WD_MAX_OBJECTS,
        help=f"Max naines blanches (défaut {WD_MAX_OBJECTS})",
    )
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        apply=args.apply,
        type_filter=args.type_filter,
        wd_limit=max(1, args.wd_limit),
    )


if __name__ == "__main__":
    sys.exit(main())
