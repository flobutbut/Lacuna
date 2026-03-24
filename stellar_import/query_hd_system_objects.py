#!/usr/bin/env python3
"""Exécute la requête system_objects pour les systèmes HD en conflit."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from supabase_client import get_supabase_client

HD_SYSTEMS = [
    "hd-3", "hd-5", "hd-17", "hd-21", "hd-28", "hd-41004",
    "hd-63", "hd-70", "hd-85", "hd-122", "hd-133131", "hd-156",
    "hd-199", "hd-200", "hd-222",
]

def main():
    sb = get_supabase_client()
    resp = (
        sb.table("system_objects")
        .select("system_id,designation,orbital_period_days,data_source,field_sources,created_at")
        .in_("system_id", HD_SYSTEMS)
        .order("system_id")
        .order("created_at")
        .limit(40)
        .execute()
    )
    print(json.dumps(resp.data or [], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
