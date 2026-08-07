# gfireui — SPA + local stack using a pre-cooked gfireui-backend image

BACKEND_IMAGE ?= gfireui-backend:0.1.0
COMPOSE_MIGRATIONS := .compose/migrations

check-docker = @docker info >/dev/null 2>&1 || { echo "Error: Docker is not running. Start Docker and try again."; exit 1; }

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

.DEFAULT_GOAL := help

.PHONY: help install check test build ensure-backend-image extract-migrations compose-up compose-down

help:
	@echo "$(GREEN)gfireui$(RESET) — GFire ops console (SvelteKit)"
	@echo ""
	@echo "$(YELLOW)App:$(RESET)"
	@echo "  $(GREEN)install$(RESET)         npm install"
	@echo "  $(GREEN)check$(RESET)           svelte-check"
	@echo "  $(GREEN)test$(RESET)            vitest"
	@echo "  $(GREEN)build$(RESET)           static production build"
	@echo ""
	@echo "$(YELLOW)Docker (standalone — no sibling checkout):$(RESET)"
	@echo "  $(GREEN)compose-up$(RESET)      postgres + $(BACKEND_IMAGE) + Vite UI"
	@echo "  $(GREEN)compose-down$(RESET)    stop stack"
	@echo ""
	@echo "Requires local image $(BACKEND_IMAGE) (build/pull elsewhere)."
	@echo "Override: make compose-up BACKEND_IMAGE=gfireui-backend:0.1.0"
	@echo "Login: admin@example.com / adminadmin"
	@echo "Ports: UI :5173  API :8090  Postgres :5433"

install:
	npm install

check:
	npm run check

test:
	npm test

build:
	npm run build

ensure-backend-image:
	$(check-docker)
	@docker image inspect $(BACKEND_IMAGE) >/dev/null 2>&1 || { \
		echo "Missing local image $(BACKEND_IMAGE)."; \
		echo "Build it from gfireui-backend (make docker-build) or pull when published."; \
		echo "Then: make compose-up BACKEND_IMAGE=$(BACKEND_IMAGE)"; \
		exit 1; \
	}

# Migrations ship inside the BFF image at /app/migrations (distroless — extract to host).
extract-migrations: ensure-backend-image
	@mkdir -p $(COMPOSE_MIGRATIONS)
	@cid=$$(docker create $(BACKEND_IMAGE)) && \
		docker cp "$$cid:/app/migrations/." "$(COMPOSE_MIGRATIONS)/" && \
		docker rm -f "$$cid" >/dev/null
	@test -n "$$(ls -A $(COMPOSE_MIGRATIONS) 2>/dev/null)" || { \
		echo "Error: $(BACKEND_IMAGE) has no /app/migrations"; \
		exit 1; \
	}

compose-up: extract-migrations
	GFIREUI_BACKEND_IMAGE=$(BACKEND_IMAGE) docker compose up -d
	@echo ""
	@echo "UI  http://127.0.0.1:5173"
	@echo "API http://127.0.0.1:8090/healthz"
	@echo "Login admin@example.com / adminadmin"

compose-down:
	docker compose down
