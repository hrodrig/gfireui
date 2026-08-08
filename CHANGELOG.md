# Changelog

All notable changes to **gfireui** are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Ops polish: configurable console title (`PUBLIC_GFIREUI_CONSOLE_TITLE`), GFire state filter rail, Attention view (Failed + Dead), structured job detail + timeline, typed servers table, footer with gfire/gfireui/gfireui-backend versions and repo links.
- Design note: [ops polish](./docs/superpowers/specs/2026-08-08-gfireui-ops-polish.md).

### Changed

- Console favicon/icons use gfire.net brand mark (SVG, ICO, PNG, apple-touch) instead of the default Svelte logo.
- Release quality: `make release-check` runs `npm audit --audit-level=high` then check/cover/build; tag workflow calls Make before GHCR push (fail-closed family contract).
- Ops charts use canonical GFire state names (Enqueued/Processing/…).

## [0.1.1] - 2026-08-08

### Fixed

- GHCR release image is multi-arch (`linux/amd64` + `linux/arm64`). `v0.1.0` was amd64-only; Apple Silicon / arm64 hosts could not pull a matching platform (often surfaced as pull denied / no matching manifest).

### Added

- [SECURITY.md](./SECURITY.md) — vulnerability reporting via GitHub Security Advisories (aligned with sibling projects).

### Security

- Force `cookie@0.7.2` via npm `overrides` (CVE-2024-47764 / GHSA-pxg6-pf52-xh8x; transitive from `@sveltejs/kit`).

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

[Unreleased]: https://github.com/hrodrig/gfireui/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/hrodrig/gfireui/releases/tag/v0.1.1
[0.1.0]: https://github.com/hrodrig/gfireui/releases/tag/v0.1.0
