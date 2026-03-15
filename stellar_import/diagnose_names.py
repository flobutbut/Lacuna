#!/usr/bin/env python3
"""
Diagnostic : incohérences de noms stellar_systems vs system_objects.
Recherche "tau" → pointe correctement mais tooltip affiche "Gliese" ?
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from supabase_client import get_supabase_client


def main():
    client = get_supabase_client()

    # 1. stellar_systems : tous ceux avec tau, gliese, ceti dans nom ou id
    resp = client.table("stellar_systems").select("id, name, spectral_type").execute()
    systems = resp.data or []

    tau_like = [s for s in systems if s and ("tau" in (s.get("name") or "").lower() or "tau" in (s.get("id") or "").lower() or "ceti" in (s.get("name") or "").lower())]
    gliese_like = [s for s in systems if s and "gliese" in (s.get("name") or "").lower()]

    print("=== stellar_systems (id, name) contenant tau/ceti ===")
    for s in tau_like:
        print(f"  {s.get('id')} | name={s.get('name')} | spectral={s.get('spectral_type')}")

    print("\n=== stellar_systems avec 'Gliese' dans name (échantillon 15) ===")
    for s in gliese_like[:15]:
        print(f"  {s.get('id')} | name={s.get('name')}")

    # 2. TAU_CETI spécifiquement
    tau = next((s for s in systems if (s.get("id") or "").upper() == "TAU_CETI"), None)
    print("\n=== TAU_CETI dans stellar_systems ===")
    if tau:
        print(f"  id={tau.get('id')} name={tau.get('name')} (doit être 'Tau Ceti')")
    else:
        print("  (absent)")

    # 3. system_objects STAR pour TAU_CETI
    resp2 = client.table("system_objects").select("system_id, type, designation, name").eq("system_id", "TAU_CETI").execute()
    objs = resp2.data or []
    star_obj = next((o for o in objs if o.get("type") == "STAR"), None)
    print("\n=== system_objects (STAR) pour TAU_CETI ===")
    if star_obj:
        print(f"  name={star_obj.get('name')} (étoile affichée en vue Système)")
    for o in objs[:5]:
        print(f"  {o.get('type')} {o.get('designation')} | name={o.get('name')}")

    # 4. Vérifier doublons potentiels (gl-gl-71 vs TAU_CETI)
    ids = [s.get("id") for s in systems if s and s.get("id")]
    dupes = [i for i in ["TAU_CETI", "gl-gl-71", "GL-GL-71"] if i in ids]
    print("\n=== IDs potentiellement en doublon (TAU_CETI / gl-gl-71) ===")
    print(f"  Trouvés: {dupes}")

    # 5. Systèmes LACUNA connus avec noms HYG vs seed
    lacuna = ["TAU_CETI", "PROXIMA", "ROSS128", "SOL", "GLIESE667"]
    print("\n=== Systèmes LACUNA : id | name (attendu préféré) ===")
    for sid in lacuna:
        s = next((x for x in systems if (x.get("id") or "").upper() == sid.upper()), None)
        if s:
            name = s.get("name") or "(null)"
            preferred = {"TAU_CETI": "Tau Ceti", "PROXIMA": "Proxima Centauri", "ROSS128": "Ross 128", "SOL": "Sol", "GLIESE667": "Gliese 667C"}.get(sid.upper(), "")
            ok = "✓" if name == preferred or not preferred else ("⚠" if "Gliese Gl" in str(name) or (preferred and name != preferred) else "?")
            print(f"  {sid} | {name} {ok}")

    # 6. Doublons HYG/LACUNA (vérification ciblée par id)
    from upsert_systems import LACUNA_ID_MAP
    dupes = []
    for id_hyg, id_db in LACUNA_ID_MAP.items():
        if id_hyg == id_db:
            continue
        r_h = client.table("stellar_systems").select("id").eq("id", id_hyg).execute()
        r_d = client.table("stellar_systems").select("id").eq("id", id_db).execute()
        if r_h.data and r_d.data:
            dupes.append((id_hyg, id_db))
    if dupes:
        print("\n=== ⚠ Doublons détectés (id_hyg à supprimer) ===")
        for h, d in dupes:
            print(f"  {h} et {d} coexistent → supprimer {h}")


if __name__ == "__main__":
    main()
