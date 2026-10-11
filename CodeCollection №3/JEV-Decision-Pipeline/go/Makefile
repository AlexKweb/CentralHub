# JEV / Decision Pipeline, Go variant. Run targets from this directory (go/).
GO ?= go

WASM_EXEC := $(shell $(GO) env GOROOT)/lib/wasm/wasm_exec.js

.PHONY: generate test check-assets wasm serve build e2e

# Copies ../shared into internal/assets/shared (go:embed cannot reach the parent directory).
generate:
	$(GO) generate ./...

test:
	$(GO) vet ./...
	$(GO) test ./...

# Fails if the copy differs from ../shared. Writes nothing.
check-assets:
	cd internal/assets && $(GO) run ./gen -check

# Browser build: web/main.wasm plus the matching wasm_exec.js from GOROOT (both gitignored).
wasm:
	GOOS=js GOARCH=wasm $(GO) build -o web/main.wasm ./cmd/jev
	cp "$(WASM_EXEC)" web/wasm_exec.js

# Static server for web/ on localhost (-addr, default :8090).
serve:
	$(GO) run ./cmd/serve

# Desktop binary into bin/.
build:
	mkdir -p bin
	$(GO) build -o bin/jev ./cmd/jev

# Playwright suite against the wasm build; browsers are preinstalled, so no `playwright install`.
e2e:
	cd e2e && pnpm install --frozen-lockfile && pnpm exec playwright test
