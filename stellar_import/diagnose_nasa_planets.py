#!/usr/bin/env python3
"""
Diagnostic NASA / system_objects / stellar_systems.
- Pas de colonne data_source en base → on infère via les sources.
- Simulation résolution hostname → system_id pour compter les planètes ignorées.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from supabase_client import get_supabase_client
from parse_nasa import fetch_nasa_planets, normalize_nasa_row
from upsert_systems import fetch_existing_systems, resolve_hostname_to_system_id


def main():
    client = get_supabase_client()

    # ── 1. system_objects : planètes type PLANET ──
    resp = client.table("system_objects").select("id,system_id,type", count="exact").eq("type", "PLANET").execute()
    total_planets = resp.count if hasattr(resp, "count") and resp.count is not None else len(resp.data or [])
    # Pas de data_source en base — toutes les planètes sont mélangées (seed + NASA)
    print("=== system_objects (type=PLANET) ===")
    print(f"  Total planètes en base : {total_planets}")
    print("  (Pas de colonne data_source — seed et NASA mélangés)")

    # ── 2. stellar_systems avec planets > 0 ──
    resp2 = client.table("stellar_systems").select("id,planets", count="exact").gt("planets", 0).execute()
    count_systems_planets = resp2.count if hasattr(resp2, "count") and resp2.count is not None else len(resp2.data or [])
    systems_with_planets = resp2.data or []
    total_planets_field = sum(int(s.get("planets") or 0) for s in systems_with_planets)
    print("\n=== stellar_systems (planets > 0) ===")
    print(f"  Systèmes avec planets > 0 : {count_systems_planets}")
    print(f"  Somme du champ planets : {total_planets_field}")

    # ── 3. Simulation NASA : résolution hostname → system_id ──
    print("\n=== Jointure hostname → system_id (simulation import NASA) ===")
    try:
        df = fetch_nasa_planets()
    except Exception as e:
        print(f"  Erreur fetch NASA : {e}")
        return

    planets_nasa = [normalize_nasa_row(row) for _, row in df.iterrows()]
    planets_nasa = [p for p in planets_nasa if p and p.get("hostname") and p.get("designation")]

    existing = fetch_existing_systems(client)
    resolved = []
    unresolved = []
    unresolved_hostnames = set()

    for p in planets_nasa:
        hid = resolve_hostname_to_system_id(p["hostname"], existing)
        if hid:
            resolved.append((p, hid))
        else:
            unresolved.append(p)
            unresolved_hostnames.add(p["hostname"])

    print(f"  Planètes NASA (API, dist < 500 al) : {len(planets_nasa)}")
    print(f"  Résolues (hostname → system_id trouvé) : {len(resolved)}")
    print(f"  Ignorées (hôte non trouvé) : {len(unresolved)}")
    if unresolved_hostnames:
        print(f"  Hostnames non résolus (échantillon 25) :")
        for h in sorted(unresolved_hostnames)[:25]:
            n = sum(1 for u in unresolved if u["hostname"] == h)
            print(f"    - {h} ({n} planète(s))")
        if len(unresolved_hostnames) > 25:
            print(f"    ... et {len(unresolved_hostnames) - 25} autres")
        # Patterns courants non résolus
        hd_like = [h for h in unresolved_hostnames if h.upper().startswith("HD ") or "HD " in h.upper()]
        two_mass = [h for h in unresolved_hostnames if "2MASS" in h.upper()]
        kepler = [h for h in unresolved_hostnames if "KEPLER" in h.upper()]
        print(f"  Patterns non résolus : HD-like={len(hd_like)}, 2MASS={len(two_mass)}, Kepler={len(kepler)}")

    # ── 4. Répartition system_id des planètes en base ──
    resp3 = client.table("system_objects").select("system_id").eq("type", "PLANET").execute()
    by_system = {}
    for r in resp3.data or []:
        sid = r.get("system_id")
        if sid:
            by_system[sid] = by_system.get(sid, 0) + 1
    print("\n=== Répartition planètes par système (top 15) ===")
    for sid, n in sorted(by_system.items(), key=lambda x: -x[1])[:15]:
        print(f"  {sid} : {n} planète(s)")


if __name__ == "__main__":
    main()
