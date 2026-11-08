#!/usr/bin/env bash
# Sobe o app da Amanda Alves no Codespaces (ou em qualquer dev container):
# site (porta 5173), Supabase local (API e e-mails) e Edge Functions.
# Pode ser rodado de novo a qualquer momento: o que já estiver no ar é mantido.
#   bash .devcontainer/start.sh
# Logs em /tmp/agendae-*.log.
set -uo pipefail
cd "$(dirname "$0")/.."

up() { curl -fsS -o /dev/null --max-time 3 "$1" 2>/dev/null; }
domain="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"

# 0) Dependências (se a criação do ambiente foi interrompida)
if [ ! -d node_modules ] || [ ! -d apps/web/node_modules ]; then
  echo "Instalando dependências..."
  pnpm install --frozen-lockfile || echo "AVISO: falha ao instalar dependências."
fi
[ -f supabase/functions/.env ] || cp supabase/functions/.env.example supabase/functions/.env
[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local

# 1) Site primeiro: a porta 5173 responde mesmo que o banco ainda esteja subindo.
if up http://localhost:5173/; then
  echo "Site já está no ar."
else
  echo "Iniciando o site..."
  # O endereço encaminhado do Codespaces (*.app.github.dev) precisa ser liberado no Vite.
  __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=".${domain}" \
    setsid nohup pnpm dev --host >/tmp/agendae-web.log 2>&1 </dev/null &
fi

# 2) Supabase local (na primeira vez baixa as imagens: alguns minutos)
echo "Aguardando o Docker..."
for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 2; done
if up http://127.0.0.1:54321/rest/v1/ || [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:54321/rest/v1/)" = "401" ]; then
  echo "Supabase já está no ar."
else
  echo "Iniciando o Supabase local..."
  for attempt in 1 2; do
    npx supabase start -x studio,imgproxy,logflare,vector,supavisor && break
    echo "Supabase não iniciou (tentativa ${attempt}); tentando de novo..."
    sleep 5
  done
fi

# 2b) Banco igual ao do repositório: depois de um `git pull` com migrations ou
#     seed novos (ex.: login de demonstração), recria o banco de demonstração.
#     Ambiente de desenvolvimento: os dados locais voltam ao seed.
stamp_file=supabase/.temp/db-stamp
stamp=$(cat supabase/migrations/*.sql supabase/seed.sql | sha256sum | cut -d' ' -f1)
if [ "$(cat "$stamp_file" 2>/dev/null)" != "$stamp" ]; then
  echo "Atualizando o banco de demonstração (migrations e seed do repositório)..."
  if npx supabase db reset; then
    mkdir -p supabase/.temp && echo "$stamp" >"$stamp_file"
  else
    echo "AVISO: não foi possível recriar o banco; rode: npx supabase db reset"
  fi
else
  echo "Banco de demonstração em dia."
fi

# 3) Edge Functions (reserva, pagamentos e e-mails)
code=$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS --max-time 3 \
  http://127.0.0.1:54321/functions/v1/public-booking || true)
if [ "$code" = "204" ] || [ "$code" = "200" ]; then
  echo "Edge Functions já estão no ar."
else
  echo "Iniciando as Edge Functions..."
  setsid nohup npx supabase functions serve --env-file supabase/functions/.env \
    >/tmp/agendae-functions.log 2>&1 </dev/null &
fi

# 4) Resumo
for _ in $(seq 1 60); do up http://localhost:5173/ && break; sleep 2; done
status() { if up "$1" || [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$1")" = "401" ]; then echo "OK"; else echo "FORA DO AR (veja $2)"; fi; }
if [ -n "${CODESPACE_NAME:-}" ]; then
  base="https://${CODESPACE_NAME}-5173.${domain}"
else
  base="http://localhost:5173"
fi
echo
echo "Amanda Alves:"
echo "  Site (porta 5173):  $(status http://localhost:5173/ /tmp/agendae-web.log)"
echo "  API do Supabase:    $(status http://127.0.0.1:54321/rest/v1/ 'npx supabase status')"
echo "  E-mails (54324):    $(status http://127.0.0.1:54324/ 'npx supabase status')"
echo
echo "  Página inicial:     ${base}/"
echo "  Agendamento:        ${base}/amanda-alves"
echo "  Painel:             ${base}/entrar  (amanda@demo.test / demo12345)"
if [ -n "${CODESPACE_NAME:-}" ]; then
  echo
  echo "  HTTP 401 no navegador? 1) aba Portas > porta 5173 > botão direito >"
  echo "  Visibilidade da porta > Pública; 2) abra o link numa janela anônima."
fi
exit 0
