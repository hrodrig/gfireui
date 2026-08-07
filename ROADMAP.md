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

## Post-v0.1

| ID | Item | Notes |
| -- | ---- | ----- |
| U-020 | OAuth2 / OIDC login UI | Backend mints GFireUI JWT after IdP |
| U-021 | Theme packs | Swap CSS token maps |
| U-022 | Richer job filters / bulk actions | Depends on GFire API surface |

## Explicit non-goals here

Kubernetes packaging (future selfhosted sibling). Embedding into the `gfire` binary.
