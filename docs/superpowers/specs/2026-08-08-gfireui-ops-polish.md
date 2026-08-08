# GFireUI — Ops console polish (Hangfire as reference only)

**Date:** 2026-08-08  
**Status:** Approved  
**Repos:** gfireui (+ gfireui-backend ops summary; gfire `/healthz` version fields)

## Philosophy

Hangfire/Sidekiq-class UIs are a **functional reference** (operator muscle memory), not a product template.

- Steal patterns that cut time-to-diagnosis for a **headless, multi-peer, polyglot-handler** job service.
- Do **not** clone layout, naming, or .NET metaphors.
- Prefer GFire-native concepts as differentiators.

## Adopt vs reject

| Pattern | Verdict |
|---------|---------|
| Counts by job state | Adopt |
| Readable job detail + state timeline | Adopt |
| Typed peer/server table | Adopt |
| Configurable console title | Adopt (`PUBLIC_GFIREUI_CONSOLE_TITLE`) |
| Calm empty-states | Adopt (our voice) |
| Separate “Retries” product tab | Adapt → **Attention** (Failed + Dead) |
| C# Activate / culture / “Back to site” | Reject |
| Pixel-clone HF chrome / HF graphs | Reject |

## Differentiators

1. Full GFire state set including **Dead**, **Cancelled**, **Awaiting**
2. Continuations on job detail when present
3. Peer cluster columns (workers, queues, heartbeat)
4. Handler = external cmd name + JSON args
5. RBAC + Audit remain first-class
6. Footer stack versions with repo links (gfire / gfireui / gfireui-backend)

## Console title

Bake-time: `PUBLIC_GFIREUI_CONSOLE_TITLE` (default `GFire`). Shown in nav brand and jobs state rail header.

## Footer versions

Authenticated layout footer shows:

- gfireui — `PUBLIC_GFIREUI_VERSION`
- gfireui-backend — from `/api/ops/summary` `versions[]` (BFF ldflags)
- gfire — from BFF reading engine `/healthz` `version`/`commit` (best-effort)

Each name links to its GitHub repo.

## Ops summary contract

`GET /api/ops/summary` includes canonical state counts, `servers_count`, `recurring_count`, `versions[]`, `queues`, `generated_at`.
