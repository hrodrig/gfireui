# GFireUI OCI / CI / Quality Implementation Plan

> **For agentic workers:** Execute task-by-task. Commits require user-approved messages.

**Goal:** nginx-unprivileged Bookworm image (:8080), Vitest coverage ≥80%, CI + GHCR release with syft SBOM + cosign keyless (mirror gfire).

**Spec:** [../specs/2026-08-08-gfireui-oci-ci-quality-design.md](../specs/2026-08-08-gfireui-oci-ci-quality-design.md)

**Tech:** SvelteKit static, Vitest + coverage-v8, Docker multi-stage, GitHub Actions.

## Global Constraints

- English artifacts; work on `develop`
- `COVER_MIN_PERCENT ?= 80` fail-closed
- Runtime: `nginxinc/nginx-unprivileged:*-bookworm`, listen 8080, non-root
- Release: `id-token: write`, syft, cosign keyless
- No commit without approved message

## Tasks

1. **U-031** — coverage tooling + tests to ≥80% + `make cover`
2. **U-030** — Dockerfile + nginx conf + `make docker-build`
3. **U-034** — `make release-check` + docker-smoke
4. **U-032/U-033/U-035** — `ci.yml` + `release.yml` (GHCR, syft, cosign)
5. **Docs** — SPEC, README, ROADMAP status, CHANGELOG

---

Execute inline in this session; propose commits at natural breakpoints.
