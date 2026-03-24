#!/usr/bin/env python3
"""
Analyse les IDs non matchés : pour chaque ID Supabase, cherche dans HYG
l'entrée la plus proche (distance + type spectral) et affiche la correspondance.

Usage: python3 stellar_import/analyze_unmatched_hyg.py
"""
import re
import sys
from pathlib import Path
from typing import Optional

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
HYG_PATH = ROOT / "Ressources" / "hyg_v42.csv"
UNMATCHED_LOG = ROOT / "hyg_patch_unmatched.log"
N_FIRST = 20


def slugify(s: str) -> str:
    if not s or pd.isna(s):
        return ""
    s = str(s).strip().lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    return s.strip("-") or ""


def load_hyg() -> pd.DataFrame:
    df = pd.read_csv(HYG_PATH, dtype=str, na_values=["", "nan"])
    for col in ["dist", "spect"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce") if col == "dist" else df[col]
    return df


def load_unmatched_ids(n: int = N_FIRST) -> list[str]:
    if not UNMATCHED_LOG.exists():
        return []
    with open(UNMATCHED_LOG, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()][:n]


def id_to_patterns(supabase_id: str) -> list[str]:
    """Génère des variantes pour matcher l'ID dans HYG."""
    sid = supabase_id.strip().lower()
    patterns = []
    # gj-143 → GJ 143, Gl 143
    m = re.match(r"g[jl]-(\d+(?:\.\d+)?[a-z]?)", sid)
    if m:
        num = m.group(1)
        patterns.append(f"Gl {num}")
        patterns.append(f"GJ {num}")
        patterns.append(f"gl {num}")
        patterns.append(f"gj {num}")
    # gl-gl-667c → Gl 667C, gl-667c
    m = re.match(r"gl-gl-(\d+[a-z]?)", sid)
    if m:
        patterns.append(f"Gl {m.group(1)}")
        patterns.append(f"gl {m.group(1)}")
    # k2-141, toi-5789 → pas dans HYG (missions)
    m = re.match(r"(k2|toi|kepler)-(\d+)", sid)
    if m:
        patterns.append(supabase_id)
    # hd-12345
    m = re.match(r"hd-?(\d+)", sid)
    if m:
        patterns.append(m.group(1))
    # hip-12345
    m = re.match(r"hip-?(\d+)", sid)
    if m:
        patterns.append(m.group(1))
    # 14-her → 14 Her, bayer/flam
    m = re.match(r"(\d+)-([a-z]+)", sid)
    if m:
        patterns.append(f"{m.group(1)} {m.group(2)}")
    # cd-cet, lp-714-47
    patterns.append(sid.replace("-", " "))
    return patterns


def build_hyg_index(df: pd.DataFrame) -> dict:
    """Index HYG par gl, proper, hd, hip, et numéros extraits."""
    index = {"gl": {}, "proper": {}, "hd": {}, "hip": {}, "gl_by_num": {}}
    for idx, row in df.iterrows():
        dist_val = row.get("dist")
        if pd.isna(dist_val) or float(dist_val) <= 0:
            continue
        gl = str(row.get("gl", "")).strip() if pd.notna(row.get("gl")) else ""
        proper = str(row.get("proper", "")).strip() if pd.notna(row.get("proper")) else ""
        hd = str(row.get("hd", "")).strip() if pd.notna(row.get("hd")) else ""
        hip = str(row.get("hip", "")).strip() if pd.notna(row.get("hip")) else ""
        r = {
            "gl": gl or None,
            "proper": proper or None,
            "hip": hip or None,
            "hd": hd or None,
            "dist": float(dist_val),
            "spect": str(row.get("spect", "")).strip() if pd.notna(row.get("spect")) else "",
        }
        if gl:
            gl_slug = slugify(gl)
            index["gl"][gl_slug] = r
            index["gl"]["gl-" + gl_slug] = r
            # gj/gl variante (GJ 143 ≈ Gl 143)
            if gl_slug.startswith("gj-"):
                index["gl"][gl_slug.replace("gj-", "gl-")] = r
            elif gl_slug.startswith("gl-"):
                index["gl"][gl_slug.replace("gl-", "gj-")] = r
            # Numéro nu pour fallback (ex: 143 → Gl 143)
            for num in re.findall(r"\d+(?:\.\d+)?[a-z]?", gl):
                if num and len(num) >= 2:
                    key = num.lstrip("0") or "0"
                    if key not in index["gl_by_num"] or r["dist"] < index["gl_by_num"][key]["dist"]:
                        index["gl_by_num"][key] = r
        if proper:
            index["proper"][slugify(proper)] = r
        if hd:
            try:
                h = str(int(float(hd)))
                index["hd"]["hd-" + h] = r
            except (ValueError, TypeError):
                pass
        if hip:
            try:
                p = str(int(float(hip)))
                index["hip"]["hip-" + p] = r
            except (ValueError, TypeError):
                pass
    return index


def find_best_hyg_match(
    supabase_id: str, df: pd.DataFrame, index: dict, db_row: Optional[dict]
) -> Optional[dict]:
    """Trouve la meilleure correspondance HYG via l'index."""
    sid_lower = supabase_id.lower().strip()
    candidates = []

    # 1. Match direct sur index
    if sid_lower in index["gl"]:
        return index["gl"][sid_lower]
    if sid_lower in index["hd"]:
        return index["hd"][sid_lower]
    if sid_lower in index["hip"]:
        return index["hip"][sid_lower]
    if sid_lower in index["proper"]:
        return index["proper"][sid_lower]

    # 2. Variantes gj/gl (GJ 143 ≈ Gl 143)
    sid_norm = sid_lower.replace("gj-", "gl-").replace("gj", "gl")
    if sid_norm in index["gl"]:
        return index["gl"][sid_norm]

    # 3. gl/gj uniquement : gj-143, gl-667c (pas toi-, k2-, kepler- = missions)
    if re.match(r"g[jl](-|gl-)\d", sid_lower) or re.match(r"^(gl-)?gl-\d", sid_lower):
        m = re.search(r"(\d+(?:\.\d+)?[a-z]?)", sid_lower)
        if m:
            num = m.group(1)
            key = num.lstrip("0") or "0"
            if key in index["gl_by_num"]:
                return index["gl_by_num"][key]
    # lp-714-47 → Gl 714 (premier numéro)
    if sid_lower.startswith("lp-"):
        m = re.search(r"lp-(\d+)-\d+", sid_lower)
        if m:
            key = m.group(1).lstrip("0") or "0"
            if key in index["gl_by_num"]:
                return index["gl_by_num"][key]
    return None


def main() -> int:
    ids = load_unmatched_ids(N_FIRST)
    if not ids:
        print(f"Aucun ID dans {UNMATCHED_LOG}", file=sys.stderr)
        return 1

    df = load_hyg()
    index = build_hyg_index(df)
    print(f"HYG chargé : {len(df)} entrées")
    print()

    # Récupérer distance/spectral depuis Supabase si dispo
    db_data = {}
    try:
        from supabase_client import get_supabase_client
        client = get_supabase_client()
        resp = client.table("stellar_systems").select("id,distance,spectral_type").in_("id", ids).execute()
        for row in (resp.data or []):
            db_data[row["id"]] = {
                "distance": row.get("distance"),
                "spectral_type": row.get("spectral_type"),
            }
    except Exception:
        pass

    print(f"{'ID Supabase':<25} | {'gl (HYG)':<18} | {'proper (HYG)':<20} | {'hip (HYG)':<10}")
    print("-" * 90)

    for sid in ids:
        db_row = db_data.get(sid)
        match = find_best_hyg_match(sid, df, index, db_row)
        if match:
            gl = (match["gl"] or "")[:18]
            proper = (match["proper"] or "null")[:20]
            hip = (match["hip"] or "null")[:10]
            print(f"{sid:<25} | {gl:<18} | {proper:<20} | {hip:<10}")
        else:
            print(f"{sid:<25} | {'—':<18} | {'—':<20} | {'—':<10}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
