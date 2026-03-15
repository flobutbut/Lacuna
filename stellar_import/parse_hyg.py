"""
Lecture et normalisation des données HYG (Harvard-Yale-Gliese).
Filtre : dist < 153.4 parsecs (= 500 al).
"""
import re
from pathlib import Path
from typing import Iterator, Optional, Union

import pandas as pd

PARSEC_TO_LY = 3.26156
MAX_DIST_PARSEC = 153.4

# Chemins possibles pour le fichier HYG
HYG_PATHS = [
    Path(__file__).resolve().parent.parent / "Ressources" / "hyg_v42.csv",
    Path(__file__).resolve().parent.parent / "resources" / "hyg.csv",
]


def slugify(s: str) -> str:
    """Convertit en id snake_case : minuscules, espaces → tirets."""
    if not s or pd.isna(s):
        return ""
    s = str(s).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return s.strip("-") or ""


def _valid_str(val) -> bool:
    """Vrai si la valeur est non nulle, non NaN, et non la chaîne 'nan'."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return False
    s = str(val).strip().lower()
    return bool(s) and s != "nan"


def build_system_id(row: pd.Series) -> str:
    """
    Construit un id stable pour stellar_systems.
    Priorité : proper > gl > hd > hip > hyg-id
    """
    proper = row.get("proper")
    gl = row.get("gl")
    hd = row.get("hd")
    hip = row.get("hip")

    if _valid_str(proper) and str(proper).strip().lower() != "sol":
        s = slugify(proper)
        if s:
            return s
    if _valid_str(gl):
        s = slugify(gl)
        if s:
            return "gl-" + s
    if _valid_str(hd):
        try:
            return "hd-" + str(int(float(hd)))
        except (ValueError, TypeError):
            pass
    if _valid_str(hip):
        try:
            return "hip-" + str(int(float(hip)))
        except (ValueError, TypeError):
            pass
    return "hyg-" + str(row.get("id", row.name))


def build_display_name(row: pd.Series) -> str:
    """Construit un nom affiché lisible. Priorité : proper > gl > bf > hd."""
    proper = row.get("proper")
    gl = row.get("gl")
    bf = row.get("bf")
    hd = row.get("hd")

    if _valid_str(proper):
        return str(proper).strip()
    if _valid_str(gl):
        return "Gliese " + str(gl).strip()
    if _valid_str(bf):
        return str(bf).strip()
    if _valid_str(hd):
        try:
            return f"HD {int(float(hd))}"
        except (ValueError, TypeError):
            pass
    return f"Star {row.get('id', row.name)}"


def parse_hyg_file(path: Optional[Path] = None) -> pd.DataFrame:
    """Charge le CSV HYG et applique les filtres."""
    for p in HYG_PATHS if path is None else [path]:
        if p.exists():
            df = pd.read_csv(p, dtype=str, na_values=["", "nan"])
            break
    else:
        raise FileNotFoundError(
            f"Aucun fichier HYG trouvé. Chemins essayés : {HYG_PATHS}"
        )

    # Conversion numérique
    for col in ["dist", "x", "y", "z", "mag", "lum", "ci"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Filtre distance < 153.4 pc
    df = df[df["dist"].notna() & (df["dist"] > 0) & (df["dist"] < MAX_DIST_PARSEC)]

    return df


def iter_hyg_rows(
    path: Optional[Path] = None,
    ids_filter: Optional[set[str]] = None,
) -> Iterator[dict]:
    """
    Itère sur les lignes HYG normalisées pour upsert stellar_systems.
    Chaque row est un dict prêt pour Supabase.
    """
    df = parse_hyg_file(path)

    for idx, row in df.iterrows():
        dist_pc = row.get("dist")
        if pd.isna(dist_pc) or float(dist_pc) <= 0:
            continue

        dist_ly = float(dist_pc) * PARSEC_TO_LY
        x = row.get("x")
        y = row.get("y")
        z = row.get("z")

        coords = {}
        if pd.notna(x) and pd.notna(y) and pd.notna(z):
            try:
                coords = {
                    "x": float(x) * PARSEC_TO_LY,
                    "y": float(y) * PARSEC_TO_LY,
                    "z": float(z) * PARSEC_TO_LY,
                }
            except (TypeError, ValueError):
                pass

        sys_id = build_system_id(row)
        name = build_display_name(row)
        if not sys_id or not name:
            continue
        if ids_filter is not None and sys_id not in ids_filter:
            continue

        yield {
            "id": sys_id,
            "name": name,
            "spectral_type": str(row.get("spect", "")).strip() or None,
            "distance": round(dist_ly, 6),
            "age": None,
            "planets": 0,
            "habitable_zone": False,
            "anomaly_level": 0,
            "coordinates": coords if coords else None,
            "luminosity": float(row["lum"]) if pd.notna(row.get("lum")) else None,
            "color_index": float(row["ci"]) if pd.notna(row.get("ci")) else None,
            "apparent_magnitude": float(row["mag"]) if pd.notna(row.get("mag")) else None,
            "has_magnetic_field": False,
            "_row_index": idx,
        }
