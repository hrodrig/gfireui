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
