#!/usr/bin/env python3
"""
Import données stellaires HYG + NASA Exoplanet Archive → Supabase.
Orchestrateur principal.
"""
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path

import pandas as pd

from parse_hyg import iter_hyg_rows, parse_hyg_file
from parse_nasa import fetch_nasa_planets, normalize_nasa_row
from report import write_report
from supabase_client import get_supabase_client
from upsert_objects import (
    fetch_existing_planets,
    update_habitable_zone_from_planets,
    upsert_planets_batch,
)
from upsert_systems import (
    LACUNA_ID_MAP,
    fetch_existing_systems,
    resolve_hostname_to_system_id,
    upsert_systems_batch,
    write_unresolved_hosts,
)

ROOT = Path(__file__).resolve().parent.parent
PROGRESS_FILE = ROOT / "import_progress.json"
REPORT_FILE = ROOT / "stellar_import" / "import_report.md"
ERRORS_FILE = ROOT / "import_errors.log"
BATCH_SIZE = 500
BATCH_PAUSE_MS = 200

# Colonnes sources sans mapping direct (pour le rapport)
UNMAPPED_COLUMNS = ["st_teff", "st_rad", "st_mass", "vx", "vy", "vz"]

# Noms communs → ids HYG (build_system_id) pour --fix-ids
FIX_ID_ALIASES = {
    "tau-ceti": ["tau-ceti", "gl-gl-71"],
    "tau-cet": ["tau-ceti", "gl-gl-71"],
    "barnard": ["barnards-star", "gl-gl-699"],
    "epsilon-eridani": ["ran", "gl-gl-144", "hd-22049"],
    "gliese667": ["gl-gl-667c", "gl-667c"],
    "hd44594": ["hd-44594"],
}


def setup_logging() -> None:
    """Configure le logging vers stderr et import_errors.log."""
    errors_handler = logging.FileHandler(ERRORS_FILE, encoding="utf-8")
    errors_handler.setLevel(logging.ERROR)
    stderr = logging.StreamHandler(sys.stderr)
    stderr.setLevel(logging.INFO)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[stderr, errors_handler],
    )


def load_progress() -> dict:
    """Charge la progression depuis import_progress.json."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {
        "hyg_last_index": 0,
        "hyg_total": 0,
        "nasa_done": False,
        "started_at": datetime.utcnow().isoformat() + "Z",
        "last_batch_at": None,
    }


def save_progress(progress: dict) -> None:
    """Sauvegarde la progression."""
    progress["last_batch_at"] = datetime.utcnow().isoformat() + "Z"
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def _normalize_id(s: str) -> str:
    return (s or "").lower().replace("_", "-").strip()


def run_hyg_fix_ids(client, ids: list[str], stats: dict, corrections: list, errors: list) -> int:
    """Réimporte uniquement les systèmes dont l'id HYG est dans ids (force mise à jour)."""
    ids_set = set()
    for x in ids:
        n = _normalize_id(str(x))
        ids_set.add(n)
        # Alias : tau-ceti → gl-71 (Tau Ceti dans HYG n'a pas de proper)
        for alias, expanded in FIX_ID_ALIASES.items():
            if n == alias:
                ids_set.update(expanded)
                break
    # Inclure les ids DB résolus (proxima-centauri → PROXIMA) pour force_update
    for i in list(ids_set):
        resolved = LACUNA_ID_MAP.get(i, i)
        ids_set.add(_normalize_id(resolved))
        if resolved != i:
            ids_set.add(resolved)
    rows = [r for r in iter_hyg_rows(ids_filter=ids_set)]
    if not rows:
        logging.warning("Aucune ligne HYG trouvée pour ids=%s", ids)
        return 0
    existing = fetch_existing_systems(client)
    try:
        upsert_systems_batch(
            client, rows, existing, stats, corrections,
            force_update_ids=ids_set,
        )
        logging.info("Réimport force pour %d système(s) : %s", len(rows), [r.get("id") for r in rows])
    except Exception as e:
        logging.exception("Erreur réimport")
        errors.append(f"fix_ids: {e}")
    return len(rows)


def run_hyg_import(client, progress: dict, stats: dict, corrections: list, errors: list) -> int:
    """Import HYG par lots. Retourne le nombre total de lignes HYG (après filtre)."""
    rows = list(iter_hyg_rows())
    total_rows = len(rows)
    progress["hyg_total"] = total_rows
    start_idx = progress.get("hyg_last_index", 0)

    existing = fetch_existing_systems(client)
    batch_num = 0
    remaining = max(0, total_rows - start_idx)
    total_batches = (remaining + BATCH_SIZE - 1) // BATCH_SIZE if remaining else 0

    for i in range(start_idx, total_rows, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        if not batch:
            break

        batch_num += 1
        try:
            upsert_systems_batch(client, batch, existing, stats, corrections)
            progress["hyg_last_index"] = i + len(batch)
            save_progress(progress)

            pct = 100 * progress["hyg_last_index"] / total_rows if total_rows else 0
            logging.info(
                "[BATCH %d/%d] — %d lignes traitées — progression : %.1f%%",
                batch_num,
                total_batches or 1,
                len(batch),
                pct,
            )
        except Exception as e:
            logging.exception("Erreur lot HYG %d", batch_num)
            errors.append(f"HYG batch {batch_num}: {e}")
            stats["errors"] += len(batch)

        time.sleep(BATCH_PAUSE_MS / 1000.0)
        existing = fetch_existing_systems(client)

    return total_rows


def run_nasa_import(client, stats_systems: dict, stats_objects: dict, corrections: list, errors: list) -> str:
    """Import NASA Exoplanet Archive. Retourne le statut."""
    try:
        df = fetch_nasa_planets()
    except Exception as e:
        logging.exception("Erreur fetch NASA")
        errors.append(f"NASA fetch: {e}")
        return "non démarré"

    existing_systems = fetch_existing_systems(client)
    existing_planets = fetch_existing_planets(client)

    # 1. Mise à jour stellar_systems depuis données NASA (age, spectral_type, planets)
    stellar_updates: dict[str, dict] = {}
    for _, row in df.iterrows():
        p = normalize_nasa_row(row)
        if not p or "_stellar_update" not in p:
            continue
        hostname = p.get("hostname")
        system_id = resolve_hostname_to_system_id(hostname, existing_systems)
        if not system_id:
            continue

        su = p["_stellar_update"]
        if system_id not in stellar_updates:
            stellar_updates[system_id] = {}
        for k, v in su.items():
            if v is not None and (k not in stellar_updates[system_id] or stellar_updates[system_id][k] is None):
                stellar_updates[system_id][k] = v

    for sid, data in stellar_updates.items():
        if not data:
            continue
        existing = existing_systems.get(sid)
        if not existing:
            continue
        # Compléter uniquement les champs NULL
        to_update = {}
        for k, v in data.items():
            if v is not None and existing.get(k) is None:
                to_update[k] = v
        if to_update:
            try:
                client.table("stellar_systems").update(to_update).eq("id", sid).execute()
                stats_systems["completed"] += 1
            except Exception as e:
                errors.append(f"stellar update {sid}: {e}")

    # 2. Création systèmes hôtes NASA non présents (dist < 500 al)
    for _, row in df.iterrows():
        hostname = str(row.get("hostname", "")).strip()
        if not hostname:
            continue
        system_id = resolve_hostname_to_system_id(hostname, existing_systems)
        if system_id:
            continue
        sy_dist = row.get("sy_dist")
        try:
            dist_ly = float(sy_dist) * 3.26156 if pd.notna(sy_dist) else None
        except (TypeError, ValueError):
            dist_ly = None
        if dist_ly is None or dist_ly > 500:
            continue
        slug = hostname.lower().replace(" ", "-").replace("'", "").replace(".", "")
        if not slug:
            continue
        try:
            age_val = None
            if pd.notna(row.get("st_age")):
                try:
                    age_val = float(row["st_age"])
                except (TypeError, ValueError):
                    pass
            pnum_val = None
            if pd.notna(row.get("sy_pnum")):
                try:
                    pnum_val = int(float(row["sy_pnum"]))
                except (TypeError, ValueError):
                    pass
            client.table("stellar_systems").insert({
                "id": slug,
                "name": hostname,
                "spectral_type": str(row.get("st_spectype", "")).strip() or None,
                "distance": round(dist_ly, 4),
                "age": age_val,
                "planets": pnum_val or 0,
                "habitable_zone": False,
            }).execute()
            existing_systems[slug] = {"id": slug}
            stats_systems["inserted"] += 1
        except Exception as e:
            if "duplicate" not in str(e).lower() and "unique" not in str(e).lower():
                errors.append(f"insert host {hostname}: {e}")

    # 3. Upsert planètes (collecte hostnames non résolus pour audit)
    planets = [normalize_nasa_row(row) for _, row in df.iterrows()]
    planets = [p for p in planets if p and "hostname" in p]
    existing_systems = fetch_existing_systems(client)
    unresolved_hosts = set()

    for i in range(0, len(planets), BATCH_SIZE):
        batch = planets[i : i + BATCH_SIZE]
        try:
            upsert_planets_batch(
                client, batch, existing_systems, existing_planets,
                stats_objects, corrections, unresolved_hosts,
            )
            existing_planets = fetch_existing_planets(client)
        except Exception as e:
            logging.exception("Erreur lot NASA planètes")
            errors.append(f"NASA planets batch: {e}")
        time.sleep(BATCH_PAUSE_MS / 1000.0)

    if unresolved_hosts:
        write_unresolved_hosts(unresolved_hosts)

    # 4. Mise à jour habitable_zone
    try:
        update_habitable_zone_from_planets(client)
    except Exception as e:
        errors.append(f"habitable_zone update: {e}")

    return "complet"


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(description="Import HYG + NASA Exoplanet Archive → Supabase")
    parser.add_argument("--nasa-only", action="store_true", help="Exécuter uniquement l'import NASA (pas HYG)")
    parser.add_argument("--reset", action="store_true", help="Réinitialiser la progression avant import (hyg + nasa)")
    parser.add_argument("--fix-ids", nargs="+", metavar="ID", help="Réimporter et forcer mise à jour pour ces ids (ex: sirius proxima-centauri)")
    args = parser.parse_args()

    setup_logging()
    errors: list[str] = []

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        logging.error("%s", e)
        return 1

    progress = load_progress()
    if args.reset:
        progress["hyg_last_index"] = 0
        progress["nasa_done"] = False
        save_progress(progress)
        logging.info("Progression réinitialisée.")
    stats_systems = {"inserted": 0, "completed": 0, "corrected": 0, "ignored": 0, "errors": 0}
    stats_objects = {"inserted": 0, "completed": 0, "corrected": 0, "ignored": 0, "errors": 0}
    corrections: list[str] = []
    lacuna_modified: dict[str, list[str]] = {}

    # HYG
    total_hyg = 0
    hyg_batches = (0, 0)
    if getattr(args, "fix_ids", None):
        logging.info("=== Réimport HYG (fix) pour %s ===", args.fix_ids)
        run_hyg_fix_ids(client, args.fix_ids, stats_systems, corrections, errors)
    elif not args.nasa_only:
        logging.info("=== Import HYG ===")
        total_hyg = run_hyg_import(client, progress, stats_systems, corrections, errors)
        hyg_batches = (progress["hyg_last_index"] // BATCH_SIZE + 1, (total_hyg + BATCH_SIZE - 1) // BATCH_SIZE)

    # NASA
    nasa_status = "non démarré"
    if getattr(args, "fix_ids", None):
        pass  # skip NASA en mode fix
    elif args.nasa_only or not progress.get("nasa_done"):
        logging.info("=== Import NASA ===")
        nasa_status = run_nasa_import(client, stats_systems, stats_objects, corrections, errors)
        progress["nasa_done"] = nasa_status == "complet"
        save_progress(progress)
    elif not getattr(args, "fix_ids", None):
        nasa_status = "complet" if progress.get("nasa_done") else "non démarré"

    # Rapport
    for c in corrections:
        if "[LACUNA]" in c:
            parts = c.split("|")
            if len(parts) >= 1:
                sys_part = parts[0].replace("[LACUNA]", "").strip()
                sys_id = sys_part.split()[0] if sys_part else ""
                if sys_id and sys_id not in lacuna_modified:
                    lacuna_modified[sys_id] = []
                if len(parts) >= 2:
                    field = parts[1].split(":")[0].strip()
                    if field and sys_id and field not in lacuna_modified.get(sys_id, []):
                        lacuna_modified.setdefault(sys_id, []).append(field)

    write_report(
        REPORT_FILE,
        stats_systems,
        stats_objects,
        lacuna_modified,
        corrections,
        UNMAPPED_COLUMNS,
        (progress["hyg_last_index"] // BATCH_SIZE, hyg_batches[1]),
        nasa_status,
        errors,
    )

    logging.info("=== Terminé. Rapport : %s ===", REPORT_FILE)
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
