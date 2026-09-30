#!/usr/bin/env bash
set -Eeuo pipefail

readonly BACKUP_ROOT="${FINLY_BACKUP_ROOT:-/opt/backups/finly}"
readonly REQUESTED_SNAPSHOT="${1:-latest}"

resolved_root="$(readlink -f "$BACKUP_ROOT")"
if [[ "$REQUESTED_SNAPSHOT" = /* ]]; then
  snapshot_dir="$(readlink -f "$REQUESTED_SNAPSHOT")"
else
  snapshot_dir="$(readlink -f "$resolved_root/$REQUESTED_SNAPSHOT")"
fi

case "$snapshot_dir" in
  "$resolved_root"/20??????T??????Z) ;;
  *)
    printf 'Snapshot recusado por segurança: %s\n' "$snapshot_dir" >&2
    exit 2
    ;;
esac

for required_file in SHA256SUMS postgres.dump server-data.tar.gz; do
  if [[ ! -f "$snapshot_dir/$required_file" ]]; then
    printf 'Arquivo obrigatório ausente: %s\n' "$snapshot_dir/$required_file" >&2
    exit 1
  fi
done

(
  cd "$snapshot_dir"
  sha256sum --check SHA256SUMS
)

docker exec -i -u postgres supabase-db pg_restore --list < "$snapshot_dir/postgres.dump" >/dev/null
tar -tzf "$snapshot_dir/server-data.tar.gz" >/dev/null

restore_db="finly_restore_check_$(date -u +%Y%m%d%H%M%S)_$$"
if [[ ! "$restore_db" =~ ^finly_restore_check_[0-9]+_[0-9]+$ ]]; then
  printf 'Nome de banco temporário inválido.\n' >&2
  exit 2
fi

cleanup_database() {
  docker exec -u postgres supabase-db dropdb --username=supabase_admin --if-exists "$restore_db" >/dev/null 2>&1 || true
}
trap cleanup_database EXIT

docker exec -u postgres supabase-db createdb --username=supabase_admin --template=template0 "$restore_db"
docker exec -i -u postgres supabase-db \
  pg_restore --username=supabase_admin --exit-on-error --no-owner --no-privileges --dbname="$restore_db" \
  < "$snapshot_dir/postgres.dump"

table_count="$(docker exec -u postgres supabase-db psql --username=supabase_admin --tuples-only --no-align --dbname="$restore_db" --command="SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');")"
if [[ ! "$table_count" =~ ^[0-9]+$ ]] || (( table_count < 1 )); then
  printf 'Restauração temporária não contém tabelas de aplicação.\n' >&2
  exit 1
fi

cleanup_database
trap - EXIT
printf 'Backup verificado com restauração temporária (%s tabelas): %s\n' "$table_count" "$snapshot_dir"
