#!/usr/bin/env bash
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$REPO/.test-backend.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[test-infra] stopping Go server (PID $PID)..."
    kill "$PID"
    sleep 1
  fi
  rm -f "$PID_FILE"
  echo "[test-infra] Go server stopped"
fi

if [ "${TEARDOWN_POSTGRES:-false}" = "true" ]; then
  echo "[test-infra] stopping postgres..."
  docker compose -f "$REPO/docker-compose.yml" stop postgres
fi
