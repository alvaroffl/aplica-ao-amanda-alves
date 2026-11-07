-- Remove TODOS os dados de demonstração (is_demo = true) de todos os negócios:
-- serviços e preços fictícios, horários, bloqueios, clientes e reservas de
-- exemplo (com seus pagamentos de teste). A política volta ao padrão (24h, 100%).
-- Reservas feitas em serviços de demonstração durante a apresentação também saem.
--
-- Local:     pnpm demo:purge
-- Produção:  cole no SQL Editor do Supabase (ou psql "$DATABASE_URL" -f este-arquivo)
-- Pelo app:  Painel → Configurações → "Remover dados de demonstração" (admin)
select private.purge_demo_data(null) as removidos;
