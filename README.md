# GFireUI — ops console for GFire

<a id="readme-top"></a>

**🖥** _See the queue. Run the fleet. Leave GFire headless._

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](./VERSION)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-SPA-FF3E00?logo=svelte)](https://kit.svelte.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Status](https://img.shields.io/badge/status-design-yellow)](#current-status)
[![Companion](https://img.shields.io/badge/backend-gfireui--backend-0ea5e9)](https://github.com/hrodrig/gfireui-backend)

**Repo:** [github.com/hrodrig/gfireui](https://github.com/hrodrig/gfireui) · **Backend:** [gfireui-backend](https://github.com/hrodrig/gfireui-backend) · **Engine:** [gfire](https://github.com/hrodrig/gfire) · **Design:** [platform design](./docs/superpowers/specs/2026-08-06-gfireui-platform-design.md) · **Site:** [gfire.net](https://gfire.net)

<p align="center">
  <img src="docs/assets/gfireui-hero.png" alt="GFireUI — ops console for GFire" width="100%" />
</p>

```
┌──────────────────────────────────────────────────────────────┐
│  GFireUI                                                     │
│  light / dark · jobs · queues · recurring · servers          │
│  users · roles · audit · live charts                         │
└────────────────────────────┬─────────────────────────────────┘
                             │ JWT
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  gfireui-backend  —  BFF · RBAC · audit · thin GFire proxy   │
└────────────────────────────┬─────────────────────────────────┘
                             │ service Bearer
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  gfire  —  headless job service (unchanged)                  │
└──────────────────────────────────────────────────────────────┘
```

GFireUI is the **browser console** for [GFire](https://github.com/hrodrig/gfire): a language-agnostic, HTTP-first job service. The engine stays a single binary with no embedded UI. This repo is the **SvelteKit SPA** — pixels, charts, and workflows. Identity, permissions, and the GFire proxy live in **[gfireui-backend](https://github.com/hrodrig/gfireui-backend)**.

> **Status: design approved, implementation starting.** v0.1.0 — platform design locked; no runnable app yet. Track progress here and in the backend ROADMAP once scaffolding lands.

**Related tools (same maintainer):**
- **[gfire](https://github.com/hrodrig/gfire)** — standalone background job service ([gfire.net](https://gfire.net))
- **[gfireui-backend](https://github.com/hrodrig/gfireui-backend)** — Go BFF for this console
- **[pgwd](https://github.com/hrodrig/pgwd)** — PostgreSQL connection watchdog
- **[gghstats](https://github.com/hrodrig/gghstats)** — GitHub traffic beyond 14 days
- **[kzero](https://github.com/hrodrig/kzero)** — bastion-first declarative workload reset
- **[groot](https://github.com/hrodrig/groot)** — Kubernetes diagnostics archive

## Table of contents

- [Why a separate UI](#why-a-separate-ui)
- [What you get (v0.1 target)](#what-you-get-v01-target)
- [Architecture](#architecture)
- [Roles](#roles)
- [Visual direction](#visual-direction)
- [Current status](#current-status)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Docs](#docs)
- [License](#license)

[↑ Back to top](#readme-top)

## Why a separate UI

GFire’s wedge is **headless**: curl, CLI, Prometheus — any language, no SDK marriage. Operators still want a screen.

| Embedded UI in the engine | GFireUI (this approach) |
| ------------------------- | ----------------------- |
| Couples release cycles | Ship UI without touching `gfire` |
| One auth story for jobs + humans | Humans get users/roles; GFire keeps a service token |
| Harder multi-tenant console | BFF owns RBAC + audit |

You get Sidekiq-class **visibility** without turning GFire into a monolith.

[↑ Back to top](#readme-top)

## What you get (v0.1 target)

| Surface | Notes |
| ------- | ----- |
| **Jobs** | List, filter, detail, history, result; requeue / cancel by role |
| **Queues** | Depth and stats |
| **Recurring** | Definitions + trigger |
| **Servers** | Peer view of GFire nodes |
| **Users** | UUIDv7 identities, names, email, enable/disable, roles |
| **Audit** | Append-only trail of login and mutations |
| **Dashboard charts** | Jobs-by-state, queue depths — browser polls the BFF (2–5s) |
| **Light / dark** | Fixed palette, CSS variables; theme packs post-v1 |
| **OAuth2 / OIDC** | Post-v0.1 — federated login via backend (local JWT + roles stay) |

The browser talks **only** to `gfireui-backend`. It never holds the GFire service Bearer.

[↑ Back to top](#readme-top)

## Architecture

```
Browser ──JWT──► gfireui-backend ──Bearer──► gfire
   ▲                    │
   │                    ├── PostgreSQL (database gfireui)
   └── static SPA       └── /api/gfire/* thin proxy
```

- **This repo:** SvelteKit + TypeScript, SPA/CSR (static adapter).
- **Backend:** auth, users, audit, RBAC middleware, GFire proxy, `/api/ops/summary` for charts.
- **GFire:** unchanged REST from v1.0.0.

Full contract: [platform design](./docs/superpowers/specs/2026-08-06-gfireui-platform-design.md) (mirrored in the backend repo).

[↑ Back to top](#readme-top)

## Roles

| Role | Intent |
| ---- | ------ |
| **Administrator** | Users, config visibility, all mutations |
| **Operator** | Day-to-day job/queue/recurring actions |
| **Auditor** | Read-only ops + audit log |
| **Guest** | Account exists; console locked pending access |

Enforcement is on the **backend**. The UI hides buttons; that is not security.

[↑ Back to top](#readme-top)

## Visual direction

Ops tooling that does not look like a spreadsheet abandoned in 2014.

- **Dark:** `#1A1A1A` page · `#212222` cards · `#3B82F6` brand · semantic green / amber / coral  
- **Light:** paired neutrals, same brand and semantics  
- System preference + in-UI toggle (persisted)  
- Expressive type, purposeful motion, charts that update with each poll snapshot  
- **Post-v1:** named theme packs on the same CSS token system  

[↑ Back to top](#readme-top)

## Current status

| Item | State |
| ---- | ----- |
| Platform design | ✅ Approved 2026-08-06 |
| Scaffold (SvelteKit app) | ⬜ |
| Wired to backend | ⬜ |
| Docker Compose demo | ⬜ |
| First runnable release | ⬜ |

[↑ Back to top](#readme-top)

## Repository layout

```
gfireui/
├── README.md
├── VERSION
├── LICENSE
└── docs/
    ├── assets/
    │   └── gfireui-hero.png
    └── superpowers/specs/
        └── 2026-08-06-gfireui-platform-design.md
```

Application sources appear as scaffolding lands (`src/`, `package.json`, …).

[↑ Back to top](#readme-top)

## Development

Not runnable yet. After scaffold:

```sh
# expected shape (subject to plan)
npm install
npm run dev          # Vite / SvelteKit
# point at gfireui-backend API base URL via env
```

Pair with a running **[gfireui-backend](https://github.com/hrodrig/gfireui-backend)** and a **[gfire](https://github.com/hrodrig/gfire)** instance.

[↑ Back to top](#readme-top)

## Docs

| Document | Role |
| -------- | ---- |
| [Platform design](./docs/superpowers/specs/2026-08-06-gfireui-platform-design.md) | Approved architecture & UX contract |
| [gfireui-backend](https://github.com/hrodrig/gfireui-backend) | BFF, auth, audit, proxy |
| [GFire SPEC](https://github.com/hrodrig/gfire/blob/main/SPECIFICATIONS.md) | Engine behavior |

`SPECIFICATIONS.md` / `ROADMAP.md` for this repo land with the first implementation band.

[↑ Back to top](#readme-top)

## License

[MIT](./LICENSE) © Hermes Rodriguez

[↑ Back to top](#readme-top)
