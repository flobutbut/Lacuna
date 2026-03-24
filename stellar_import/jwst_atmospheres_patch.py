#!/usr/bin/env python3
"""
Patch JWST — importe les compositions atmosphériques (spectroscopie JWST/Hubble/Spitzer).

Données curées depuis la littérature — la colonne pl_atmoscomp a été retirée de
l'API NASA Exoplanet Archive. Source : jwst_atmospheres_data.json

Tracées comme "JWST" dans field_sources (instrumentation distincte).

Règles :
- Ne jamais écraser une source JWST existante (idempotence)
- Respecter la hiérarchie des sources (field_sources)
- Logger les planètes non matchées dans jwst_unmatched.log
"""
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Optional

import requests

from nasa_age_patch import _resolve_hostname_fast
from supabase_client import get_supabase_client
from upsert_systems import fetch_existing_systems

ROOT = Path(__file__).resolve().parent.parent
SCRIPT_DIR = Path(__file__).resolve().parent
NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
UNMATCHED_LOG = SCRIPT_DIR / "jwst_unmatched.log"

SOURCE_PRIORITY = {
    "JWST": 100,
    "GAIA": 100,
    "NASA": 100,
    "SIMBAD": 80,
    "HYG": 80,
    "MANUAL": 60,
    "EXTRAPOLATED": 30,
    "PROCEDURAL": 10,
}

DATA_FILE = SCRIPT_DIR / "jwst_atmospheres_data.json"


def _load_nasa_orbital_periods() -> dict[tuple[str, str], float]:
    """Récupère pl_orbper depuis NASA TAP pour améliorer le matching."""
    hostnames = set()
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    for row in data:
        hn = str(row.get("hostname", "") or "").strip()
        if hn:
            hostnames.add(hn)
    if not hostnames:
        return {}
    # Requête NASA : hostname IN (...)
    escaped = ", ".join(f"'{h.replace(chr(39), chr(39)+chr(39))}'" for h in sorted(hostnames))
    query = f"""
        SELECT hostname, pl_letter, pl_orbper
        FROM ps
        WHERE default_flag = 1 AND hostname IN ({escaped})
    """
    try:
        resp = requests.get(NASA_TAP, params={"query": query.strip(), "format": "json"}, timeout=60)
        resp.raise_for_status()
        rows = resp.json() or []
        out = {}
        for r in rows:
            hn = str(r.get("hostname", "") or "").strip()
            pl = str(r.get("pl_letter", "") or "").strip()
            orb = r.get("pl_orbper")
            if hn and pl and orb is not None:
                try:
                    out[(hn, pl)] = float(orb)
                except (TypeError, ValueError):
                    pass
        return out
    except Exception:
        return {}


def parse_atmoscomp(raw: Any) -> dict:
    """
    Convertit pl_atmoscomp NASA en JSON structuré pour LACUNA.

    Exemples :
      "H2O, CO2, CO, SO2, K"  →  {
          "molecules": ["H2O", "CO2", "CO", "SO2", "K"],
          "raw": "H2O, CO2, CO, SO2, K",
          "source": "JWST",
          "confidence": 1.0,
          "notes": null
      }
      "No thick atmosphere"  →  {
          "molecules": [],
          "raw": "No thick atmosphere",
          "source": "JWST",
          "confidence": 1.0,
          "notes": "No thick atmosphere detected"
      }
    """
    if raw is None or (isinstance(raw, float) and str(raw).lower() == "nan"):
        raw = ""
    raw = str(raw).strip()
    molecules = []
    notes = None

    lower = raw.lower()
    if any(k in lower for k in ["no ", "none", "absent", "thin", "bare"]):
        notes = raw
    else:
        molecules = [m.strip() for m in raw.split(",") if m.strip()]

    return {
        "molecules": molecules,
        "raw": raw,
        "source": "JWST",
        "confidence": 1.0,
        "notes": notes,
    }


def should_write_atmosphere(field_sources: dict) -> bool:
    """True si on peut écrire atmosphere_composition (source JWST)."""
    existing = (
        field_sources.get("atmosphere_composition")
        if isinstance(field_sources, dict)
        else None
    )
    if existing is None:
        return True
    if existing == "JWST":
        return False  # Idempotence
    return SOURCE_PRIORITY.get("JWST", 0) > SOURCE_PRIORITY.get(existing, 0)


def _period_match(db_period: Optional[float], nasa_period: Optional[float], tolerance: float = 0.02) -> bool:
    """Vérifie si les périodes correspondent (tolérance 2%)."""
    if db_period is None and nasa_period is None:
        return True
    if db_period is None or nasa_period is None or nasa_period <= 0:
        return False
    try:
        ratio = float(db_period) / float(nasa_period)
        return abs(ratio - 1.0) <= tolerance
    except (TypeError, ValueError, ZeroDivisionError):
        return False


def find_system_object(
    hostname: str,
    pl_letter: str,
    pl_orbper: Optional[float],
    existing_systems: dict,
    sb,
) -> Optional[dict]:
    """
    Cherche le system_object correspondant dans la base.
    Stratégie : hostname → system_id via _resolve_hostname_fast,
    puis (system_id, designation, période orbitale ± 2%).
    """
    system_id = _resolve_hostname_fast(hostname, existing_systems)
    if not system_id:
        return None

    # Vérifier que le système existe dans stellar_systems
    sys_check = sb.table("stellar_systems").select("id").eq("id", system_id).execute()
    if not sys_check.data:
        return None  # système absent de la base

    des = (pl_letter or "").strip()
    if not des:
        return None
    des_lower = des.lower()

    result = (
        sb.table("system_objects")
        .select("id,system_id,designation,orbital_period_days,field_sources,has_atmosphere,atmosphere_detected")
        .eq("system_id", system_id)
        .eq("type", "PLANET")
        .execute()
    )
    rows = result.data or []
    # Filtrer par designation (casse insensible)
    rows = [r for r in rows if (r.get("designation") or "").strip().lower() == des_lower]
    if not rows:
        return None

    if pl_orbper is not None:
        try:
            pl_orbper_f = float(pl_orbper)
        except (TypeError, ValueError):
            pl_orbper_f = None
    else:
        pl_orbper_f = None

    if pl_orbper_f:
        for obj in rows:
            p = obj.get("orbital_period_days")
            if _period_match(p, pl_orbper_f):
                return obj
        return None

    return rows[0]


def is_biosignature_candidate(molecules: list[str]) -> bool:
    """O2+CH4 ou DMS = biosignature candidate."""
    mol_upper = [m.upper() for m in molecules]
    if "DMS" in mol_upper:
        return True
    if "O2" in mol_upper and "CH4" in mol_upper:
        return True
    return False


def load_atmosphere_data(planet_filter: Optional[str] = None) -> tuple[list[dict], dict[tuple[str, str], float]]:
    """Charge les données depuis jwst_atmospheres_data.json + pl_orbper NASA pour matching."""
    with open(DATA_FILE, encoding="utf-8") as f:
        rows = json.load(f)
    if planet_filter:
        pl_filter = planet_filter.strip().lower()
        rows = [
            r for r in rows
            if pl_filter in (str(r.get("hostname", "") or "").strip() + " " + str(r.get("pl_letter", "") or "").strip()).lower()
            or pl_filter in (str(r.get("hostname", "") or "").lower())
        ]
    orb_periods = _load_nasa_orbital_periods()
    return rows, orb_periods


def run(
    *,
    dry_run: bool = True,
    apply: bool = False,
    planet_filter: Optional[str] = None,
) -> int:
    log = logging.getLogger("jwst_atmospheres")
    log.setLevel(logging.INFO)
    log.propagate = False
    log.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    log.addHandler(handler)

    log.info("=== JWST Atmospheres Patch — LACUNA ===")

    try:
        sb = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    # 1. Charger données curées + périodes orbitales NASA pour matching
    try:
        nasa_rows, orb_periods = load_atmosphere_data(planet_filter)
    except Exception as e:
        log.exception("Erreur chargement données: %s", e)
        return 1

    log.info("Planètes avec composition atmosphérique (données curées) : %d", len(nasa_rows))
    if not nasa_rows:
        return 0

    # 2. Charger stellar_systems pour résolution hostname → system_id
    existing_systems = fetch_existing_systems(sb)

    # 3. Pour chaque planète : match + composition
    matched = []
    unmatched = []
    to_write = []
    stats = {
        "with_molecules": 0,
        "no_atmosphere": 0,
        "biosignature_candidates": 0,
    }

    for row in nasa_rows:
        hostname = str(row.get("hostname", "") or "").strip()
        pl_letter = str(row.get("pl_letter", "") or "").strip()
        pl_name = f"{hostname} {pl_letter}".strip()
        pl_orbper = row.get("pl_orbper") or orb_periods.get((hostname, pl_letter))
        pl_atmoscomp = row.get("pl_atmoscomp")

        obj = find_system_object(hostname, pl_letter, pl_orbper, existing_systems, sb)
        if not obj:
            unmatched.append({"pl_name": pl_name, "hostname": hostname, "reason": "système ou planète absents"})
            continue

        matched.append(pl_name)
        comp = parse_atmoscomp(pl_atmoscomp)
        if comp["molecules"]:
            stats["with_molecules"] += 1
            if is_biosignature_candidate(comp["molecules"]):
                stats["biosignature_candidates"] += 1
        else:
            stats["no_atmosphere"] += 1

        if not should_write_atmosphere(obj.get("field_sources") or {}):
            continue

        has_atm = bool(comp["molecules"])
        to_write.append({
            "obj": obj,
            "atmosphere_composition": comp,
            "has_atmosphere": has_atm,
            "atmosphere_detected": True,
        })

    # 4. Output
    log.info("  Matchées en base : %d", len(matched))
    log.info("  Non matchées (système ou planète absents) : %d", len(unmatched))
    log.info("")
    log.info("Compositions à écrire : %d", len(to_write))
    log.info("  Avec molécules détectées : %d", stats["with_molecules"])
    log.info("  Absence d'atmosphère confirmée : %d", stats["no_atmosphere"])
    log.info("  Biosignatures candidates (O2+CH4 ou DMS) : %d", stats["biosignature_candidates"])
    log.info("")

    if unmatched:
        log.info("Non matchées :")
        for u in unmatched[:20]:
            log.info("  %s — %s", u["pl_name"], u["reason"])
        if len(unmatched) > 20:
            log.info("  ... (%d autres)", len(unmatched) - 20)
        # Écrire jwst_unmatched.log
        UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
            for u in unmatched:
                f.write(f"{u['pl_name']}\t{u['hostname']}\t{u['reason']}\n")
        log.info("  Détails : %s", UNMATCHED_LOG)
        log.info("")

    if not apply:
        log.info("Mode dry-run — aucune écriture. Lancer avec --apply pour exécuter.")
        return 0

    # 5. Appliquer les mises à jour
    written = 0
    for item in to_write:
        obj = item["obj"]
        fs = dict(obj.get("field_sources") or {})
        fs["atmosphere_composition"] = "JWST"
        fs["has_atmosphere"] = "JWST"
        fs["atmosphere_detected"] = "JWST"
        payload = {
            "atmosphere_composition": item["atmosphere_composition"],
            "has_atmosphere": item["has_atmosphere"],
            "atmosphere_detected": item["atmosphere_detected"],
            "field_sources": fs,
        }
        try:
            sb.table("system_objects").update(payload).eq("id", obj["id"]).execute()
            written += 1
            log.debug("  Mis à jour %s %s", obj.get("system_id"), obj.get("designation"))
        except Exception as e:
            log.error("  Erreur mise à jour %s : %s", obj.get("id"), e)

    log.info("Mises à jour effectuées : %d", written)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import compositions atmosphériques JWST depuis NASA Exoplanet Archive"
    )
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    parser.add_argument("--apply", action="store_true", help="Appliquer les écritures")
    parser.add_argument("--planet", type=str, help="Tester sur une planète (ex: 'WASP-39 b')")
    args = parser.parse_args()
    apply = args.apply
    return run(
        dry_run=not apply,
        apply=apply,
        planet_filter=args.planet,
    )


if __name__ == "__main__":
    sys.exit(main())
