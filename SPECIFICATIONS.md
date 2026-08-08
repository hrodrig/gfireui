# GFireUI — Specifications (v0.1)

Behavior contract for the SvelteKit ops console. Design: [platform design](./docs/superpowers/specs/2026-08-06-gfireui-platform-design.md).

## Role

Browser SPA that talks **only** to [gfireui-backend](https://github.com/hrodrig/gfireui-backend). Never calls GFire directly. UI role checks hide controls; backend RBAC is authoritative.

## Stack

- SvelteKit + TypeScript, Svelte 5
- `@sveltejs/adapter-static` with `fallback: 'index.html'` (CSR SPA)
- `PUBLIC_GFIREUI_API_BASE` — backend origin (no trailing slash)
- Theme: `data-theme` light/dark, localStorage `gfireui-theme`
- Session JWT: memory + localStorage `gfireui-token`; hydrate via `GET /api/auth/me`

## Routes

| Path | Who | Notes |
| ---- | --- | ----- |
| `/login` | public | email/password → JWT |
| `/` | auth | redirects to `/jobs` |
| `/jobs`, `/jobs/[id]` | Admin, Operator, Auditor | Guest sees limited welcome |
| `/queues`, `/recurring`, `/servers` | Admin, Operator, Auditor | via `/api/gfire/*` |
| `/users` | Administrator | create / enable toggle |
| `/audit` | Administrator, Auditor | paginated feed |

## Charts

`OpsCharts` polls `GET /api/ops/summary` every 3s while mounted (uPlot). No SSE/WebSocket in v0.1.

## Quality gate

- Unit tests: Vitest, colocated `src/**/*.test.ts`
- Coverage: `make cover` / `npm run cover` — **≥ 80% statements and lines** on `src/lib` business logic (`vitest.config.ts` thresholds). Fail-closed in CI.
- Design: [OCI / CI / quality](./docs/superpowers/specs/2026-08-08-gfireui-oci-ci-quality-design.md)

## OCI image

- Image: `ghcr.io/hrodrig/gfireui:v<semver>` (local: `gfireui:<VERSION>`)
- Runtime: `nginxinc/nginx-unprivileged` Bookworm, listen **8080**, non-root
- Build-arg / env: `PUBLIC_GFIREUI_API_BASE` (baked at build; no trailing slash)
- Release tags: syft SBOM + cosign keyless (mirror gfire); see `.github/workflows/release.yml`

## Non-goals (v0.1)

OAuth2 UI, SSE, pipeline/DAG screens, theme packs.
