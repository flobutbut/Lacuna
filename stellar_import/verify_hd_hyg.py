#!/usr/bin/env python3
"""
Vérification : étoiles HD en conflit dans HYG (hyg_v42.csv).
Affiche hd, proper, ra, dec, dist, spect.
HYG est un catalogue stellaire — il ne contient pas de données planétaires.
"""
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HYG_CSV = ROOT / "Ressources" / "hyg_v42.csv"

HD_NUMBERS = [
    3, 5, 17, 21, 28, 41004, 63, 70, 85, 122, 133131, 156, 199, 200, 222,
]

hd_set = set(HD_NUMBERS)
matches = []

with open(HYG_CSV, encoding="utf-8", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        hd_val = row.get("hd", "").strip()
        if not hd_val:
            continue
        try:
            hd_num = int(hd_val)
        except ValueError:
            continue
        if hd_num in hd_set:
            matches.append({
                "hd": hd_num,
                "proper": row.get("proper", "").strip() or "(aucun)",
                "ra": row.get("ra", ""),
                "dec": row.get("dec", ""),
                "dist": row.get("dist", ""),
                "spect": row.get("spect", "").strip() or "(vide)",
            })

# Trier par numéro HD
matches.sort(key=lambda x: x["hd"])

print("=== HYG v42 — étoiles HD en conflit ===\n")
print("Note : HYG est un catalogue stellaire (Hipparcos, Yale, Gliese).")
print("       Il ne contient AUCUNE donnée planétaire.\n")
print("-" * 70)

for m in matches:
    print(f"\nhd: {m['hd']}")
    print(f"  proper: {m['proper']}")
    print(f"  ra: {m['ra']}  dec: {m['dec']}")
    print(f"  dist: {m['dist']} pc")
    print(f"  spect: {m['spect']}")
    print(f"  HYG liste des planètes ? Non — catalogue stellaire uniquement.")

print("\n" + "-" * 70)
print(f"\nTotal : {len(matches)} / {len(HD_NUMBERS)} étoiles trouvées dans HYG")
missing = hd_set - {m["hd"] for m in matches}
if missing:
    print(f"Non trouvées : {sorted(missing)}")
