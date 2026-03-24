#!/usr/bin/env python3
"""
Complète les champs manquants dans stellar_systems depuis hyg_v42.csv.
Stratégie : matcher par id (proper/hd/gl) ou name, ne jamais écraser une valeur non-NULL.
"""
import logging
import re
import sys
from pathlib import Path
from typing import Optional

import pandas as pd

from parse_hyg import PARSEC_TO_LY, slugify, _valid_str, build_display_name
from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
HYG_PATHS = [
    ROOT / "Ressources" / "hyg_v42.csv",
    ROOT / "resources" / "hyg_v42.csv",
]

# Ids LACUNA → clés HYG connues (nom affiché différent de HYG)
LACUNA_TO_HYG_KEYS = {
    "barnard": ["barnards-star", "gl-gl-699"],
    "epsilon_eridani": ["ran", "gl-gl-144", "hd-22049", "epsilon eridani"],
    "gliese667": ["gl-gl-667c", "gl-667c", "gliese 667 c"],
    "hd44594": ["hd-44594", "hd 44594"],
}
REPORT_FILE = ROOT / "docs" / "analyses" / "complete_hyg_report.md"
PAGE_SIZE = 1000


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
    Clés : slugify(proper), hd-XXXXX, gl-XXX (slugify), gl-gl-XXX, name lowercase.
    """
    lookup: dict[str, dict] = {}

    def add(key: str, row: dict) -> None:
        if key and key not in lookup:
            lookup[key] = row

    for _, row in df.iterrows():
        proper = row.get("proper")
        gl = row.get("gl")
        hd = row.get("hd")
        dist = row.get("dist")

        # Ignorer Sol et lignes sans distance valide
        if _valid_str(proper) and str(proper).strip().lower() == "sol":
            continue
        if pd.isna(dist) or float(dist) <= 0:
            continue

        # Données HYG normalisées
        dist_ly = float(dist) * PARSEC_TO_LY
        x, y, z = row.get("x"), row.get("y"), row.get("z")
        coords = None
        if pd.notna(x) and pd.notna(y) and pd.notna(z):
            try:
                coords = {
                    "x": round(float(x) * PARSEC_TO_LY, 10),
                    "y": round(float(y) * PARSEC_TO_LY, 10),
                    "z": round(float(z) * PARSEC_TO_LY, 10),
                }
            except (TypeError, ValueError):
                pass

        con = str(row.get("con", "")).strip() if pd.notna(row.get("con")) else None
        constellation_abbr = con if con and con.upper() != "NAN" else None

        hyg_row = {
            "apparent_magnitude": float(row["mag"]) if pd.notna(row.get("mag")) else None,
            "luminosity": float(row["lum"]) if pd.notna(row.get("lum")) else None,
            "color_index": float(row["ci"]) if pd.notna(row.get("ci")) else None,
            "spectral_type": str(row.get("spect", "")).strip() or None,
            "distance": round(dist_ly, 6),
            "coordinates": coords,
            "constellation_abbr": constellation_abbr,
        }

        # Clé 1 : proper slugifié
        if _valid_str(proper):
            add(slugify(proper), hyg_row)

        # Clé 2 : hd-XXXXX
        if _valid_str(hd):
            try:
                add("hd-" + str(int(float(hd))), hyg_row)
            except (ValueError, TypeError):
                pass

        # Clé 3 : gl-XXX (slugify(gl) et gl-+slugify pour compat)
        if _valid_str(gl):
            gl_slug = slugify(gl)
            if gl_slug:
                add("gl-" + gl_slug, hyg_row)
                add(gl_slug, hyg_row)  # "gl-667c" pour id "gl-667c"

        # Clé 4 : name (display) lowercase et slugifié
        name = build_display_name(row)
        if name:
            add(name.strip().lower(), hyg_row)
            add(slugify(name), hyg_row)

    return lookup


def _normalize_id(s: str) -> str:
    return (s or "").lower().replace("_", "-").strip()


def _find_hyg_match(stellar_id: str, stellar_name: str, lookup: dict) -> Optional[dict]:
    """
    Trouve la ligne HYG correspondante.
    Ordre : 0) LACUNA alias, 1) id (proper slug), 2) hd-XXXXX, 3) gl-XXX, 4) name.
    """
    if not lookup:
        return None

    norm_id = _normalize_id(stellar_id)

    # 0. LACUNA id connu → clés HYG
    lacuna_keys = LACUNA_TO_HYG_KEYS.get(norm_id.replace("-", "_"))
    if lacuna_keys:
        for key in lacuna_keys:
            if key in lookup:
                return lookup[key]

    # 1. Match par id (slugifié)
    if norm_id in lookup:
        return lookup[norm_id]

    # 2. Match par hd-XXXXX (id est déjà hd-12345)
    m = re.match(r"hd-?(\d+)", norm_id, re.I)
    if m:
        key = "hd-" + m.group(1)
        if key in lookup:
            return lookup[key]

    # 3. Match par gl-XXX
    if norm_id.startswith("gl-") or "gl-" in norm_id:
        if norm_id in lookup:
            return lookup[norm_id]
        # gl-667c vs gl-gl-667c
        if norm_id.startswith("gl-gl-"):
            alt = "gl-" + norm_id[6:]  # gl-667c
            if alt in lookup:
                return lookup[alt]
        else:
            alt = "gl-gl-" + norm_id[3:] if len(norm_id) > 3 else ""
            if alt in lookup:
                return lookup[alt]

    # 4. Match par name (case insensitive, variantes)
    if stellar_name:
        name_clean = " ".join(stellar_name.strip().lower().split())
        for key in [name_clean, slugify(stellar_name), stellar_name.strip().lower()]:
            if key and key in lookup:
                return lookup[key]

    return None


def _build_update_payload(existing: dict, hyg_row: dict, sys_id: str, log: list) -> Optional[dict]:
    """
    Construit le payload de mise à jour : uniquement champs NULL.
    Ne jamais écraser une valeur existante non-NULL.
    """
    payload = {}
    for field, hyg_key, transform in [
        ("apparent_magnitude", "apparent_magnitude", None),
        ("luminosity", "luminosity", None),
        ("color_index", "color_index", None),
        ("spectral_type", "spectral_type", None),
        ("distance", "distance", None),
        ("coordinates", "coordinates", None),
        ("constellation_abbr", "constellation_abbr", None),
    ]:
        existing_val = existing.get(field)
        new_val = hyg_row.get(hyg_key)
        if new_val is None:
            continue
        if existing_val is not None and existing_val != "":
            continue
        # Coordonnées : vérifier si structure vide ou absente
        if field == "coordinates":
            coords = existing.get("coordinates")
            if isinstance(coords, dict) and any(
                coords.get(k) is not None for k in ("x", "y", "z")
            ):
                continue
            if coords and not isinstance(coords, dict):
                continue
        payload[field] = new_val
        old_str = existing_val if existing_val is not None else "NULL"
        log.append(f"  {field}: {old_str} → {new_val}")

    return payload if payload else None


def run() -> int:
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
    logging.info("Index HYG : %d clés", len(lookup))

    # Charger stellar_systems (pagination)
    all_systems: list[dict] = []
    offset = 0
    while True:
        resp = (
            client.table("stellar_systems")
            .select("id,name,apparent_magnitude,luminosity,color_index,spectral_type,distance,coordinates,constellation_abbr")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            break
        all_systems.extend(rows)
        offset += PAGE_SIZE
        if len(rows) < PAGE_SIZE:
            break

    # Filtrer : au moins un des champs NULL (mag, lum, ci, constellation_abbr)
    needs_completion = [
        s for s in all_systems
        if s.get("apparent_magnitude") is None
        or s.get("luminosity") is None
        or s.get("color_index") is None
        or s.get("constellation_abbr") is None
    ]

    logging.info("Systèmes à compléter (mag/lum/ci NULL) : %d", len(needs_completion))

    stats = {"systems_completed": 0, "fields_filled": 0, "constellation_assigned": 0, "not_found": []}
    all_logs: list[str] = []

    for sys_row in needs_completion:
        sys_id = sys_row.get("id")
        sys_name = sys_row.get("name") or ""
        if not sys_id:
            continue

        hyg_row = _find_hyg_match(sys_id, sys_name, lookup)
        if not hyg_row:
            stats["not_found"].append(sys_id)
            continue

        log_entries: list[str] = []
        payload = _build_update_payload(sys_row, hyg_row, sys_id, log_entries)
        if not payload:
            continue

        payload["id"] = sys_id
        try:
            client.table("stellar_systems").update(payload).eq("id", sys_id).execute()
            stats["systems_completed"] += 1
            n_fields = len([k for k in payload.keys() if k != "id"])
            stats["fields_filled"] += n_fields
            if "constellation_abbr" in payload:
                stats["constellation_assigned"] += 1
            all_logs.append(f"\n### {sys_id}\n")
            all_logs.append(f"  Champs mis à jour : {n_fields}\n")
            for le in log_entries:
                all_logs.append(le + "\n")
                logging.info("%s | %s", sys_id, le.strip())
        except Exception as e:
            logging.exception("Erreur update %s : %s", sys_id, e)

    # Rapport final
    report = f"""# Rapport de complétion HYG → stellar_systems
Généré par complete_hyg_fields.py

## Résumé
- **Systèmes complétés** : {stats["systems_completed"]}
- **Champs remplis** : {stats["fields_filled"]}
- **Constellations assignées** : {stats.get("constellation_assigned", 0)}
- **Systèmes HYG non trouvés** : {len(stats["not_found"])}

## Détail des mises à jour
{"".join(all_logs)}

## Systèmes non trouvés dans HYG
"""
    if stats["not_found"]:
        for sid in stats["not_found"]:
            report += f"- {sid}\n"
    else:
        report += "- (aucun)\n"

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    logging.info("=== Terminé ===")
    logging.info("Systèmes complétés : %d", stats["systems_completed"])
    logging.info("Champs remplis : %d", stats["fields_filled"])
    logging.info("Constellations assignées : %d", stats.get("constellation_assigned", 0))
    logging.info("Non trouvés : %d — %s", len(stats["not_found"]), stats["not_found"][:10] or [])
    logging.info("Rapport : %s", REPORT_FILE)

    return 0


if __name__ == "__main__":
    sys.exit(run())
