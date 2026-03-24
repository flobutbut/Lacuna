#!/usr/bin/env python3
"""
Déduplication des 37 paires de doublons stellar_systems.

Patterns : MANUAL (MAJUSCULES) vs HYG/NASA (minuscules-tirets),
artefacts +/- dans slugification, point décimal.

Pour chaque paire (GARDER, SUPPRIMER) :
  1. Transférer champs non NULL de SUPPRIMER vers GARDER (si NULL dans GARDER)
  2. Rediriger les FK vers GARDER
  3. Supprimer SUPPRIMER

Idempotent : si SUPPRIMER n'existe plus, skip sans erreur.
"""
import argparse
import logging
import sys
from pathlib import Path

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
LOG_FILE = Path(__file__).resolve().parent / "dedup_stellar_systems.log"

PAIRS = [
    # (garder, supprimer) — Pattern A : MAJUSCULES vs minuscules-tirets
    ("gj-1002", "GJ1002"),
    ("gj-1061", "GJ1061"),
    ("gj-1151", "GJ1151"),
    ("gj-1289", "GJ1289"),
    ("gj-3021", "GJ3021"),
    ("gj-3323", "GJ3323"),
    ("gj-3512", "GJ3512"),
    ("gj-3988", "GJ3988"),
    ("wolf-1061", "WOLF1061"),
    ("wolf-1069", "WOLF1069"),
    ("groombridge-34", "GROOMBRIDGE34"),
    ("lalande-21185", "LALANDE21185"),
    ("lacaille-9352", "LACAILLE9352"),
    ("lhs-1140", "LHS1140"),
    ("lhs-3844", "LHS3844"),
    ("toi-700", "TOI700"),
    ("hd-219134", "HD219134"),
    ("hd-260655", "HD260655"),
    ("hd-40307", "HD40307"),
    ("hd-69830", "HD69830"),
    ("hd-189733", "HD189733"),
    # Pattern B : + vs - dans slugification
    ("bd+05-4868-a", "bd-05-4868-a"),
    ("bd+14-4559", "bd-14-4559"),
    ("bd+45-564", "bd-45-564"),
    ("bd+55-362", "bd-55-362"),
    ("bd+60-1417", "bd-60-1417"),
    ("bd+63-1405", "bd-63-1405"),
    ("2mass-j03590986+2009361", "2mass-j03590986-2009361"),
    ("2mass-j04372171+2651014", "2mass-j04372171-2651014"),
    ("2mass-j22362452+4751425", "2mass-j22362452-4751425"),
    ("2mass-j22501512+2325342", "2mass-j22501512-2325342"),
    ("wd-1856+534", "wd-1856-534"),
    ("lspm-j2116+0234", "lspm-j2116-0234"),
    # Pattern C : slugification point décimal
    ("gj-5082", "gj-508-2"),
    ("gj-1602", "gj-160-2"),
    ("gj-271", "gj-27-1"),
    ("1rxs-j160929-1-210524", "1rxs-j1609291-210524"),
]

CHAMPS_A_TRANSFERER = [
    "age",
    "planets",
    "habitable_zone",
    "anomaly_level",
    "constellation_abbr",
    "luminosity",
    "color_index",
    "apparent_magnitude",
    "has_magnetic_field",
    "chemical_region_id",
]

FK_REDIRECTIONS = [
    ("system_objects", "system_id"),
    ("traces", "system_id"),
    ("observations", "system_id"),
    ("signal_events", "system_id"),
    ("map_nodes", "system_id"),
    ("map_edges", "from_system"),
    ("map_edges", "to_system"),
    ("ships", "current_system_id"),
    ("ships", "travel_destination"),
    ("ship_travels", "origin_system_id"),
    ("ship_travels", "destination_system_id"),
    ("constellation_lines", "star_from"),
    ("constellation_lines", "star_to"),
]


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("dedup")
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


def transfer_fields(sb, id_garder: str, id_supprimer: str, apply: bool, log: logging.Logger) -> list[str]:
    """Transfère les champs non NULL de supprimer vers garder. Retourne la liste des champs transférés."""
    src = sb.table("stellar_systems").select("*").eq("id", id_supprimer).execute()
    dst = sb.table("stellar_systems").select("*").eq("id", id_garder).execute()

    if not src.data or len(src.data) == 0:
        return []
    if not dst.data or len(dst.data) == 0:
        log.warning("  ⚠ id_garder %s introuvable, skip", id_garder)
        return []

    src_row = src.data[0]
    dst_row = dst.data[0]
    merged_sources = dict(dst_row.get("field_sources") or {})
    src_sources = src_row.get("field_sources") or {}
    updates = {}

    for field in CHAMPS_A_TRANSFERER:
        if dst_row.get(field) is None and src_row.get(field) is not None:
            updates[field] = src_row[field]
            if field in src_sources:
                merged_sources[field] = src_sources[field]

    if updates:
        updates["field_sources"] = merged_sources
        if apply:
            sb.table("stellar_systems").update(updates).eq("id", id_garder).execute()
        return [k for k in updates.keys() if k != "field_sources"]
    return []


def redirect_fk(
    sb, id_garder: str, id_supprimer: str, apply: bool, log: logging.Logger
) -> dict[str, int]:
    """Redirige les FK de id_supprimer vers id_garder. Retourne {table: count}."""
    counts: dict[str, int] = {}
    for table, column in FK_REDIRECTIONS:
        try:
            sel = sb.table(table).select(column).eq(column, id_supprimer).execute()
            n = len(sel.data or [])
            if n > 0:
                counts[f"{table}.{column}"] = n
                if apply:
                    sb.table(table).update({column: id_garder}).eq(column, id_supprimer).execute()
        except Exception as e:
            log.debug("  FK %s.%s : %s (peut-être table/col absente)", table, column, e)
    return counts


def process_pair(
    sb, id_garder: str, id_supprimer: str, idx: int, total: int, apply: bool, log: logging.Logger
) -> tuple[bool, list[str], dict, bool]:
    """
    Traite une paire. Retourne (ok, champs_transferes, fk_counts, supprime).
    """
    # Vérifier si supprimer existe encore (idempotent)
    check = sb.table("stellar_systems").select("id").eq("id", id_supprimer).execute()
    if not check.data or len(check.data) == 0:
        log.info("Paire %d/%d : %s ← %s (déjà résolue, skip)", idx, total, id_garder, id_supprimer)
        return True, [], {}, False

    check_garder = sb.table("stellar_systems").select("id").eq("id", id_garder).execute()
    if not check_garder.data or len(check_garder.data) == 0:
        log.warning("Paire %d/%d : id_garder %s introuvable, skip", idx, total, id_garder)
        return False, [], {}, False

    log.info("Paire %d/%d : %s ← %s", idx, total, id_garder, id_supprimer)

    # Étape 1 — Transfer
    champs = transfer_fields(sb, id_garder, id_supprimer, apply, log)
    if champs:
        log.info("  Champs transférés : %s", ", ".join(champs))

    # Étape 2 — FK
    fk_counts = redirect_fk(sb, id_garder, id_supprimer, apply, log)
    if fk_counts:
        parts = [f"{k} ({v})" for k, v in fk_counts.items()]
        log.info("  FK redirigées : %s", ", ".join(parts))

    # Étape 3 — Supprimer
    if apply:
        sb.table("stellar_systems").delete().eq("id", id_supprimer).execute()
        log.info("  Supprimé : %s", id_supprimer)
    else:
        log.info("  [dry-run] Supprimerait : %s", id_supprimer)

    log.info("  ✓")
    return True, champs, fk_counts, apply


def main() -> int:
    parser = argparse.ArgumentParser(description="Déduplication stellar_systems (37 paires)")
    parser.add_argument("--apply", action="store_true", help="Appliquer les modifications (sinon dry-run)")
    args = parser.parse_args()
    apply = args.apply

    log = setup_logging()
    log.info("=== Dedup Stellar Systems — LACUNA ===")
    log.info("Paires à traiter : %d", len(PAIRS))
    if not apply:
        log.info("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
    log.info("")

    sb = get_supabase_client()
    total = len(PAIRS)
    ok_count = 0
    err_count = 0
    champs_total: list[str] = []
    fk_total: dict[str, int] = {}
    suppr_count = 0

    for i, (garder, suppr) in enumerate(PAIRS, 1):
        try:
            ok, champs, fk_counts, supprime = process_pair(sb, garder, suppr, i, total, apply, log)
            if ok:
                ok_count += 1
                champs_total.extend(champs)
                for k, v in fk_counts.items():
                    fk_total[k] = fk_total.get(k, 0) + v
                if supprime:
                    suppr_count += 1
            else:
                err_count += 1
        except Exception as e:
            err_count += 1
            log.exception("  ❌ Erreur paire %s ← %s : %s", garder, suppr, e)

    log.info("")
    log.info("Résumé :")
    log.info("  Paires traitées : %d/%d", ok_count, total)
    log.info("  Systèmes supprimés : %d", suppr_count)
    log.info("  Champs transférés : %d", len(champs_total))
    log.info("  FK redirigées : %d", sum(fk_total.values()))
    log.info("  Erreurs : %d", err_count)
    if not apply:
        log.info("")
        log.info("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")

    return 0 if err_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
