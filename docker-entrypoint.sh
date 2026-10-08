#!/bin/sh
set -e

# Default environment variables
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export POSTGRES_DB="${POSTGRES_DB:-vivabooth}"

# Determine whether to run embedded PostgreSQL
# If EMBED_DB is explicitly set, follow it. Otherwise, if DATABASE_URL is missing
# or points to localhost/127.0.0.1, enable embedded PostgreSQL.
if [ -n "$EMBED_DB" ]; then
  if [ "$EMBED_DB" = "true" ] || [ "$EMBED_DB" = "1" ]; then
    START_EMBEDDED_DB=true
  else
    START_EMBEDDED_DB=false
  fi
elif [ -z "$DATABASE_URL" ] || echo "$DATABASE_URL" | grep -qE "localhost|127\.0\.0\.1"; then
  START_EMBEDDED_DB=true
else
  START_EMBEDDED_DB=false
fi

if [ "$START_EMBEDDED_DB" = "true" ]; then
  echo "=> [Docker Entrypoint] Embedded PostgreSQL is ENABLED."
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?schema=public"
  export DIRECT_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?schema=public"

  PGDATA="${PGDATA:-/var/lib/postgresql/data}"
  PGRUN="/run/postgresql"

  mkdir -p "$PGDATA" "$PGRUN"
  chown -R postgres:postgres "$PGDATA" "$PGRUN"
  chmod 0700 "$PGDATA"
  chmod 0755 "$PGRUN"

  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "=> [Docker Entrypoint] Initializing PostgreSQL cluster in $PGDATA..."
    su-exec postgres initdb -D "$PGDATA" -E UTF8 --auth-local=trust --auth-host=scram-sha-256

    echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
    echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
    echo "host all all ::1/128 trust" >> "$PGDATA/pg_hba.conf"
    echo "host all all 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"
  fi

  echo "=> [Docker Entrypoint] Starting embedded PostgreSQL server..."
  su-exec postgres pg_ctl -D "$PGDATA" -l /var/lib/postgresql/pg.log -w start

  echo "=> [Docker Entrypoint] Configuring database '${POSTGRES_DB}'..."
  su-exec postgres psql -v ON_ERROR_STOP=0 -c "CREATE USER ${POSTGRES_USER} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD}';" 2>/dev/null || true
  su-exec postgres psql -v ON_ERROR_STOP=0 -c "ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';" 2>/dev/null || true
  su-exec postgres psql -v ON_ERROR_STOP=0 -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};" 2>/dev/null || true
  su-exec postgres psql -v ON_ERROR_STOP=0 -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};" 2>/dev/null || true
  echo "=> [Docker Entrypoint] Embedded PostgreSQL is online and ready."
else
  echo "=> [Docker Entrypoint] Embedded PostgreSQL is DISABLED. Using external database."
  # If connecting to an external DB host, wait for it to be reachable
  if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:/]+).*/\1/')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\/.*/\1/')
    [ "$DB_PORT" = "$DATABASE_URL" ] && DB_PORT=5432

    if [ -n "$DB_HOST" ] && [ "$DB_HOST" != "$DATABASE_URL" ]; then
      echo "=> [Docker Entrypoint] Waiting for database at ${DB_HOST}:${DB_PORT}..."
      RETRIES=30
      while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -q 2>/dev/null; do
        RETRIES=$((RETRIES - 1))
        if [ "$RETRIES" -le 0 ]; then
          echo "=> [Docker Entrypoint] Warning: Database at ${DB_HOST}:${DB_PORT} not ready yet. Continuing..."
          break
        fi
        sleep 1
      done
      echo "=> [Docker Entrypoint] Database at ${DB_HOST}:${DB_PORT} is reachable."
    fi
  fi
fi

# Synchronize database schema with Prisma
echo "=> [Docker Entrypoint] Synchronizing Prisma schema with database..."
if prisma db push --schema=./prisma/schema.prisma --skip-generate; then
  echo "=> [Docker Entrypoint] Database schema synchronized successfully."
else
  echo "=> [Docker Entrypoint] Warning: prisma db push returned non-zero code. Continuing with app boot."
fi

# Trap signals for graceful shutdown
cleanup() {
  echo "=> [Docker Entrypoint] Received termination signal. Shutting down gracefully..."
  if [ "$START_EMBEDDED_DB" = "true" ]; then
    echo "=> [Docker Entrypoint] Stopping PostgreSQL daemon..."
    su-exec postgres pg_ctl -D "${PGDATA:-/var/lib/postgresql/data}" stop -m fast || true
  fi
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "=> [Docker Entrypoint] Starting Next.js application on port ${PORT}..."
su-exec nextjs node server.js &
NODE_PID=$!

wait $NODE_PID
