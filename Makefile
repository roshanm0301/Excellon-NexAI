.PHONY: dev build test migrate-up migrate-down lint clean db-setup db-seed test-unit test-integration test-e2e test-all test-backend-start test-backend-stop

DATABASE_URL ?= postgres://nexai:nexai@localhost:5432/nexai?sslmode=disable
TEST_DATABASE_URL = postgres://nexai:nexai@localhost:5433/nexai?sslmode=disable

dev:
	docker compose up --build

build:
	docker compose build

migrate-up:
	docker compose run --rm migrate -path=/migrations -database="$(DATABASE_URL)" up

migrate-down:
	docker compose run --rm migrate -path=/migrations -database="$(DATABASE_URL)" down 1

migrate-create:
	@read -p "Migration name: " name; \
	ts=$$(date +%Y%m%d%H%M%S); \
	touch db/migrations/$${ts}_$${name}.up.sql db/migrations/$${ts}_$${name}.down.sql; \
	echo "Created db/migrations/$${ts}_$${name}.up.sql and .down.sql"

test:
	cd src/go && go test ./...

lint:
	cd src/go && go vet ./...

clean:
	docker compose down -v
	rm -rf src/go/bin/

# ─── Database ─────────────────────────────────────────────────────────────────

db-setup:
	docker compose up -d postgres
	@until docker compose exec -T postgres pg_isready -U nexai -q 2>/dev/null; do sleep 2; done
	docker compose run --rm migrate

db-seed: db-setup
	@if [ -f db/seeds/test_entities.sql ]; then \
	  docker compose exec -T postgres psql -U nexai -d nexai < db/seeds/test_entities.sql; \
	fi
	@if [ -f db/seeds/test_views.sql ]; then \
	  docker compose exec -T postgres psql -U nexai -d nexai < db/seeds/test_views.sql; \
	fi

# ─── Test targets ─────────────────────────────────────────────────────────────

test-unit:
	cd src/go && /usr/local/go/bin/go test ./...
	cd src/react && npm run lint
	cd src/react && npm test -- --run
	cd src/react && npm run build

test-integration: db-setup db-seed
	cd src/go && DATABASE_URL="$(TEST_DATABASE_URL)" \
	  NEXAI_AUTH_MODE=local \
	  /usr/local/go/bin/go test -tags integration -v ./internal/viewstudio/...

test-e2e: test-backend-start
	cd src/react && npm run e2e:integration; \
	  STATUS=$$?; \
	  bash scripts/stop-test-backend.sh; \
	  exit $$STATUS

test-all: test-unit test-integration test-e2e

# ─── Backend lifecycle ─────────────────────────────────────────────────────────

test-backend-start:
	bash scripts/start-test-backend.sh

test-backend-stop:
	bash scripts/stop-test-backend.sh
