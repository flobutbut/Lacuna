"""
Client Supabase pour l'import stellaires.
Utilise SUPABASE_SERVICE_ROLE_KEY en priorité (bypasse RLS pour INSERT/UPDATE).
Fallback : VITE_SUPABASE_ANON_KEY.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

# Charger .env depuis la racine du projet
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

def get_supabase_client() -> Client:
    url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    # Service role en priorité (bypasse RLS) — nécessaire pour l'import
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        raise RuntimeError(
            "[LACUNA] Supabase non configuré. Définir VITE_SUPABASE_URL et "
            "SUPABASE_SERVICE_ROLE_KEY (recommandé pour import) ou VITE_SUPABASE_ANON_KEY dans .env"
        )
    return create_client(url, key)
