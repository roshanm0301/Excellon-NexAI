.PHONY: dev build test migrate-up migrate-down lint clean

DATABASE_URL ?= postgres://nexai:nexai@localhost:5432/nexai?sslmode=disable

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
