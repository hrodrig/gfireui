# GFireUI — OCI Image, CI, and Quality Gate Design

**Date:** 2026-08-08  
**Status:** Approved  
**Repo:** [hrodrig/gfireui](https://github.com/hrodrig/gfireui)  
**Consumers:** [gfire-selfhosted](https://github.com/hrodrig/gfire-selfhosted) console stack (`ui` service → container **:8080**)

## 1. Goal

Ship a **production-quality** static SPA image and CI pipeline so operators (and gfire-selfhosted) can pull **`ghcr.io/hrodrig/gfireui`** with confidence: unprivileged nginx, security headers, reproducible builds, and a **≥ 80%** Vitest coverage gate — same quality bar spirit as gfire / gfireui-backend.

**Order:** finish **gfireui** packaging first; **gfireui-backend** image/release work comes after.

## 2. Non-goals

- Serving the SPA from gfireui-backend Go binary
- Traefik / TLS / observability sidecars
- Playwright E2E as a merge blocker in this band (optional later)
- Embedding UI into the gfire engine

## 3. Quality: tests and coverage

### 3.1 Where tests live

| Kind | Location | Tool |
|------|----------|------|
| Unit / lib / component logic | Colocated `src/**/*.test.ts` | Vitest (+ jsdom as today) |
| Coverage gate | `make cover` + CI job | `@vitest/coverage-v8` (or istanbul) |
| Image smoke | Post-`docker build` in CI / `make docker-smoke` | `curl` HTTP 200 on `/` (and SPA fallback) |

Do **not** put SPA unit coverage in gfire-selfhosted. That repo only pins the image.

### 3.2 Coverage contract

- **Metric:** statements (primary); report lines/branches in CI logs for visibility  
- **Floor:** **`COVER_MIN_PERCENT ?= 80`** (Makefile, overridable like gfireui-backend)  
- **Scope (gate):** `src/lib/**/*.{ts,js}` business logic — exclude `src/lib/test/**`, `types.ts`, `*.test.ts`. Route/page `.svelte` coverage is follow-up (component/E2E); not required to game the floor.  
- **Fail closed:** `make cover` and CI **fail** when total statements &lt; 80%  
- **Discipline:** raise coverage with real tests on auth client, stores, route guards, and critical UI helpers — not empty files solely to game the number

### 3.3 Local commands

```text
make install   # npm ci / npm install
make check     # svelte-check
make test      # vitest (no gate)
make cover     # vitest --coverage + enforce COVER_MIN_PERCENT
make build     # static production build
make release-check  # check + cover + build (+ docker-build when Docker available)
```

## 4. OCI image (security-first)

### 4.1 Base and user

| Choice | Value |
|--------|--------|
| Runtime base | **`nginxinc/nginx-unprivileged:*-bookworm`** (pin minor; prefer Bookworm over Alpine for CVE posture, consistent with gfire-selfhosted Postgres pin rationale) |
| Process user | Image default non-root UID (never run as root) |
| Listen | **8080** (unprivileged default; matches selfhosted compose target) |
| Filesystem | Document `read_only: true` + `tmpfs: [/tmp]` for hardened compose; image itself must work with writable `/tmp` only |

### 4.2 Build stages

1. **Build:** `node:22-bookworm` — `npm ci`, `PUBLIC_GFIREUI_API_BASE` as **build-arg** / env (SvelteKit `$env/static/public`), `npm run build`  
2. **Runtime:** copy `build/` (adapter-static output) into nginx html root; custom `conf.d` for SPA `try_files` + `index.html` fallback  
3. **Labels:** OCI `org.opencontainers.image.*` (title, source, revision, version)

### 4.3 Nginx hardening (minimum)

- SPA routing without enabling directory listing  
- Security headers (baseline): `X-Content-Type-Options nosniff`, `Referrer-Policy`, `X-Frame-Options` or CSP `frame-ancestors 'none'` (tune if embedding ever required — default deny framing)  
- CSP: start strict enough for static SPA + API calls to configured origin; iterate if fonts/inline break (document exceptions)  
- No shell, no package manager in final stage beyond what the unprivileged image ships  
- Do not bake secrets; only public build-time `PUBLIC_GFIREUI_API_BASE`

### 4.4 Make / tags

- `make docker-build` → local `gfireui:$(VERSION)`  
- Release tags: `ghcr.io/hrodrig/gfireui:v$(VERSION)` and moving tags as family convention dictates  
- Build-arg default for lab: `http://127.0.0.1:8090` (document that production images must rebuild with the real public BFF URL)

## 5. CI / CD

### 5.1 Pull requests / `develop`

On every PR and push to `develop`:

1. `npm ci`  
2. `npm run check`  
3. **`make cover`** (≥ 80%)  
4. `npm run build` (with a documented dummy/public API base)  
5. `docker build` (verify Dockerfile; no push required on PR)

### 5.2 Release / GHCR + SBOM + Cosign (mirror gfire)

Reference sibling: **[gfire](https://github.com/hrodrig/gfire)** — `.goreleaser.yaml` (`sboms`, `dockers_v2.sbom`, `docker_signs`) + `.github/workflows/release.yml` (`id-token: write`, `sigstore/cosign-installer`, `anchore/sbom-action/download-syft`).

gfireui is a **Node/SPA** image (no Go binaries required). Achieve the **same operator-facing outcome** without mandating GoReleaser:

On annotated tag `v*` (after merge to `main` per git-flow):

1. Same quality jobs as §5.1 (`check`, `cover` ≥ 80%, `build`)  
2. Build multi-arch image when ready (amd64 first; arm64 follow-up OK)  
3. Push to **`ghcr.io/hrodrig/gfireui`** (`packages: write`)  
4. **SBOM (syft):**  
   - Image SBOM attached to the pushed digest (SPDX and/or CycloneDX — match gfire dual docs when cheap)  
   - Optional: npm/CycloneDX from `package-lock.json` uploaded as GitHub Release asset  
5. **Cosign keyless (Sigstore):**  
   - `cosign sign` the image digest (`${image}@${digest}`) — same intent as gfire `docker_signs`  
   - Workflow permissions: **`id-token: write`** + `contents: write` + `packages: write`  
   - Install: `sigstore/cosign-installer@v3`, syft via `anchore/sbom-action/download-syft@v0` (or equivalent)  
6. Optional: `cosign attest` SBOM predicate; grype/scout scan fail policy aligned with family when tooling exists  

Do **not** weaken this to “optional nice-to-have” on release tags — release without sign/SBOM is incomplete for this band.

### 5.3 Workflows

- `.github/workflows/ci.yml` — quality + image build (no push / no cosign required on PR)  
- `.github/workflows/release.yml` — tag `v*` → quality → buildx push GHCR → syft SBOM → cosign sign  

Whitelist `.github/` already allowed in `.gitignore`.

## 6. Docs and roadmap IDs

| ID | Item |
|----|------|
| U-030 | Dockerfile multi-stage + nginx-unprivileged Bookworm + SPA conf + security headers |
| U-031 | `make cover` + Vitest coverage ≥ 80% + expand tests to pass gate |
| U-032 | GitHub Actions CI (check, cover, build, docker build) |
| U-033 | GHCR publish on `v*` tags; README / SPEC image contract |
| U-034 | `make release-check` / docker smoke curl :8080 |
| U-035 | Release: syft SBOM + cosign keyless (mirror gfire) |

Update root **ROADMAP.md**, **SPECIFICATIONS.md** (image + coverage + supply-chain contract), **README** (build/run/verify image).

## 7. Relation to gfire-selfhosted

Console compose already maps **`${GFIREUI_HOST_PORT}:8080`**. When GHCR tags exist, dogfood uses `GFIREUI_VERSION` / `GFIREUI_IMAGE` without changing listen port.

## 8. Decisions log

| Decision | Choice |
|----------|--------|
| Scope band | gfireui only (backend later) |
| Packaging level | Local image + GHCR + CI (option C) |
| Nginx | `nginxinc/nginx-unprivileged` Bookworm, :8080 |
| Coverage | ≥ 80% statements via Vitest in this repo |
| Quality bar | “App de calidad” — gate fail-closed in CI |
| Supply chain | Mirror gfire: syft SBOM + cosign keyless on `v*` (Actions; GoReleaser optional) |
