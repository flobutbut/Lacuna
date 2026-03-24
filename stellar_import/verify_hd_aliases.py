#!/usr/bin/env python3
"""
Vérification : aliases NASA pour les étoiles HD en conflit.
Interroge le service NASA Alias Lookup.
"""
import json
import time

import requests

BASE_URL = "https://exoplanetarchive.ipac.caltech.edu/cgi-bin/Lookup/nph-aliaslookup.py"

HD_STARS = [
    "HD 3", "HD 5", "HD 17", "HD 21", "HD 28", "HD 41004",
    "HD 63", "HD 70", "HD 85", "HD 122", "HD 133131", "HD 156",
    "HD 199", "HD 200", "HD 222",
]


def lookup(objname: str) -> dict:
    """Requête NASA Alias Lookup. Retourne le JSON brut."""
    resp = requests.get(BASE_URL, params={"objname": objname}, timeout=15)
    resp.raise_for_status()
    return resp.json()


def main():
    print("=== NASA Alias Lookup — étoiles HD en conflit ===\n")

    for objname in HD_STARS:
        try:
            data = lookup(objname)
            time.sleep(0.3)  # politeness
        except Exception as e:
            print(f"{objname}: ERREUR — {e}\n")
            continue

        manifest = data.get("manifest", {})
        status = manifest.get("lookup_status", "?")
        resolved = manifest.get("resolved_name") or manifest.get("system_name", "—")

        # Hostname officiel
        hostname = resolved if status == "OK" else "—"

        # Aliases
        aliases = []
        if status == "OK":
            sys_info = data.get("system", {}).get("system_info", {})
            alias_set = sys_info.get("alias_set", {})
            aliases = alias_set.get("aliases", [])
            # Ou depuis stellar_set si plus complet
            objs = data.get("system", {}).get("objects", {})
            stellar = objs.get("stellar_set", {}).get("stars", {})
            if stellar:
                first_star = next(iter(stellar.values()), {})
                star_aliases = first_star.get("alias_set", {}).get("aliases", [])
                if star_aliases:
                    aliases = star_aliases

        # Hôte planétaire ?
        snapshot = manifest.get("system_snapshot", {})
        n_planets = snapshot.get("number_of_planets", 0)
        is_host = "Oui" if (status == "OK" and n_planets and int(n_planets) > 0) else "Non"

        print(f"--- {objname} ---")
        print(f"  Status: {status}")
        print(f"  Hostname officiel NASA: {hostname}")
        print(f"  Hôte planétaire: {is_host}")
        if aliases:
            print(f"  Aliases ({len(aliases)}): {', '.join(aliases[:10])}")
            if len(aliases) > 10:
                print(f"    ... et {len(aliases) - 10} autres")
        else:
            print(f"  Aliases: —")
        print()

    print("=== Fin ===")


if __name__ == "__main__":
    main()
