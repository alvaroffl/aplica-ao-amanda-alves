#!/usr/bin/env bash
# Executado uma vez, ao criar o ambiente: dependências e arquivos .env locais.
set -euo pipefail
cd "$(dirname "$0")/.."

sudo corepack enable
pnpm install --frozen-lockfile

[ -f supabase/functions/.env ] || cp supabase/functions/.env.example supabase/functions/.env
[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local
