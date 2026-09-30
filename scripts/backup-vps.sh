#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${FINLY_APP_DIR:-/opt/docker/finly}"
readonly BACKUP_ROOT="${FINLY_BACKUP_ROOT:-/opt/backups/finly}"
readonly RETENTION_DAYS="${FINLY_BACKUP_RETENTION_DAYS:-14}"
readonly TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ ! "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || (( RETENTION_DAYS < 1 )); then
  printf 'FINLY_BACKUP_RETENTION_DAYS deve ser um inteiro positivo.\n' >&2
  exit 2
fi

install -d -m 700 "$BACKUP_ROOT"
resolved_root="$(readlink -f "$BACKUP_ROOT")"
case "$resolved_root" in
  /opt/backups/finly|/opt/backups/finly/*) ;;
  *)
    printf 'Diretório de backup recusado por segurança: %s\n' "$resolved_root" >&2
    exit 2
    ;;
esac

partial_dir="$resolved_root/.partial-${TIMESTAMP}-$$"
snapshot_dir="$resolved_root/$TIMESTAMP"

cleanup_partial() {
  if [[ -d "$partial_dir" ]]; then
    rm -rf -- "$partial_dir"
  fi
}
trap cleanup_partial EXIT

if [[ -e "$snapshot_dir" ]]; then
  printf 'Snapshot já existe: %s\n' "$snapshot_dir" >&2
  exit 1
fi

install -d -m 700 "$partial_dir"

docker inspect supabase-db >/dev/null
docker exec -u postgres supabase-db \
  pg_dump --username=supabase_admin --format=custom --compress=9 --dbname=postgres \
  > "$partial_dir/postgres.dump"

if [[ ! -d "$APP_DIR/server/data" ]]; then
  printf 'Diretório de dados não encontrado: %s/server/data\n' "$APP_DIR" >&2
  exit 1
fi

tar --numeric-owner -C "$APP_DIR" -czf "$partial_dir/server-data.tar.gz" server/data

(
  cd "$partial_dir"
  sha256sum postgres.dump server-data.tar.gz > SHA256SUMS
)

cat > "$partial_dir/metadata.txt" <<EOF
created_at=$TIMESTAMP
hostname=$(hostname)
postgres_container=supabase-db
finly_image=$(docker inspect finly-app --format '{{.Image}}' 2>/dev/null || printf 'unavailable')
EOF

chmod 600 "$partial_dir"/*
mv -- "$partial_dir" "$snapshot_dir"
ln -sfn "$TIMESTAMP" "$resolved_root/latest"
trap - EXIT

while IFS= read -r -d '' old_snapshot; do
  case "$old_snapshot" in
    "$resolved_root"/20??????T??????Z) rm -rf -- "$old_snapshot" ;;
    *) printf 'Snapshot antigo ignorado por segurança: %s\n' "$old_snapshot" >&2 ;;
  esac
done < <(find "$resolved_root" -mindepth 1 -maxdepth 1 -type d -name '20??????T??????Z' -mtime "+$RETENTION_DAYS" -print0)

printf 'Backup Finly concluído: %s\n' "$snapshot_dir"
