#!/usr/bin/env python3
"""
Patch HYG — complète constellation_abbr, luminosity, color_index manquants dans stellar_systems.

Règle absolue : ne jamais écraser une valeur existante.
Met à jour field_sources pour chaque champ complété.
Idempotent : relancé deux fois, ne modifie rien la deuxième fois.
"""
import argparse
import json
import logging
import re
import sys
from pathlib import Path
from typing import Optional

import pandas as pd

from parse_hyg import PARSEC_TO_LY, slugify, _valid_str, build_display_name
from supabase_client import get_supabase_client
from upsert_systems import LACUNA_ID_MAP

ROOT = Path(__file__).resolve().parent.parent
HYG_PATHS = [
    ROOT / "Ressources" / "hyg_v42.csv",
    ROOT / "resources" / "hyg_v42.csv",
]
PAGE_SIZE = 1000
UNMATCHED_LOG = ROOT / "hyg_patch_unmatched.log"

# Champs à compléter (Supabase ← HYG)
PATCH_FIELDS = [
    ("constellation_abbr", "con"),
    ("luminosity", "lum"),
    ("color_index", "ci"),
]

# Ids LACUNA → clés HYG connues (nom affiché différent de HYG)
LACUNA_TO_HYG_KEYS = {
    "barnard": ["barnards-star", "gl-gl-699"],
    "epsilon_eridani": ["ran", "gl-gl-144", "hd-22049", "epsilon eridani"],
    "gliese667": ["gl-gl-667c", "gl-667c", "gliese 667 c"],
    "hd44594": ["hd-44594", "hd 44594"],
}


def _load_hyg_full(path: Optional[Path] = None) -> pd.DataFrame:
    """Charge le CSV HYG sans filtre de distance (pour matching)."""
    for p in HYG_PATHS if path is None else [path]:
        if p.exists():
            df = pd.read_csv(p, dtype=str, na_values=["", "nan"])
            break
    else:
        raise FileNotFoundError(f"Aucun fichier HYG trouvé: {HYG_PATHS}")

    for col in ["dist", "x", "y", "z", "mag", "lum", "ci"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _build_hyg_lookup(df: pd.DataFrame) -> dict[str, dict]:
    """
    Index HYG pour matching.
    Clés : slugify(proper), hd-XXXXX, gl-XXX, gl-gl-XXX, hip-XXXXX, name.
    """
    lookup: dict[str, dict] = {}

    def add(key: str, row: dict) -> None:
        if key and key not in lookup:
            lookup[key] = row

    for _, row in df.iterrows():
        proper = row.get("proper")
        gl = row.get("gl")
        hd = row.get("hd")
        hip = row.get("hip")
        dist = row.get("dist")

        if _valid_str(proper) and str(proper).strip().lower() == "sol":
            continue
        if pd.isna(dist) or float(dist) <= 0:
            continue

        con = str(row.get("con", "")).strip() if pd.notna(row.get("con")) else None
        constellation_abbr = con if con and str(con).upper() != "NAN" else None

        hyg_row = {
            "luminosity": float(row["lum"]) if pd.notna(row.get("lum")) else None,
            "color_index": float(row["ci"]) if pd.notna(row.get("ci")) else None,
            "constellation_abbr": constellation_abbr,
        }

        if _valid_str(proper):
            add(slugify(proper), hyg_row)
        if _valid_str(hd):
            try:
                add("hd-" + str(int(float(hd))), hyg_row)
            except (ValueError, TypeError):
                pass
        if _valid_str(gl):
            gl_slug = slugify(gl)
            if gl_slug:
                add("gl-" + gl_slug, hyg_row)
                add(gl_slug, hyg_row)
                # Équivalence GJ/Gl : "Gl 143" ↔ "GJ 143"
                if gl_slug.startswith("gj-"):
                    add("gl-" + gl_slug[3:], hyg_row)  # gj-143 → gl-143
                elif gl_slug.startswith("gl-"):
                    add("gj-" + gl_slug[3:], hyg_row)  # gl-143 → gj-143
        if _valid_str(hip):
            try:
                add("hip-" + str(int(float(hip))), hyg_row)
            except (ValueError, TypeError):
                pass
        name = build_display_name(row)
        if name:
            add(name.strip().lower(), hyg_row)
            add(slugify(name), hyg_row)

    return lookup


def _build_lookup_dist_spect(df: pd.DataFrame) -> dict:
    """Index (dist_pc arrondi à 2 décimales, spect) -> [hyg_row]. Pour fallback unique."""
    from collections import defaultdict
    index = defaultdict(list)
    for _, row in df.iterrows():
        dist = row.get("dist")
        spect = row.get("spect")
        if pd.isna(dist) or float(dist) <= 0:
            continue
        try:
            dist_pc = float(dist)
            spect_str = str(spect).strip() if pd.notna(spect) else ""
        except (TypeError, ValueError):
            continue
        key = (round(dist_pc, 2), spect_str)
        con = str(row.get("con", "")).strip() if pd.notna(row.get("con")) else None
        constellation_abbr = con if con and str(con).upper() != "NAN" else None
        hyg_row = {
            "luminosity": float(row["lum"]) if pd.notna(row.get("lum")) else None,
            "color_index": float(row["ci"]) if pd.notna(row.get("ci")) else None,
            "constellation_abbr": constellation_abbr,
        }
        index[key].append(hyg_row)
    return dict(index)


def _normalize_id(s: str) -> str:
    return (s or "").lower().replace("_", "-").strip()


def _get_id_variants_for_lookup(norm_id: str) -> list[str]:
    """Équivalence GJ/Gl : gj-143 ↔ gl-143."""
    variants = [norm_id]
    if norm_id.startswith("gj-") and len(norm_id) > 3:
        variants.append("gl-" + norm_id[3:])
    elif norm_id.startswith("gl-") and len(norm_id) > 3:
        variants.append("gj-" + norm_id[3:])
    return variants


def _find_hyg_match(
    stellar_id: str,
    stellar_name: str,
    lookup: dict,
    lookup_dist_spect: Optional[dict] = None,
    sys_row: Optional[dict] = None,
) -> Optional[tuple[dict, str]]:
    """
    Trouve la ligne HYG correspondante.
    Retourne (hyg_row, match_type) avec match_type in ("name", "dist_spect") ou None.
    """
    if not lookup:
        return None

    norm_id = _normalize_id(stellar_id)

    lacuna_keys = LACUNA_TO_HYG_KEYS.get(norm_id.replace("-", "_"))
    if lacuna_keys:
        for key in lacuna_keys:
            if key in lookup:
                return (lookup[key], "name")

    for vid in _get_id_variants_for_lookup(norm_id):
        if vid in lookup:
            return (lookup[vid], "name")

    m = re.match(r"hd-?(\d+)", norm_id, re.I)
    if m:
        key = "hd-" + m.group(1)
        if key in lookup:
            return (lookup[key], "name")

    if norm_id.startswith("gl-") or "gl-" in norm_id:
        for vid in _get_id_variants_for_lookup(norm_id):
            if vid in lookup:
                return (lookup[vid], "name")
        if norm_id.startswith("gl-gl-"):
            alt = "gl-" + norm_id[6:]
            if alt in lookup:
                return (lookup[alt], "name")
        else:
            alt = "gl-gl-" + norm_id[3:] if len(norm_id) > 3 else ""
            if alt in lookup:
                return (lookup[alt], "name")

    m = re.match(r"hip-?(\d+)", norm_id, re.I)
    if m:
        key = "hip-" + m.group(1)
        if key in lookup:
            return (lookup[key], "name")

    if stellar_name:
        name_clean = " ".join(stellar_name.strip().lower().split())
        for key in [name_clean, slugify(stellar_name), stellar_name.strip().lower()]:
            if key and key in lookup:
                return (lookup[key], "name")

    # Fallback : (distance arrondie 2 décimales, spect) — uniquement si unique
    if lookup_dist_spect and sys_row:
        return _find_by_dist_spect(lookup_dist_spect, sys_row)
    return None


def _find_by_dist_spect(
    lookup_dist_spect: dict, sys_row: dict
) -> Optional[tuple[dict, str]]:
    """Match par (dist_pc arrondi, spect) si résultat unique."""
    dist_ly = sys_row.get("distance")
    spect = sys_row.get("spectral_type")
    if dist_ly is None or spect is None:
        return None
    spect_str = str(spect).strip()
    if not spect_str:
        return None
    try:
        dist_pc = float(dist_ly) / PARSEC_TO_LY
        key = (round(dist_pc, 2), spect_str)
    except (TypeError, ValueError):
        return None
    if key not in lookup_dist_spect:
        return None
    candidates = lookup_dist_spect[key]
    if len(candidates) != 1:
        return None
    return (candidates[0], "dist_spect")


def _can_write_field(current_value) -> bool:
    """Règle absolue : n'écrire que si la valeur est NULL."""
    return current_value is None


def _build_patch_payload(
    existing: dict, hyg_row: dict, sys_id: str
) -> Optional[tuple[dict, dict]]:
    """
    Construit le payload de mise à jour : uniquement champs NULL.
    Retourne (payload, field_sources) ou None si rien à faire.
    """
    payload = {}
    new_fs = dict(existing.get("field_sources") or {})
    if isinstance(new_fs, str):
        try:
            new_fs = json.loads(new_fs) if new_fs.strip() else {}
        except json.JSONDecodeError:
            new_fs = {}
    else:
        new_fs = dict(new_fs) if new_fs else {}

    for db_field, _ in PATCH_FIELDS:
        current = existing.get(db_field)
        if not _can_write_field(current):
            continue
        new_val = hyg_row.get(db_field)
        if new_val is None:
            continue
        payload[db_field] = new_val
        new_fs[db_field] = "HYG"

    if not payload:
        return None

    payload["field_sources"] = new_fs
    return (payload, new_fs)


def _count_missing(all_systems: list[dict]) -> dict[str, int]:
    """Compte les systèmes avec chaque champ manquant."""
    counts = {db_field: 0 for db_field, _ in PATCH_FIELDS}
    for row in all_systems:
        for db_field, _ in PATCH_FIELDS:
            if _can_write_field(row.get(db_field)):
                counts[db_field] += 1
    return counts


def run(
    *,
    dry_run: bool = True,
    system_filter: Optional[str] = None,
) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stderr)],
    )

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        logging.error("%s", e)
        return 1

    # Charger HYG
    logging.info("Chargement HYG...")
    df = _load_hyg_full()
    lookup = _build_hyg_lookup(df)
    lookup_dist_spect = _build_lookup_dist_spect(df)
    hyg_count = len(df)
    logging.info("Entrées HYG chargées : %d", hyg_count)

    # Charger stellar_systems (pagination ou filtre --system)
    all_systems: list[dict] = []
    offset = 0
    select_cols = "id,name,distance,spectral_type,constellation_abbr,luminosity,color_index,field_sources"
    while True:
        q = client.table("stellar_systems").select(select_cols)
        if system_filter:
            resolved = LACUNA_ID_MAP.get(_normalize_id(system_filter), system_filter)
            ids_to_try = list(dict.fromkeys([resolved, system_filter]))
            q = q.in_("id", ids_to_try)
            resp = q.execute()
            if resp.data:
                all_systems = resp.data
            break
        q = q.range(offset, offset + PAGE_SIZE - 1)
        resp = q.execute()
        rows = resp.data or []
        if not rows:
            break
        all_systems.extend(rows)
        offset += PAGE_SIZE
        if len(rows) < PAGE_SIZE:
            break

    total_systems = len(all_systems)
    missing_before = _count_missing(all_systems)

    # Filtrer : au moins un des champs NULL
    needs_patch = [
        s
        for s in all_systems
        if any(_can_write_field(s.get(db_f)) for db_f, _ in PATCH_FIELDS)
    ]

    stats = {
        "matched": 0,
        "matched_by_name": 0,
        "matched_by_dist_spect": 0,
        "unmatched": 0,
        "patched": 0,
        "fields_completed": {db_f: 0 for db_f, _ in PATCH_FIELDS},
        "unmatched_ids": [],
    }

    for sys_row in needs_patch:
        sys_id = sys_row.get("id")
        sys_name = sys_row.get("name") or ""
        if not sys_id:
            continue

        match_result = _find_hyg_match(
            sys_id, sys_name, lookup,
            lookup_dist_spect=lookup_dist_spect,
            sys_row=sys_row,
        )
        if not match_result:
            stats["unmatched"] += 1
            stats["unmatched_ids"].append(sys_id)
            continue

        hyg_row, match_type = match_result
        stats["matched"] += 1
        if match_type == "name":
            stats["matched_by_name"] += 1
        else:
            stats["matched_by_dist_spect"] += 1

        result = _build_patch_payload(sys_row, hyg_row, sys_id)
        if not result:
            continue

        payload, _ = result
        if not dry_run:
            try:
                client.table("stellar_systems").update(payload).eq("id", sys_id).execute()
                stats["patched"] += 1
                for k in payload:
                    if k != "field_sources" and k in stats["fields_completed"]:
                        stats["fields_completed"][k] += 1
            except Exception as e:
                logging.exception("Erreur update %s : %s", sys_id, e)
        else:
            stats["patched"] += 1
            for k in payload:
                if k != "field_sources" and k in stats["fields_completed"]:
                    stats["fields_completed"][k] += 1

    # Log unmatched
    UNMATCHED_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(UNMATCHED_LOG, "w", encoding="utf-8") as f:
        for uid in stats["unmatched_ids"]:
            f.write(uid + "\n")

    # Output attendu
    print()
    print("=== HYG Patch — LACUNA ===")
    print(f"Systèmes en base : {total_systems}")
    print(f"Entrées HYG chargées : {hyg_count}")
    print(f"Matchings trouvés : {stats['matched']}")
    print(f"  — par nom (incl. GJ/Gl) : {stats['matched_by_name']}")
    print(f"  — par fallback dist+spect : {stats['matched_by_dist_spect']}")
    print(f"Matchings non trouvés : {stats['unmatched']}", end="")
    if stats["unmatched_ids"]:
        preview = ", ".join(stats["unmatched_ids"][:10])
        if len(stats["unmatched_ids"]) > 10:
            preview += ", ..."
        print(f" (ex: {preview})")
    else:
        print()

    print()
    print("Champs à compléter :")
    for db_field, _ in PATCH_FIELDS:
        before = missing_before.get(db_field, 0)
        filled = stats["fields_completed"].get(db_field, 0)
        print(f"  {db_field:20} : {before:5} manquants → {filled:5} complétés")

    print()
    if dry_run:
        print("Mode dry-run : aucune écriture. Lancer avec --apply pour écrire.")
    else:
        print(f"Mode apply : {stats['patched']} système(s) mis à jour.")

    print(f"\nSystèmes non matchés loggés dans : {UNMATCHED_LOG}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch HYG — complète champs manquants (constellation_abbr, luminosity, color_index)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Application réelle en base (sinon dry-run)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: BARNARD, barnards-star)",
    )
    args = parser.parse_args()

    return run(dry_run=not args.apply, system_filter=args.system)


if __name__ == "__main__":
    sys.exit(main())
