#!/usr/bin/env python3
"""
Patch luminosity — extrapole la luminosité depuis le type spectral.

Applique les valeurs médianes calibrées sur HYG pour les systèmes sans
luminosity mais avec spectral_type. Ne remplace jamais une valeur existante.

Source : EXTRAPOLATED (valeur dérivée, pas mesure directe).
Idempotent : relancé deux fois, ne modifie rien la deuxième fois.
"""
import argparse
import json
import logging
import re
import sys
from pathlib import Path
from typing import Optional

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
PAGE_SIZE = 1000
UNKNOWN_LOG = Path(__file__).resolve().parent / "luminosity_patch_unknown.log"

LUMINOSITY_BY_SPECTRAL = {
    # Étoiles de séquence principale
    "O5": 500000.0,
    "O6": 300000.0,
    "O7": 200000.0,
    "O8": 100000.0,
    "O9": 50000.0,
    "O": 200000.0,
    "B0": 20000.0,
    "B1": 10000.0,
    "B2": 6000.0,
    "B3": 3000.0,
    "B5": 800.0,
    "B8": 200.0,
    "B9": 80.0,
    "B": 5000.0,
    "A0": 80.0,
    "A1": 60.0,
    "A2": 45.0,
    "A3": 35.0,
    "A5": 20.0,
    "A7": 12.0,
    "A": 40.0,
    "F0": 6.5,
    "F2": 5.0,
    "F5": 3.5,
    "F8": 2.0,
    "F": 4.0,
    "G0": 1.5,
    "G2": 1.0,
    "G5": 0.7,
    "G8": 0.5,
    "G": 0.9,
    "K0": 0.4,
    "K1": 0.35,
    "K2": 0.28,
    "K3": 0.22,
    "K4": 0.17,
    "K5": 0.13,
    "K7": 0.07,
    "K": 0.25,
    "M0": 0.07,
    "M1": 0.04,
    "M2": 0.025,
    "M3": 0.015,
    "M4": 0.007,
    "M5": 0.003,
    "M6": 0.001,
    "M7": 0.0005,
    "M8": 0.0002,
    "M": 0.01,
    # Naines brunes
    "L": 0.00005,
    "T": 0.000005,
    "Y": 0.0000005,
    # Naines blanches
    "D": 0.001,
    "DA": 0.001,
    "DB": 0.001,
    "DC": 0.001,
    "WD": 0.001,
    # Sous-naines
    "sd": 0.01,
}


def extract_spectral_key(spectral_type: str) -> Optional[str]:
    """
    Extrait la clé de lookup depuis le type spectral brut HYG/NASA.

    Exemples :
      "G2V"    → "G2"
      "M5Ve"   → "M5"
      "K0III"  → "K0"
      "sdM4"   → "M4" (sous-naine → utiliser la classe principale)
      "DA2"    → "DA"
      "nan"    → None
      "m"      → "M"  (minuscule → majuscule)
      "k-m"    → "K"  (prendre la première lettre)
    """
    if not spectral_type or str(spectral_type).lower() in ("nan", "none", ""):
        return None

    s = str(spectral_type).strip()

    # Sous-naines : "sdM4" → "M4"
    if s.lower().startswith("sd"):
        s = s[2:]

    # Naines blanches : "DA", "DB", "DC", "WD"
    if s.upper().startswith("WD"):
        return "WD"
    if len(s) >= 2 and s[0].upper() == "D" and s[1].upper() in "ABCEHOPQVXZ":
        return s[:2].upper()

    # Classe + sous-classe : "G2V" → "G2", "M5Ve" → "M5"
    m = re.match(r"^([A-Za-z])([0-9])", s)
    if m:
        return m.group(1).upper() + m.group(2)

    # Classe seule : "G", "K", "M", "m", "k-m"
    first = s[0].upper()
    if first in "OBAFGKMLTY":
        return first

    return None


def get_luminosity(spectral_type: str) -> Optional[float]:
    key = extract_spectral_key(spectral_type)
    if key is None:
        return None
    return LUMINOSITY_BY_SPECTRAL.get(key) or LUMINOSITY_BY_SPECTRAL.get(
        key[0].upper()
    )


def _can_write(current_value) -> bool:
    """Ne jamais écraser une valeur existante."""
    return current_value is None


def fetch_systems_null_luminosity(client) -> list[dict]:
    """Récupère les systèmes avec luminosity IS NULL (pagination)."""
    all_rows = []
    offset = 0
    cols = "id,luminosity,spectral_type,field_sources"
    while True:
        resp = (
            client.table("stellar_systems")
            .select(cols)
            .is_("luminosity", "null")
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


def run(
    *,
    dry_run: bool = True,
    batch_size: int = 500,
    system_filter: Optional[str] = None,
) -> int:
    log_handlers = [logging.StreamHandler(sys.stdout)]
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=log_handlers,
    )
    log = logging.getLogger(__name__)

    try:
        client = get_supabase_client()
    except RuntimeError as e:
        log.error("%s", e)
        return 1

    missing = fetch_systems_null_luminosity(client)
    total_missing = len(missing)

    if system_filter:
        filter_norm = system_filter.strip().lower().replace("_", "-")
        missing = [
            s
            for s in missing
            if (s.get("id") or "").lower().replace("_", "-") == filter_norm
        ]
        if not missing:
            log.warning("Filtre --system '%s' : aucun système à traiter", system_filter)
            return 0

    usable = 0
    unusable = 0
    to_update = []
    unknown_types: set[str] = set()
    dist_by_class: dict[str, list[float]] = {}

    for s in missing:
        sid = s.get("id", "")
        spec = s.get("spectral_type")

        if not _can_write(s.get("luminosity")):
            continue

        if not spec or str(spec).strip() == "":
            unusable += 1
            continue

        lum = get_luminosity(str(spec))
        if lum is None:
            unusable += 1
            unknown_types.add(str(spec).strip())
            continue

        usable += 1
        key = extract_spectral_key(str(spec))
        class_letter = key[0] if key else "?"
        if class_letter not in dist_by_class:
            dist_by_class[class_letter] = []
        dist_by_class[class_letter].append(lum)

        fs = dict(s.get("field_sources") or {})
        if isinstance(fs, str):
            try:
                fs = json.loads(fs) if fs.strip() else {}
            except json.JSONDecodeError:
                fs = {}
        fs["luminosity"] = "EXTRAPOLATED"

        to_update.append({
            "id": sid,
            "luminosity": lum,
            "field_sources": fs,
        })

    # Log unknown types
    if unknown_types:
        UNKNOWN_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(UNKNOWN_LOG, "w", encoding="utf-8") as f:
            for t in sorted(unknown_types):
                f.write(t + "\n")

    # Output
    print()
    print("=== Luminosity Patch — LACUNA ===")
    print(f"Systèmes sans luminosity : {total_missing}")
    print(f"  Avec spectral_type utilisable : {usable}")
    print(f"  Sans spectral_type ou type non reconnu : {unusable}")
    print()
    print(f"Luminosités à écrire : {len(to_update)}")
    if dist_by_class:
        print("  Distribution par classe :")
        for cls in sorted(dist_by_class.keys()):
            vals = dist_by_class[cls]
            rng = f"{min(vals):.6f}–{max(vals):.6f}" if len(vals) > 1 else f"{vals[0]:.6f}"
            print(f"    {cls} : {len(vals)}  (ex: {rng})")
    print()

    if dry_run:
        print("Mode dry-run — aucune écriture. Lancer avec --apply pour écrire.")
        if unknown_types:
            print(f"Types non reconnus loggés : {UNKNOWN_LOG}")
        return 0

    for i in range(0, len(to_update), batch_size):
        batch = to_update[i : i + batch_size]
        for row in batch:
            try:
                client.table("stellar_systems").update({
                    "luminosity": row["luminosity"],
                    "field_sources": row["field_sources"],
                }).eq("id", row["id"]).execute()
                log.info("  %s : luminosity=%.6f (spectral_type)", row["id"], row["luminosity"])
            except Exception as e:
                log.exception("Erreur update %s : %s", row["id"], e)

    print(f"Mode apply : {len(to_update)} système(s) mis à jour.")
    if unknown_types:
        print(f"Types non reconnus loggés : {UNKNOWN_LOG}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Patch luminosity extrapolée depuis spectral_type"
    )
    parser.add_argument("--apply", action="store_true", help="Écrire en base")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Taille des lots (défaut: 500)",
    )
    parser.add_argument(
        "--system",
        metavar="ID",
        help="Tester sur un seul système (ex: wolf-359)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Simulation (défaut)")
    args = parser.parse_args()
    return run(
        dry_run=not args.apply,
        batch_size=args.batch_size,
        system_filter=args.system,
    )


if __name__ == "__main__":
    sys.exit(main())
