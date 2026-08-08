# Security Policy

## Scope

This policy covers the **GFireUI** SvelteKit SPA, its production OCI image
(`ghcr.io/hrodrig/gfireui`), and the nginx static serving configuration in this
repository.

Auth, RBAC, audit, and the GFire proxy live in
**[gfireui-backend](https://github.com/hrodrig/gfireui-backend)** — report
backend vulnerabilities there. Engine issues belong in
**[gfire](https://github.com/hrodrig/gfire)**. Deployment packaging belongs in
**[gfire-selfhosted](https://github.com/hrodrig/gfire-selfhosted)**.

## Supported Versions

We support the **latest release** and the active development branch with
security updates. We use [semantic versioning](https://semver.org/)
(MAJOR.MINOR.PATCH).

| Version | Supported |
| ------- | --------- |
| Latest release | :white_check_mark: |
| Older releases | :x: |

When a vulnerability is fixed, we release a new patch version. Please upgrade
to the latest release to receive security fixes.

## Reporting a Vulnerability

**Do not open a public issue** for security vulnerabilities.

- **Preferred:** Use [GitHub Security Advisories](https://github.com/hrodrig/gfireui/security/advisories/new) to report privately.
- **Alternative:** Contact the maintainer via [github.com/hrodrig](https://github.com/hrodrig) with:
  - clear description
  - impact
  - steps to reproduce
  - affected versions / image tags (if known)

## What to expect

- We acknowledge your report as soon as possible.
- We investigate and work on a fix.
- For accepted reports, we coordinate disclosure and credit (unless you prefer anonymity).

Thank you for helping keep GFireUI and its users safe.
