# gfireui — SPA + local stack + OCI quality gates

BACKEND_IMAGE ?= gfireui-backend:0.1.0
COMPOSE_MIGRATIONS := .compose/migrations
VERSION := $(shell cat VERSION 2>/dev/null | tr -d '[:space:]')
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
BUILDDATE ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
IMAGE ?= gfireui:$(VERSION)
PUBLIC_GFIREUI_API_BASE ?= http://127.0.0.1:8090
COVER_MIN_PERCENT ?= 80

check-docker = @docker info >/dev/null 2>&1 || { echo "Error: Docker is not running. Start Docker and try again."; exit 1; }

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

.DEFAULT_GOAL := help

.PHONY: help install check test cover build docker-build docker-smoke release-check \
	ensure-backend-image extract-migrations compose-up compose-down

help:
	@echo "$(GREEN)gfireui$(RESET) — GFire ops console (SvelteKit)"
	@echo ""
	@echo "$(YELLOW)App:$(RESET)"
	@echo "  $(GREEN)install$(RESET)         npm install"
	@echo "  $(GREEN)check$(RESET)           svelte-check"
	@echo "  $(GREEN)test$(RESET)            vitest"
	@echo "  $(GREEN)cover$(RESET)           vitest coverage; fail if statements < $(COVER_MIN_PERCENT)%"
	@echo "  $(GREEN)build$(RESET)           static production build"
	@echo ""
	@echo "$(YELLOW)OCI:$(RESET)"
	@echo "  $(GREEN)docker-build$(RESET)    multi-stage image → $(IMAGE) (nginx-unprivileged :8080)"
	@echo "  $(GREEN)docker-smoke$(RESET)    run image briefly; curl /"
	@echo "  $(GREEN)release-check$(RESET)   npm audit + check + cover + build (+ docker-build if Docker up)"
	@echo ""
	@echo "$(YELLOW)Docker (standalone — no sibling checkout):$(RESET)"
	@echo "  $(GREEN)compose-up$(RESET)      postgres + $(BACKEND_IMAGE) + Vite UI"
	@echo "  $(GREEN)compose-down$(RESET)    stop stack"
	@echo ""
	@echo "Override: PUBLIC_GFIREUI_API_BASE=... make docker-build"
	@echo "Login (compose): admin@example.com / adminadmin"

install:
	npm ci

check:
	npm run check

test:
	npm test

cover:
	@npm run cover
	@echo "cover: Vitest thresholds enforce ≥$(COVER_MIN_PERCENT)% statements/lines (see vitest.config.ts)"

build:
	PUBLIC_GFIREUI_API_BASE=$(PUBLIC_GFIREUI_API_BASE) npm run build

docker-build: ## requires Docker
	$(check-docker)
	docker build \
		--build-arg PUBLIC_GFIREUI_API_BASE=$(PUBLIC_GFIREUI_API_BASE) \
		--build-arg VERSION=$(VERSION) \
		--build-arg REVISION=$(COMMIT) \
		--build-arg BUILDDATE=$(BUILDDATE) \
		-t $(IMAGE) \
		-t gfireui:latest \
		.

docker-smoke: docker-build
	$(check-docker)
	@cid=$$(docker run -d -p 18088:8080 $(IMAGE)) && \
		sleep 2 && \
		curl -sfS -o /dev/null -w "%{http_code}" http://127.0.0.1:18088/ | grep -q 200 && \
		curl -sfS -o /dev/null http://127.0.0.1:18088/login && \
		docker rm -f $$cid >/dev/null && \
		echo "docker-smoke: OK (HTTP 200 on / and /login)"

# Fail-closed pre-publish gate (SPA analog of Go make release-check).
# npm audit is the security bar (no gocyclo/govulncheck). Red gate → no GHCR.
release-check:
	@echo "release-check: npm audit (fail on high+)"
	npm audit --audit-level=high
	@$(MAKE) check
	@$(MAKE) cover
	@$(MAKE) build
	@if docker info >/dev/null 2>&1; then \
		$(MAKE) docker-build; \
	else \
		echo "release-check: Docker unavailable — skipped docker-build"; \
	fi
	@echo "release-check passed."

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
