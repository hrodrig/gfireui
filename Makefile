# gfireui — local SPA + sibling BFF image workflow

BACKEND_DIR ?= ../gfireui-backend
BACKEND_VERSION := $(shell cat $(BACKEND_DIR)/VERSION 2>/dev/null | tr -d ' \n\r')
ifeq ($(strip $(BACKEND_VERSION)),)
  BACKEND_VERSION := 0.1.0
endif
BACKEND_IMAGE := gfireui-backend:$(BACKEND_VERSION)

check-docker = @docker info >/dev/null 2>&1 || { echo "Error: Docker is not running. Start Docker and try again."; exit 1; }

GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

.DEFAULT_GOAL := help

.PHONY: help install check test build compose-up compose-down backend-image

help:
	@echo "$(GREEN)gfireui$(RESET) — GFire ops console (SvelteKit)"
	@echo ""
	@echo "$(YELLOW)App:$(RESET)"
	@echo "  $(GREEN)install$(RESET)         npm install"
	@echo "  $(GREEN)check$(RESET)           svelte-check"
	@echo "  $(GREEN)test$(RESET)            vitest"
	@echo "  $(GREEN)build$(RESET)           static production build"
	@echo ""
	@echo "$(YELLOW)Docker:$(RESET)"
	@echo "  $(GREEN)backend-image$(RESET)   make docker-build in $(BACKEND_DIR) → $(BACKEND_IMAGE)"
	@echo "  $(GREEN)compose-up$(RESET)      cook backend image, then full stack (UI :5173, API :8090)"
	@echo "  $(GREEN)compose-down$(RESET)    stop stack"
	@echo ""
	@echo "Backend image: $(BACKEND_IMAGE)"
	@echo "Login (compose defaults): admin@example.com / adminadmin"

install:
	npm install

check:
	npm run check

test:
	npm test

build:
	npm run build

backend-image:
	$(check-docker)
	@test -d "$(BACKEND_DIR)" || { echo "Error: BACKEND_DIR not found: $(BACKEND_DIR)"; exit 1; }
	$(MAKE) -C "$(BACKEND_DIR)" docker-build

compose-up: backend-image
	GFIREUI_BACKEND_IMAGE=$(BACKEND_IMAGE) \
	GFIREUI_BACKEND_DIR=$(BACKEND_DIR) \
		docker compose up -d
	@echo ""
	@echo "UI  http://127.0.0.1:5173"
	@echo "API http://127.0.0.1:8090/healthz"
	@echo "Login admin@example.com / adminadmin"

compose-down:
	docker compose down
