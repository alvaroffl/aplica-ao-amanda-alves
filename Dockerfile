# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# (VITE_SUPABASE_ANON_KEY e VITE_TURNSTILE_SITE_KEY são chaves PÚBLICAS por design)
# -----------------------------------------------------------------------------
# Front-end (SPA) — build com pnpm e servidor nginx sem root.
# As variáveis VITE_* são públicas e embutidas no build (--build-arg).
# -----------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @agendae/web...
COPY apps/web apps/web
COPY packages/shared packages/shared
ARG VITE_APP_NAME=Agendaê
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_TURNSTILE_SITE_KEY=
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
RUN pnpm --filter @agendae/web build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
ENV SUPABASE_URL=http://127.0.0.1:54321 \
    SUPABASE_WS_URL=ws://127.0.0.1:54321 \
    NGINX_ENVSUBST_FILTER=^SUPABASE_
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/security-headers.inc.template /etc/nginx/templates/security-headers.inc.template
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
