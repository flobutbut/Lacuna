"""
Vérifie les doublons stellar_systems dus au LACUNA_ID_MAP.
Pour chaque paire (id_hyg, id_db), si les DEUX existent en base → doublon.
À supprimer : l'id HYG. À garder : l'id LACUNA (id_db).
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent pour les imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supabase_client import get_supabase_client
from upsert_systems import LACUNA_ID_MAP


def main() -> None:
    client = get_supabase_client()

    # Récupérer tous les ids présents dans stellar_systems
    resp = client.table("stellar_systems").select("id").execute()
    db_ids = {row["id"] for row in (resp.data or [])}

    print("=== Paires (id_hyg, id_db) du LACUNA_ID_MAP ===\n")
    for id_hyg, id_db in sorted(LACUNA_ID_MAP.items(), key=lambda x: (x[1], x[0])):
        exists_hyg = id_hyg in db_ids
        exists_db = id_db in db_ids
        is_duplicate = exists_hyg and exists_db
        status = "🔴 DOUBLON" if is_duplicate else "✅"
        print(f"  {id_hyg!r:25} → {id_db!r:20} | HYG:{exists_hyg} DB:{exists_db} {status}")

    # Lister les doublons : id_hyg à supprimer (garder id_db LACUNA)
    duplicates_to_delete = []
    for id_hyg, id_db in LACUNA_ID_MAP.items():
        if id_hyg in db_ids and id_db in db_ids and id_hyg != id_db:
            duplicates_to_delete.append(id_hyg)

    print("\n=== Doublons à supprimer (id HYG → garder id LACUNA) ===\n")
    if not duplicates_to_delete:
        print("  Aucun doublon détecté.")
    else:
        for id_hyg in sorted(duplicates_to_delete):
            id_db = LACUNA_ID_MAP[id_hyg]
            print(f"  SUPPRIMER: {id_hyg!r}  (garder {id_db!r})")


if __name__ == "__main__":
    main()
