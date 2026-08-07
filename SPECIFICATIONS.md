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

## Non-goals (v0.1)

OAuth2 UI, SSE, pipeline/DAG screens, theme packs.
