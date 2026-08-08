# Changelog

All notable changes to **gfireui** are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- [SECURITY.md](./SECURITY.md) — vulnerability reporting via GitHub Security Advisories (aligned with sibling projects).

## [0.1.0] - 2026-08-08

### Added

- SvelteKit SPA ops console (login, role-aware nav, jobs/queues/recurring/servers, users, audit, polled ops charts).
- Vitest suite with **≥ 80%** statement/line coverage gate on `src/lib` (`make cover`).
- Production OCI image: multi-stage build, **nginxinc/nginx-unprivileged** Bookworm, listen **8080**, security headers.
- `make docker-build`, `make docker-smoke`, `make release-check`.
- GitHub Actions CI (check, cover, build, docker build) and release workflow: GHCR `ghcr.io/hrodrig/gfireui`, syft SBOM, cosign keyless.
- Local Compose stack for UI + sibling BFF image (`make compose-up`).

### Notes

- Pair with [gfireui-backend](https://github.com/hrodrig/gfireui-backend) and [gfire](https://github.com/hrodrig/gfire). Deploy via [gfire-selfhosted](https://github.com/hrodrig/gfire-selfhosted) console stack when BFF image is published.
- Bake `PUBLIC_GFIREUI_API_BASE` at image build time for the target BFF URL.

[Unreleased]: https://github.com/hrodrig/gfireui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hrodrig/gfireui/releases/tag/v0.1.0
