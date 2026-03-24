#!/usr/bin/env bash
# pg_dump des tables critiques LACUNA → repo
# Usage: ./scripts/pg_dump_critiques.sh  ou  yarn dump:critiques
# Requiert: SUPABASE_DB_URL dans .env
# Sortie: supabase/dumps_critiques/dump_critiques_YYYYMMDD.sql (versionné)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DUMP_DIR="$PROJECT_ROOT/supabase/dumps_critiques"
DATE=$(date +%Y%m%d)
OUTPUT_FILE="$DUMP_DIR/dump_critiques_${DATE}.sql"

# Tables critiques (données de référence / import stellaires)
TABLES=(
  stellar_systems
  system_objects
  constellations
  constellation_lines
  traces
)

mkdir -p "$DUMP_DIR"

if [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ SUPABASE_DB_URL requis dans .env"
  echo "   Format: postgresql://postgres:[PASSWORD]@db.utdzobspxeecxauwnkve.supabase.co:5432/postgres"
  echo "   Dashboard Supabase → Project Settings → Database"
  exit 1
fi

if ! command -v pg_dump &>/dev/null; then
  echo "❌ pg_dump non trouvé. Installer PostgreSQL client (brew install libpq ou postgresql)"
  exit 1
fi

echo "📦 pg_dump tables critiques → $OUTPUT_FILE"
echo "   Tables: ${TABLES[*]}"

TABLE_ARGS=""
for t in "${TABLES[@]}"; do
  TABLE_ARGS="$TABLE_ARGS -t public.$t"
done

pg_dump "$SUPABASE_DB_URL" \
  --no-owner \
  --no-privileges \
  $TABLE_ARGS \
  -f "$OUTPUT_FILE"

echo "✅ Dump terminé : $OUTPUT_FILE"
ls -lh "$OUTPUT_FILE"
echo ""
echo "Committer avec: git add supabase/dumps_critiques/ && git commit -m 'chore: dump tables critiques'"
