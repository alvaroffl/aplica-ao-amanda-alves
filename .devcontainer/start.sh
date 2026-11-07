#!/usr/bin/env bash
# Executado a cada início do ambiente: Supabase local, Edge Functions e site.
# Logs em /tmp/agendae-*.log.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Aguardando o Docker..."
for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 2; done

# Na primeira vez baixa as imagens do Supabase (alguns minutos).
echo "Iniciando o Supabase local..."
npx supabase start -x studio,imgproxy,logflare,vector,supavisor

echo "Iniciando as Edge Functions e o site..."
setsid nohup npx supabase functions serve --env-file supabase/functions/.env \
  >/tmp/agendae-functions.log 2>&1 < /dev/null &
# O endereço encaminhado do Codespaces (*.app.github.dev) precisa ser liberado no Vite.
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=".${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}" \
  setsid nohup pnpm dev --host >/tmp/agendae-web.log 2>&1 < /dev/null &

for _ in $(seq 1 60); do curl -fsS -o /dev/null http://localhost:5173/ && break; sleep 2; done

if [ -n "${CODESPACE_NAME:-}" ]; then
  base="https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
else
  base="http://localhost:5173"
fi
echo
echo "Agendaê no ar:"
echo "  Página de reserva: ${base}/studio-exemplo"
echo "  Painel:            ${base}/entrar  (demo@agendae.dev / demo12345)"
