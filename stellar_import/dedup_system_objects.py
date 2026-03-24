#!/usr/bin/env python3
"""
Déduplication des doublons system_objects (même system_id + designation).

Catégorie A (vrais doublons) : écart période orbitale < 10% ou NULL des deux côtés.
  → Garder l'entrée la plus complète, supprimer les autres.

Catégorie B (conflits) : écart période > 10% — planètes différentes, ne pas toucher.
  → Logger et skip.

Idempotent : relancé deux fois, rien ne change.
"""
import argparse
import logging
import sys
from collections import defaultdict
from pathlib import Path

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
LOG_FILE = Path(__file__).resolve().parent / "dedup_objects.log"
CONFLICTS_LOG = Path(__file__).resolve().parent / "dedup_objects_conflicts.log"
PAGE_SIZE = 1000

SCORE_FIELDS = [
    "orbital_period_days",
    "orbital_semi_major_axis_au",
    "orbital_eccentricity",
    "mass_earth",
    "radius_earth",
    "surface_temperature_k",
    "atmosphere_composition",
    "orbital_inclination_deg",
    "in_habitable_zone",
]


def score_completeness(obj: dict) -> int:
    """Plus le score est élevé, plus l'entrée est complète."""
    score = 0
    for f in SCORE_FIELDS:
        if obj.get(f) is not None:
            score += 1
    if obj.get("data_source") == "NASA":
        score += 10
    return score


def is_conflict(periods: list) -> bool:
    """
    Retourne True si les périodes sont trop différentes pour être la même planète
    — catégorie B, ne pas toucher.
    """
    valid = [p for p in periods if p is not None]
    if len(valid) < 2:
        return False
    ratio = max(valid) / min(valid)
    return ratio > 1.10


def setup_logging(apply: bool) -> logging.Logger:
    logger = logging.getLogger("dedup_objects")
    logger.setLevel(logging.DEBUG)
    logger.handlers.clear()
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh.setFormatter(fmt)
    ch.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


def fetch_all_system_objects(sb) -> list[dict]:
    """Récupère tous les system_objects avec pagination."""
    all_rows = []
    offset = 0
    cols = (
        "id,system_id,designation,type,orbital_period_days,"
        "orbital_semi_major_axis_au,orbital_eccentricity,mass_earth,radius_earth,"
        "surface_temperature_k,atmosphere_composition,orbital_inclination_deg,"
        "in_habitable_zone,data_source,created_at"
    )
    while True:
        resp = (
            sb.table("system_objects")
            .select(cols)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break
        all_rows.extend(rows)
        offset += PAGE_SIZE
        if len(rows) < PAGE_SIZE:
            break
    return all_rows


def redirect_fk_and_delete(
    sb, id_keep: str, id_delete: str, apply: bool, log: logging.Logger
) -> tuple[int, int]:
    """Redirige signals et system_objects.parent_id, puis supprime. Retourne (signals_redir, children_reparented)."""
    signals_redir = 0
    children_reparented = 0

    # signals.source_object_id
    try:
        sig = sb.table("signals").select("id").eq("source_object_id", id_delete).execute()
        n = len(sig.data or [])
        if n > 0:
            signals_redir = n
            if apply:
                sb.table("signals").update({"source_object_id": id_keep}).eq(
                    "source_object_id", id_delete
                ).execute()
    except Exception as e:
        log.debug("  signals redirect: %s", e)

    # system_objects.parent_id (lunes)
    try:
        children = (
            sb.table("system_objects").select("id").eq("parent_id", id_delete).execute()
        )
        n = len(children.data or [])
        if n > 0:
            children_reparented = n
            if apply:
                sb.table("system_objects").update({"parent_id": id_keep}).eq(
                    "parent_id", id_delete
                ).execute()
    except Exception as e:
        log.debug("  parent_id reparent: %s", e)

    if apply:
        sb.table("system_objects").delete().eq("id", id_delete).execute()

    return signals_redir, children_reparented


def main() -> int:
    parser = argparse.ArgumentParser(description="Déduplication system_objects")
    parser.add_argument("--apply", action="store_true", help="Appliquer les suppressions")
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    parser.add_argument(
        "--system",
        type=str,
        help="Limiter au système donné (ex: hd-69830)",
    )
    parser.add_argument(
        "--systems",
        type=str,
        help="Limiter aux systèmes donnés, séparés par des virgules (ex: k2-25,kepler-37,toi-178)",
    )
    args = parser.parse_args()
    apply = args.apply
    system_filter = (args.system or "").strip().lower() or None
    systems_list = (args.systems or "").strip() or None

    log = setup_logging(apply)
    log.info("=== Dedup System Objects — LACUNA ===")

    sb = get_supabase_client()
    all_objs = fetch_all_system_objects(sb)
    log.info("Objets en base : %d", len(all_objs))

    allowed_systems = None
    if systems_list:
        allowed_systems = {s.strip().lower() for s in systems_list.split(",") if s.strip()}
    elif system_filter:
        allowed_systems = {system_filter}
    if allowed_systems:
        all_objs = [o for o in all_objs if (o.get("system_id") or "").lower() in allowed_systems]
        log.info("Filtrage sur system_id in %s : %d objets", sorted(allowed_systems), len(all_objs))

    # Grouper par (system_id, designation) — designation non vide
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for obj in all_objs:
        des = obj.get("designation")
        if des is None or str(des).strip() == "":
            continue
        key = (obj["system_id"], str(des).strip().lower())
        groups[key].append(obj)

    dup_groups = {k: v for k, v in groups.items() if len(v) > 1}
    log.info("Groupes en doublon : %d", len(dup_groups))

    cat_a = []
    cat_b = []
    conflicts_file = open(CONFLICTS_LOG, "w", encoding="utf-8")

    for (sys_id, des), objs in dup_groups.items():
        periods = [o.get("orbital_period_days") for o in objs]
        if is_conflict(periods):
            cat_b.append((sys_id, des, objs))
            periods_str = ", ".join(
                f"{p:.2f}j" if p is not None else "NULL"
                for p in sorted((p for p in periods if p is not None), reverse=True)
            )
            conflicts_file.write(
                f"{sys_id} {des} ({len(objs)} entrées, périodes {periods_str})\n"
            )
        else:
            cat_a.append((sys_id, des, objs))

    conflicts_file.close()
    log.info("  Catégorie A (vrais doublons) : %d", len(cat_a))
    log.info("  Catégorie B (conflits) : %d", len(cat_b))

    # Catégorie A : choisir à garder, planifier suppressions
    to_delete = []
    to_keep = []
    delete_to_keep: dict[str, str] = {}  # id_supprimer -> id_garder
    nasa_replaces_procedural = 0
    nasa_replaces_nasa = 0

    for sys_id, des, objs in cat_a:
        scored = [(score_completeness(o), o) for o in objs]
        scored.sort(key=lambda x: (-x[0], x[1].get("created_at") or ""))
        best = scored[0][1]
        others = [o for _, o in scored[1:]]
        to_keep.append(best)
        id_keep = best["id"]
        for o in others:
            to_delete.append(o)
            delete_to_keep[o["id"]] = id_keep
        best_ds = best.get("data_source")
        for o in others:
            o_ds = o.get("data_source")
            if best_ds == "NASA" and o_ds == "PROCEDURAL":
                nasa_replaces_procedural += 1
            elif best_ds == "NASA" and o_ds == "NASA":
                nasa_replaces_nasa += 1

    log.info("")
    log.info("Catégorie A — plan de suppression :")
    log.info("  Objets à supprimer : %d", len(to_delete))
    log.info("  Objets à conserver : %d", len(to_keep))
    log.info("  NASA remplace PROCEDURAL : %d", nasa_replaces_procedural)
    log.info("  NASA remplace NASA : %d", nasa_replaces_nasa)

    if cat_b:
        log.info("")
        log.info("Catégorie B — conflits loggés (ne pas toucher) :")
        for sys_id, des, objs in cat_b[:10]:
            periods = [o.get("orbital_period_days") for o in objs]
            valid = [p for p in periods if p is not None]
            if valid:
                pr = f"{min(valid):.2f}j–{max(valid):.2f}j"
            else:
                pr = "NULL"
            log.info("  %s %s (%d entrées, périodes %s)", sys_id, des, len(objs), pr)
        if len(cat_b) > 10:
            log.info("  ... (%d autres)", len(cat_b) - 10)
        log.info("  Détails : %s", CONFLICTS_LOG)

    if not apply:
        log.info("")
        log.info("Mode dry-run — aucune suppression. Lancer avec --apply pour exécuter.")
        return 0

    # Appliquer les suppressions
    log.info("")
    log.info("Application des suppressions...")
    deleted = 0
    for obj in to_delete:
        oid = obj["id"]
        sys_id = obj["system_id"]
        des = obj.get("designation", "")
        id_keep = delete_to_keep.get(oid)
        if not id_keep:
            log.warning("  Pas de keeper pour %s %s %s", sys_id, des, oid)
            continue
        sig_r, child_r = redirect_fk_and_delete(sb, id_keep, oid, True, log)
        deleted += 1
        log.debug("  Supprimé %s %s %s (signals:%d, children:%d)", sys_id, des, oid, sig_r, child_r)

    log.info("Suppressions effectuées : %d", deleted)
    return 0


if __name__ == "__main__":
    sys.exit(main())
