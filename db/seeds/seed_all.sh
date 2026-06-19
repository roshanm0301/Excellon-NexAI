#!/usr/bin/env bash
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SEEDS_DIR="$(dirname "$0")"

echo "Applying entity seeds..."
docker compose -f "$REPO/docker-compose.yml" exec -T postgres \
  psql -U nexai -d nexai < "$SEEDS_DIR/test_entities.sql"

echo "Applying view seeds..."
docker compose -f "$REPO/docker-compose.yml" exec -T postgres \
  psql -U nexai -d nexai < "$SEEDS_DIR/test_views.sql"

echo "Applying product data..."
docker compose -f "$REPO/docker-compose.yml" exec -T postgres \
  psql -U nexai -d nexai < "$SEEDS_DIR/test_product_data.sql"

echo "Seeds applied successfully."
