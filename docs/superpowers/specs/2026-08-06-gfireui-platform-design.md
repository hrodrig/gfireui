# GFireUI Platform Design

**Date:** 2026-08-06  
**Status:** Approved for planning  
**Repos:** `gfireui` (SvelteKit SPA) + `gfireui-backend` (Go BFF)  
**Depends on:** GFire v1.0.0 REST API (unchanged for v0.1)

This document is the design contract for the independent ops console. Implementation details land in each repo’s `SPECIFICATIONS.md` / ROADMAP after planning.

---

## 1. Goal

Ship a **self-hosted ops console** for GFire: jobs, queues, recurring jobs, servers, user administration, audit trail, and a live-feeling dashboard (charts). GFire stays **headless**; the console never embeds into the `gfire` binary.

**Approach:** Thin BFF — auth, RBAC, audit, and near 1:1 proxy to GFire’s public API.

---

## 2. Architecture

```
Browser (gfireui, SvelteKit SPA/CSR)
    │  JWT (user)
    ▼
gfireui-backend (Go BFF)
    │  users + audit in PostgreSQL (database gfireui)
    │  service Bearer → GFire
    ▼
gfire (headless job service)
```

| Piece | Responsibility |
| ----- | -------------- |
| `gfireui` | UI only; talks solely to `gfireui-backend` |
| `gfireui-backend` | Login/JWT, users, RBAC, audit log, thin GFire proxy, ops summary for charts |
| `gfire` | Job engine + REST; no UI users |

- Browser **never** calls GFire directly (no GFire URL/token in the client).
- Backend may serve the UI static build in production (optional).
- Proxy shape: `/api/gfire/*` → GFire `/v1/*` (and related ops routes as needed).
- Auth/users: `/api/auth/*`, `/api/users/*`, `/api/audit/*`.

---

## 3. Roles and permissions

Roles: `Administrator` | `Operator` | `Auditor` | `Guest`

| Action | Admin | Operator | Auditor | Guest |
| ------ | ----- | -------- | ------- | ----- |
| Login / own profile | ✓ | ✓ | ✓ | ✓ |
| List/view jobs, queues, recurring, servers | ✓ | ✓ | ✓ | ✗ |
| Enqueue / schedule / requeue / cancel / delete job | ✓ | ✓ | ✗ | ✗ |
| Recurring CRUD + trigger | ✓ | ✓ | ✗ | ✗ |
| User CRUD + role changes + enable/disable | ✓ | ✗ | ✗ | ✗ |
| Read audit log | ✓ | ✗ | ✓ | ✗ |
| View GFire connection config (URL masked) | ✓ | ✗ | ✗ | ✗ |

- **Guest:** account exists; console effectively locked pending access.
- **Auditor:** read-only ops + audit.
- **Operator:** day-to-day mutations; no user admin.
- **Administrator:** full UI surface.

**Enforcement:** backend middleware per route. UI hides controls; that is not security.

---

## 4. User model

Every user has:

| Field | Notes |
| ----- | ----- |
| `id` | UUIDv7 |
| `first_name` | required |
| `last_name` | required |
| `email` | unique; login identifier |
| `role` | one of the four roles |
| `enabled` | bool; disabled → no new tokens / 401–403 |
| `password_hash` | argon2id |
| `created_at`, `updated_at` | timestamps |

---

## 5. Authentication

### v0.1 — local accounts + JWT

- **JWT** access tokens (browser-first). Same model later for API clients.
- Claims include at least: `sub` (user id), `role`, `email`.
- Password hashing: **argon2id**.
- **Bootstrap:**  
  - Env first-boot: `GFIREUI_ADMIN_USER` / `GFIREUI_ADMIN_PASSWORD` (and name fields as needed) creates Administrator if DB empty.  
  - CLI: `gfireui-backend user create --role Administrator` (and related flags) for ongoing ops.
- Signing key and GFire service Bearer: **environment / config** of the backend only (not in UI DB in v0.1).

### Post-v0.1 — OAuth2 / OIDC

Add federated login beside local accounts (not a replacement of RBAC):

| Piece | Intent |
| ----- | ------ |
| **OAuth2 / OIDC** | Login via external IdP (authorization code + PKCE for the SPA) |
| **Token issuance** | Backend still mints **GFireUI JWTs** after IdP success (BFF remains source of roles) |
| **User link** | Map IdP `sub`/email → local `users` row (provision or invite flow — decide in planning) |
| **Roles** | Still Administrator / Operator / Auditor / Guest in `gfireui` DB; IdP groups optional later |
| **Audit** | Log IdP login success/failure with provider id |

v0.1 keeps password login only so the console ships without an IdP dependency. OAuth2 lands as an explicit ROADMAP band after auth/RBAC/audit are stable.

---

## 6. Audit log

Append-only `audit_events`:

| Field | Notes |
| ----- | ----- |
| `id` | UUIDv7 |
| `actor_user_id` | nullable (e.g. failed login) |
| `action` | stable string code |
| `resource_type` | e.g. `user`, `job`, `recurring` |
| `resource_id` | optional |
| `ip`, `user_agent` | optional |
| `payload` | JSONB metadata (no secrets/passwords) |
| `created_at` | timestamp |

**Minimum events:** login success/failure; user CRUD; enable/disable; role change; BFF-proxied mutations (enqueue, cancel, requeue, delete, recurring changes, etc.).

**Read access:** Administrator + Auditor only.

---

## 7. Storage

- **PostgreSQL** dedicated database `gfireui` (own DSN). May share a Postgres cluster with GFire; **must not** share GFire job tables.
- Migrations owned by `gfireui-backend`.

---

## 8. Thin GFire proxy

- Forward authenticated, authorized requests to GFire using a **service Bearer** from backend config.
- Prefer preserving GFire request/response shapes (OpenAPI-aligned) under `/api/gfire/...`.
- Optional `GET /api/ops/summary` aggregates counts for dashboard charts (still sourced from GFire APIs).

---

## 9. UI surface (v0.1)

| Route | Roles | Purpose |
| ----- | ----- | ------- |
| `/login` | all | email + password → JWT |
| `/` | auth | redirect → `/jobs` |
| `/jobs` | Admin, Operator, Auditor | list + filters |
| `/jobs/[id]` | same | detail, history, result; actions by role |
| `/queues` | same | list + stats |
| `/recurring` | same | list; mutations Admin/Operator |
| `/servers` | same | GFire peers |
| `/users` | Admin | user admin |
| `/audit` | Admin, Auditor | audit feed |

**Out of v0.1 UI:** GFire Band 8 pipelines/DAGs, embedded Grafana, OIDC/SSO.

---

## 10. Visual design

- **No theme packs in v0.1.** Fixed brand tokens; **light + dark** modes only.
- Default: system preference; in-UI toggle; persist preference (e.g. localStorage).
- Implement with **CSS variables** so theme packs can be added post-v1 without rewrite.
- Expressive typography (avoid generic default stacks as the hero face of the product).
- Cards only where they carry interaction; console layout (nav + main).
- Intentional motion (list transitions, chart updates, theme toggle) — not noise.

### Dark palette

| Token | Hex |
| ----- | --- |
| page background | `#1A1A1A` |
| card surface | `#212222` |
| border / divider | `#333333` |
| primary text | `#F8FAFC` |
| muted text | `#A3A3A3` |
| brand primary | `#3B82F6` |
| success | `#4ADE80` |
| warning | `#FACC15` |
| danger | `#F87171` |

### Light palette (paired draft)

| Token | Hex |
| ----- | --- |
| page background | `#F4F6F8` |
| card surface | `#FFFFFF` |
| border / divider | `#E2E8F0` |
| primary text | `#0F172A` |
| muted text | `#64748B` |
| brand / success / warning / danger | same as dark |

**Post-v1:** named theme packs (swap token maps). Not custom user-uploaded themes in the first post-v1 cut unless revisited.

---

## 11. Dashboard charts

- Dynamic charts (jobs by state, queue depths, approximate throughput).
- **Browser polls** BFF every 2–5s (`/api/ops/summary` and/or proxied list/stats endpoints).
- Animate on each snapshot.
- **No SSE/WebSocket in v0.1.** Revisit when GFire (or the BFF) has a real event stream — server-side sampling pushed over SSE would not be more “real-time” than poll while GFire is pull-only.

---

## 12. Frontend stack

- **SvelteKit** + TypeScript.
- **SPA / CSR** (static adapter); no SSR requirement in v0.1.
- Auth and business API calls go only to `gfireui-backend`.

---

## 13. Backend stack

- **Go** module, service layout (not a library).
- net/http (or equivalent) API; context on public functions; structured config (YAML + env).
- Align quality habits with sibling Go services (fmt, vet, tests) as the repo matures.

---

## 14. Non-goals (v0.1)

- Embedding UI in `gfire`
- Job credential vault / secret-by-UUID resolution (handlers + environment remain responsible in GFire)
- SSE / WebSocket live push
- Pipeline / DAG console (depends on GFire Band 8)
- Theme packs / multi-brand switcher (post-v1 packs on CSS tokens)
- **OAuth2 / OIDC** in the first runnable cut (planned post-v0.1 — see §5)
- Changing GFire’s auth model (still optional single Bearer on GFire)

---

## 15. Deliverable v0.1

Docker Compose (or equivalent): PostgreSQL `gfireui` + `gfireui-backend` + `gfireui` (+ GFire already running). Bootstrap Admin via env or CLI → login → console for jobs/queues/recurring/servers → users + audit → polled charts. RBAC enforced on the backend.

---

## 16. Documentation rule

All behavioral contracts above must appear in repo specs (`SPECIFICATIONS.md` per service) as they are implemented. This design file is the source for the first planning pass; drift is resolved by updating SPEC + this design (or a superseding revision).

---

## 17. Open items for planning (not blocking design)

- Exact JWT TTL / refresh strategy (access-only vs refresh later)
- Chart library choice
- Whether production static UI is served by the Go binary or a separate nginx/Caddy container
- Precise audit `action` string catalog
- OAuth2/OIDC: which providers first (generic OIDC vs GitHub/Google), invite-only vs auto-provision, refresh/session with IdP
