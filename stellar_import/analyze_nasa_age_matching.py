#!/usr/bin/env python3
"""
Croise hostnames NASA non matchés (nasa_age_patch_unmatched.log) avec
system_objects data_source=NASA dont le stellar_systems parent n'a pas d'âge.

Affiche stellar_systems.id, name, et le hostname NASA le plus proche.
Objectif : comprendre les échecs de matching et corriger nasa_age_patch.py.
"""
import re
from pathlib import Path

from supabase_client import get_supabase_client

ROOT = Path(__file__).resolve().parent.parent
UNMATCHED_LOG = ROOT / "nasa_age_patch_unmatched.log"


def _normalize_for_fuzzy(s: str) -> str:
    """Normalise pour comparaison floue."""
    if not s:
        return ""
    s = str(s).strip().lower()
    s = re.sub(r"[^\w\s-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _fuzzy_score(a: str, b: str) -> float:
    """Score de similarité 0-1 (Jaccard sur mots + bonus substring)."""
    na = _normalize_for_fuzzy(a)
    nb = _normalize_for_fuzzy(b)
    if not na or not nb:
        return 0.0
    wa, wb = set(na.split()), set(nb.split())
    if na in nb or nb in na:
        return 0.9
    if wa & wb:
        inter = len(wa & wb)
        union = len(wa | wb)
        return inter / union if union else 0
    # Comparaison caractère par caractère pour noms courts
    from difflib import SequenceMatcher
    return SequenceMatcher(None, na, nb).ratio()


def _best_hostname_match(system_name: str, system_id: str, hostnames: list[str]) -> tuple[str, float]:
    """Trouve le hostname NASA le plus proche."""
    best = ("", 0.0)
    for hn in hostnames:
        score = max(
            _fuzzy_score(system_name, hn),
            _fuzzy_score(system_id, hn),
            _fuzzy_score(_normalize_for_fuzzy(system_id).replace("-", " "), hn),
        )
        if score > best[1]:
            best = (hn, score)
    return best


def main():
    # Charger hostnames non matchés
    if not UNMATCHED_LOG.exists():
        print(f"Fichier absent : {UNMATCHED_LOG}")
        return
    with open(UNMATCHED_LOG, encoding="utf-8") as f:
        unmatched_hostnames = [line.strip() for line in f if line.strip()]

    # Systèmes NASA en base dont le parent n'a pas d'âge
    client = get_supabase_client()
    obj_resp = client.table("system_objects").select("system_id").eq("data_source", "NASA").execute()
    system_ids = list({r["system_id"] for r in (obj_resp.data or [])})
    if not system_ids:
        print("Aucun system_object NASA en base.")
        return

    # Charger stellar_systems pour ces ids (par lots de 100)
    systems_without_age = []
    for i in range(0, len(system_ids), 100):
        batch = system_ids[i : i + 100]
        r = client.table("stellar_systems").select("id,name,age").in_("id", batch).execute()
        for row in r.data or []:
            if row.get("age") is None:
                systems_without_age.append(row)

    print(f"Systèmes NASA (data_source) sans âge : {len(systems_without_age)}")
    print(f"Hostnames non matchés : {len(unmatched_hostnames)}\n")
    print(f"{'stellar_systems.id':<30} {'stellar_systems.name':<35} {'hostname NASA (score)':<40}")
    print("-" * 110)

    for sys in sorted(systems_without_age, key=lambda x: (x.get("name") or "")):
        sid = sys.get("id", "")
        sname = sys.get("name", "")
        best_hn, score = _best_hostname_match(sname or sid, sid, unmatched_hostnames)
        score_str = f"({score:.2f})" if best_hn else ""
        print(f"{sid:<30} {(sname or '')[:34]:<35} {best_hn[:39]:<40} {score_str}")


if __name__ == "__main__":
    main()
