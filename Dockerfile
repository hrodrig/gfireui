# syntax=docker/dockerfile:1
# Multi-stage: Node build → nginx-unprivileged Bookworm (listen 8080).
# Build-arg PUBLIC_GFIREUI_API_BASE is baked into the static SPA at build time.

ARG NODE_VERSION=22
ARG NGINX_UNPRIVILEGED_TAG=1.28-bookworm

FROM node:${NODE_VERSION}-bookworm AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Browser-reachable BFF origin (no trailing slash). Override per environment.
ARG PUBLIC_GFIREUI_API_BASE=http://127.0.0.1:8090
ENV PUBLIC_GFIREUI_API_BASE=${PUBLIC_GFIREUI_API_BASE}

ARG PUBLIC_GFIREUI_CONSOLE_TITLE=GFire
ENV PUBLIC_GFIREUI_CONSOLE_TITLE=${PUBLIC_GFIREUI_CONSOLE_TITLE}

ARG VERSION=0.0.0
ARG PUBLIC_GFIREUI_VERSION=${VERSION}
ENV PUBLIC_GFIREUI_VERSION=${PUBLIC_GFIREUI_VERSION}

RUN npm run build

FROM nginxinc/nginx-unprivileged:${NGINX_UNPRIVILEGED_TAG}

ARG VERSION=0.0.0
ARG REVISION=unknown
ARG BUILDDATE=unknown

LABEL org.opencontainers.image.title="gfireui" \
	org.opencontainers.image.description="GFire ops console SPA" \
	org.opencontainers.image.source="https://github.com/hrodrig/gfireui" \
	org.opencontainers.image.authors="https://github.com/hrodrig/gfireui" \
	org.opencontainers.image.version="${VERSION}" \
	org.opencontainers.image.revision="${REVISION}" \
	org.opencontainers.image.created="${BUILDDATE}"

# Replace default site with SPA + security headers
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

# Image already runs as non-root (UID 101). Keep CMD from base (nginx -g daemon off).
