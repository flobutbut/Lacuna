#!/usr/bin/env python3
"""
Script temporaire : vérification HD vs NASA TAP sans filtre default_flag.
Affiche le résultat brut pour tous les systèmes HD en conflit.
"""
import json
import requests

NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

HD_NAMES = [
    "HD 3", "HD 5", "HD 17", "HD 21", "HD 28", "HD 41004",
    "HD 63", "HD 70", "HD 85", "HD 122", "HD 133131", "HD 156",
    "HD 199", "HD 200", "HD 222",
]

in_clause = ", ".join(f"'{h}'" for h in HD_NAMES)
query = f"""
    SELECT pl_name, hostname, hd_name, pl_letter, pl_orbper, pl_controv_flag, default_flag
    FROM ps
    WHERE hd_name IN ({in_clause})
"""

params = {"query": query.strip(), "format": "json"}
resp = requests.get(NASA_TAP, params=params, timeout=120)
resp.raise_for_status()
data = resp.json()

print(f"=== NASA TAP — hd_name IN (...), sans filtre default_flag ===")
print(f"Nombre de lignes : {len(data)}\n")
print(json.dumps(data, indent=2, ensure_ascii=False))
