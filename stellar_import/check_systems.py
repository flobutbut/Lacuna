#!/usr/bin/env python3
"""Vérifie les champs apparent_magnitude, x, y, z, luminosity pour des ids donnés."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from supabase_client import get_supabase_client

# IDs en base : sirius (HYG), SOL/PROXIMA/ROSS128/TAU_CETI (LACUNA)
IDS = ["sirius", "SOL", "PROXIMA", "ROSS128", "TAU_CETI"]


def main():
    client = get_supabase_client()
    # Normaliser les ids pour la requête (DB peut avoir SOL, PROXIMA, etc.)
    ids_unique = list(dict.fromkeys(IDS))
    resp = (
        client.table("stellar_systems")
        .select("id, name, apparent_magnitude, coordinates, luminosity")
        .in_("id", ids_unique)
        .execute()
    )
    print("id | name | apparent_magnitude | x | y | z | luminosity")
    print("-" * 80)
    for row in resp.data or []:
        coord = row.get("coordinates") or {}
        x = coord.get("x")
        y = coord.get("y")
        z = coord.get("z")
        print(
            f"{row.get('id')} | {row.get('name')} | "
            f"{row.get('apparent_magnitude')} | {x} | {y} | {z} | {row.get('luminosity')}"
        )
    if not resp.data:
        print("(aucune ligne trouvée)")


if __name__ == "__main__":
    main()
