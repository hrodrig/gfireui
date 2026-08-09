# GFireUI Roadmap

**Branch policy:** work on `develop` until E2E with gfireui-backend (+ GFire); then merge to `main` and tag.

## v0.1 — Ops console SPA

| ID | Item | Status |
| -- | ---- | ------ |
| U-001 | SvelteKit scaffold + static adapter | ✅ |
| U-002 | Light/dark tokens + toggle | ✅ |
| U-003 | API client + JWT session | ✅ |
| U-004 | Login + auth gate | ✅ |
| U-005 | Role-aware nav | ✅ |
| U-006 | Polled ops charts | ✅ |
| U-007 | Jobs list + detail | ✅ |
| U-008 | Queues / recurring / servers | ✅ |
| U-009 | Users + audit | ✅ |
| U-010 | SPEC + ROADMAP polish | ✅ |

**v0.1 done when:** login against backend works; Admin can open jobs/users/audit; charts poll when GFire is configured upstream.

## Packaging / quality (for selfhosted console)

Design: [docs/superpowers/specs/2026-08-08-gfireui-oci-ci-quality-design.md](./docs/superpowers/specs/2026-08-08-gfireui-oci-ci-quality-design.md)

| ID | Item | Status |
| -- | ---- | ------ |
| U-030 | Dockerfile: nginx-unprivileged Bookworm, listen 8080, security headers | ✅ |
| U-031 | `make cover` — Vitest coverage ≥ 80% statements (fail-closed) + tests to pass | ✅ |
| U-032 | GitHub Actions CI: check, cover, build, docker build | ✅ |
| U-033 | GHCR `ghcr.io/hrodrig/gfireui` on `v*` tags | ✅ workflow |
| U-034 | `make release-check` + docker smoke curl :8080 | ✅ |
| U-035 | Release: syft SBOM + cosign keyless (mirror gfire) | ✅ workflow |

## Ops polish (Hangfire as reference only)

Design: [docs/superpowers/specs/2026-08-08-gfireui-ops-polish.md](./docs/superpowers/specs/2026-08-08-gfireui-ops-polish.md)

| ID | Item | Status |
| -- | ---- | ------ |
| U-040 | Console title bake-time (`PUBLIC_GFIREUI_CONSOLE_TITLE`) | ✅ |
| U-041 | State filter rail + nav badges from ops summary | ✅ |
| U-042 | Attention view (Failed + Dead) | ✅ |
| U-043 | Structured job detail + state timeline | ✅ |
| U-044 | Typed servers table | ✅ |
| U-045 | Footer: stack versions + repo links | ✅ |
| U-046 | Realtime sliding activity chart (Hangfire-style motion) | ✅ Phase A (client ring buffer) |
| U-047 | Semantic state UX (Claude redesign DNA) | ✅ |
| U-048 | Jobs list pagination (long lists) | Pending |
| U-049 | Scale-ready state counters (semantics + format) | Pending |

## Jobs list pagination (U-048)

**Today:** Jobs / Attention call `listJobs` without page controls. Long dogfood runs only show the engine’s first page (no “Next / Prev”, no “Showing X of Y”). Footer versions stay visible; table just ends.

**Wanted:**

| Piece | Notes |
| ----- | ----- |
| UI | Page size + Next/Prev (or cursor) on Jobs and Attention |
| Query | Pass `limit` / `offset` (or engine cursor) through BFF proxy |
| Chrome | “Showing N–M” when total known; keep filters (state, queue) across pages |
| Engine | Align with gfire `GET /v1/jobs` pagination contract |

Depends on GFire list API surface (limit already exists; confirm total/cursor if needed).

## Scale-ready state counters (U-049)

### Problem

`GET /api/ops/summary` → `jobs_by_state` is a **live inventory**: how many jobs sit in each state **right now** in storage — not “processed today” and not lifetime throughput.

At Hangfire-scale volume (e.g. **500k+ Succeeded/day**) that creates three failure modes:

1. **Semantic surprise** — A healthy cluster that “never fails” drives `Succeeded` into the hundreds of thousands until cleanup TTL moves rows to `Deleted`. Operators read a giant green number as backlog, not success.
2. **UI overflow** — Rail / badges / charts show raw integers (`512384`) with no compact form; Attention stays `0` so the console looks idle while the system is busiest.
3. **Cost** — Polling (~3s) that `COUNT(*)` per state against a fat terminal table becomes expensive; U-048 pagination alone does not fix summary load.

Engine retention (`cleanup.job_retention`, Succeeded → Deleted) caps the inventory only if operators enable and tune it. Without retention, `Succeeded` is an unbounded well.

### Proposed solution

| Layer | Change |
| ----- | ------ |
| **Label / UX** | Make meaning explicit in chrome: e.g. “In storage” / tooltip — counts are current inventory, not daily throughput. Compact display (`499.2k`, `1.2M`) on rail and nav badges. |
| **Throughput (prefer)** | Prefer U-046 Phase B (or engine metrics): rate / window charts (“Succeeded last 1h / 24h”) so health reads as motion, not pile size. |
| **Windowed counts (optional)** | Extend ops summary (engine or BFF) with `jobs_by_state_window` for a selectable horizon (1h / 24h) **or** document that UI inventory assumes retention ≤ N hours. |
| **Ops contract** | Document default retention for console stacks; warn in dogfood/selfhosted when retention is off or multi-day. |
| **Perf** | Engine maintains incremental counters (or cached counts) — avoid full-table scan on every summary poll at 500k rows. |

**Out of scope for U-049 alone:** changing GFire’s state machine. Retention and delete TTL stay engine concerns; UI must not pretend inventory ≡ throughput.

**Depends on:** U-046 Phase B (nice pairing); gfire cleanup / metrics surface; possibly BFF summary schema bump.

## Semantic state UX (U-047)

Reference mock (local only): Claude redesign JSX under `.no-va-al-repo/` — **do not ship that path**. DNA applied in-app:

| Item | Notes |
| ---- | ----- |
| State color tokens | Succeeded green, Failed/Dead red, Processing blue, Awaiting/Attention amber, cancelled muted |
| Brand amber | Distinct from Processing blue (`--brand`) |
| State badges | Table + rail dots |
| Rail groups | Active vs Terminal |
| Jobs by state | Horizontal bars (categorical), not area |
| Queue empty state | Copy when depth is zero |
| Truncated IDs + copy | Jobs table |
| Updated column | Latest state timestamp |
| Theme toggle | Sun/moon + label |

## Realtime activity (U-046)

Hangfire Overview “Realtime” graph walks left as new samples arrive (~2s). Operators like visible motion; state bars stay categorical snapshots.

| Phase | Scope | Notes |
| ----- | ----- | ----- |
| **A** | Client ring buffer | ✅ `ActivityBuffer` + Activity panel on Jobs. Samples from `/api/ops/summary` poll. |
| **B** | Optional Day/Week history | BFF (or engine) persist samples — only if Phase A proves useful. |
| Extras | Badge pulse | Soft pulse on Servers / Attention badges when counts change. |

Design note: [ops polish § Realtime activity](./docs/superpowers/specs/2026-08-08-gfireui-ops-polish.md#realtime-activity-chart).

## Post-v0.1

| ID | Item | Notes |
| -- | ---- | ----- |
| U-020 | OAuth2 / OIDC login UI | Backend mints GFireUI JWT after IdP |
| U-021 | Theme packs | Swap CSS token maps |
| U-022 | Richer job filters / bulk actions | Depends on GFire API surface |

## Explicit non-goals here

Kubernetes packaging (future selfhosted sibling). Embedding into the `gfire` binary.
