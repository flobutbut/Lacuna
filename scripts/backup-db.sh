#!/usr/bin/env bash
# Sauvegarde de la base Supabase LACUNA
# Usage: ./scripts/backup-db.sh  ou  yarn backup:db
# Requiert: supabase link OU SUPABASE_DB_URL (voir .env.example)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$BACKUPS_DIR/dump_${TIMESTAMP}.sql"

mkdir -p "$BACKUPS_DIR"

# Charger .env si présent
if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

cd "$PROJECT_ROOT"

echo "📦 Sauvegarde base LACUNA → $OUTPUT_FILE"

if [ -n "$SUPABASE_DB_URL" ]; then
  # URL de connexion explicite (mot de passe percent-encodé si caractères spéciaux)
  npx supabase db dump --db-url "$SUPABASE_DB_URL" -f "$OUTPUT_FILE"
elif [ -f "supabase/.temp/project-ref" ]; then
  # Projet lié (supabase link)
  if [ -n "$SUPABASE_DB_PASSWORD" ]; then
    npx supabase db dump --linked -p "$SUPABASE_DB_PASSWORD" -f "$OUTPUT_FILE"
  else
    echo "⚠️  Mot de passe requis. Soit définir SUPABASE_DB_PASSWORD dans .env, soit le saisir à l'invite."
    npx supabase db dump --linked -f "$OUTPUT_FILE"
  fi
else
  echo "❌ Aucune configuration de sauvegarde trouvée."
  echo ""
  echo "Option 1 — Lier le projet :"
  echo "  npx supabase link --project-ref utdzobspxeecxauwnkve"
  echo ""
  echo "Option 2 — Définir SUPABASE_DB_URL dans .env :"
  echo "  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.utdzobspxeecxauwnkve.supabase.co:5432/postgres"
  echo "  (Récupérer le mot de passe : Dashboard Supabase → Project Settings → Database)"
  exit 1
fi

echo "✅ Sauvegarde terminée : $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"
