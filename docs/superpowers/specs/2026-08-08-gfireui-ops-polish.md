# GFireUI — Ops console polish (Hangfire as reference only)

**Date:** 2026-08-08  
**Status:** Approved  
**Repos:** gfireui (+ gfireui-backend ops summary; gfire `/healthz` version fields)

## Philosophy

Hangfire/Sidekiq-class UIs are a **functional reference** (operator muscle memory), not a product template.

References: Hangfire / [Sidekiq](https://sidekiq.org/) product UIs and the [Monitoring wiki](https://github.com/sidekiq/sidekiq/wiki/Monitoring) (Web UI, `/stats`, queue latency). Rails Sidekiq admin tutorials are orientation only.

- Steal patterns that cut time-to-diagnosis for a **headless, multi-peer, polyglot-handler** job service.
- Do **not** clone layout, naming, .NET, or Ruby/Rails mount metaphors.
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
| Queue **latency** (age of oldest enqueued) as ops signal | Adopt later (Sidekiq-style; needs engine metric/API) |
| Sliding **realtime** activity graph (time on X) | Adopt — Phase A client ring buffer; see [Realtime activity chart](#realtime-activity-chart) |
| Semantic state colors + categorical bars + ID truncate | Adopt — U-047 (Claude redesign DNA; brand amber ≠ Processing blue) |
| Compact JSON stats endpoint for probes | Partial — BFF `ops/summary` already; tighten for k8s probes later |
| Mount Web UI under `/sidekiq` + `X-Script-Name` | Reject for SPA — k8s uses Host/Ingress rewrite; no app `BASE_PATH` |
| C# Activate / culture / “Back to site” | Reject |
| Pixel-clone HF / Sidekiq chrome | Reject |

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

## Realtime activity chart

**Roadmap:** U-046 · **Status:** Phase A shipped (client ring buffer on Jobs)

Hangfire’s Overview “Realtime” panel is a sliding window (~2s ticks): new samples enter on the right, old ones leave on the left. That motion signals “the system is alive” even when absolute counts are small. GFireUI today polls `/api/ops/summary` and renders **category snapshots** (jobs by state, queue depth) — correct for diagnosis, low motion.

### Intent

Add a GFire-native **activity over time** panel so operators see change without adopting Hangfire layout or SignalR.

### Phase A — client ring buffer (default first)

1. Reuse existing poll (layout / OpsCharts already ~2–5s).
2. On each summary, append a sample: timestamp, `Processing` count, Succeeded delta vs previous sample, optional aggregate queue depth.
3. Keep ~60–90 points in memory; render with uPlot as a time series (same chart stack as today).
4. Place on Jobs (or a thin Overview strip above current charts).
5. No BFF contract change; refresh clears the buffer (acceptable for v1).

### Phase B — Day / Week history (optional)

Persist samples in BFF (or expose engine metrics) only if Phase A proves valuable. Toggle Day / Week like Hangfire History — naming stays GFire (“Activity”, not “Realtime” product clone).

### Out of scope for U-046

- WebSockets / SSE (poll is enough for Phase A).
- Pixel-clone of Hangfire Overview chrome.
- Replacing state-snapshot charts — they stay; activity is additive.
