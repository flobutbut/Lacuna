#!/usr/bin/env python3
"""
Liste les systèmes exoplanétaires NASA par distance croissante.

Requête NASA Exoplanet Archive TAP : hostname, sy_dist, nb_planets.
"""
import requests

from supabase_client import get_supabase_client
from upsert_systems import HOSTNAME_TO_ID

NASA_TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
PARSEC_TO_LY = 3.26156
LIMIT_AL = 500
LIMIT_PC = LIMIT_AL / PARSEC_TO_LY


def _hostname_to_slug(hn: str) -> str:
    """Kepler-452 → kepler-452, 55 Cnc → 55-cnc."""
    return hn.strip().lower().replace(" ", "-").replace("'", "").replace(".", "")


def _hostname_to_id(hostname: str) -> str:
    """Dérive l'id Supabase probable depuis le hostname NASA."""
    hn_norm = " ".join(hostname.strip().lower().split())
    if hn_norm in HOSTNAME_TO_ID:
        return HOSTNAME_TO_ID[hn_norm]
    return _hostname_to_slug(hostname)


def fetch():
    params = {
        "query": """
            SELECT hostname, sy_dist, COUNT(*) as nb_planets
            FROM ps
            WHERE default_flag = 1
              AND sy_dist IS NOT NULL
            GROUP BY hostname, sy_dist
            ORDER BY sy_dist ASC
        """,
        "format": "json",
    }
    resp = requests.get(NASA_TAP, params=params, timeout=120)
    resp.raise_for_status()
    return resp.json()


def main():
    print("Requête NASA Exoplanet Archive...")
    systems = fetch()
    for s in systems:
        s["id_supabase"] = _hostname_to_id(str(s.get("hostname", "")))

    dans_zone = [s for s in systems if s.get("sy_dist") is not None and float(s["sy_dist"]) <= LIMIT_PC]
    print(f"\nSystèmes NASA dans les {LIMIT_AL} al : {len(dans_zone)}")

    # IDs déjà en base
    try:
        client = get_supabase_client()
        resp = client.table("stellar_systems").select("id").execute()
        ids_en_base = {r["id"] for r in (resp.data or [])}
    except Exception as e:
        print(f"Erreur Supabase : {e} — ids_en_base = {{}}")
        ids_en_base = set()

    pas_en_base = [s for s in dans_zone if s["id_supabase"] not in ids_en_base]
    print(f"Dont absents de la base : {len(pas_en_base)}")

    print(f"\n{len(systems)} systèmes au total (hostname, sy_dist pc, nb_planets)\n")
    print(f"{'hostname':<35} {'dist (pc)':>10} {'dist (al)':>10} {'planètes':>8}")
    print("-" * 65)
    for r in systems[:50]:
        hostname = str(r.get("hostname", ""))[:34]
        dist_pc = r.get("sy_dist")
        dist_ly = float(dist_pc) * PARSEC_TO_LY if dist_pc is not None else 0
        nb = r.get("nb_planets", 0)
        print(f"{hostname:<35} {float(dist_pc):>10.2f} {dist_ly:>10.2f} {nb:>8}")
    if len(systems) > 50:
        print(f"... et {len(systems) - 50} autres systèmes")


if __name__ == "__main__":
    main()
