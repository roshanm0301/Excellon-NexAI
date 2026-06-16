#!/usr/bin/env bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$REPO/.test-backend.pid"
LOG_FILE="$REPO/.test-server.log"

echo "[test-infra] starting postgres..."
docker compose -f "$REPO/docker-compose.yml" up -d postgres

echo "[test-infra] waiting for postgres to be healthy..."
ATTEMPTS=0
until docker compose -f "$REPO/docker-compose.yml" exec -T postgres pg_isready -U nexai -d nexai -q 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge 30 ]; then echo "[test-infra] postgres failed to start" && exit 1; fi
  sleep 2
done
echo "[test-infra] postgres ready"

echo "[test-infra] running migrations..."
docker compose -f "$REPO/docker-compose.yml" run --rm migrate
echo "[test-infra] migrations done"

# Apply seeds if they exist
if [ -f "$REPO/db/seeds/test_entities.sql" ]; then
  echo "[test-infra] applying entity seeds..."
  docker compose -f "$REPO/docker-compose.yml" exec -T postgres \
    psql -U nexai -d nexai < "$REPO/db/seeds/test_entities.sql"
fi
if [ -f "$REPO/db/seeds/test_views.sql" ]; then
  echo "[test-infra] applying view seeds..."
  docker compose -f "$REPO/docker-compose.yml" exec -T postgres \
    psql -U nexai -d nexai < "$REPO/db/seeds/test_views.sql"
fi

# Check if server is already running on port 9080
if curl -s http://localhost:9080/health > /dev/null 2>&1; then
  echo "[test-infra] Go server already running on :9080"
  exit 0
fi

echo "[test-infra] building Go server..."
cd "$REPO/src/go"
/usr/local/go/bin/go build -o "$REPO/.test-server" ./cmd/server/
echo "[test-infra] Go build complete"

echo "[test-infra] starting Go server on :9080..."
PORT=9080 \
DATABASE_URL="postgres://nexai:nexai@localhost:5433/nexai?sslmode=disable" \
NEXAI_AUTH_MODE=local \
NEXAI_STUDIO_PLUGINS_ENABLED=false \
NEXAI_AI_FEATURES_ENABLED=false \
LOG_LEVEL=warn \
"$REPO/.test-server" > "$LOG_FILE" 2>&1 &

echo $! > "$PID_FILE"
echo "[test-infra] Go server PID: $(cat $PID_FILE)"

# Wait for health endpoint
ATTEMPTS=0
until curl -s http://localhost:9080/health > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge 30 ]; then
    echo "[test-infra] Go server failed to start. Log:"
    cat "$LOG_FILE"
    exit 1
  fi
  sleep 2
done
echo "[test-infra] Go server healthy at :9080"
