# JEV / Decision Pipeline, Go variant. Run targets from this directory (go/).
GO ?= go

.PHONY: generate test check-assets

# Copies ../shared into internal/assets/shared (go:embed cannot reach the parent directory).
generate:
	$(GO) generate ./...

test:
	$(GO) vet ./...
	$(GO) test ./...

# Fails if the copy differs from ../shared. Writes nothing.
check-assets:
	cd internal/assets && $(GO) run ./gen -check

# Later milestones: run (desktop), wasm (js/wasm build), serve (web/ on localhost), e2e (Playwright on the wasm build).
