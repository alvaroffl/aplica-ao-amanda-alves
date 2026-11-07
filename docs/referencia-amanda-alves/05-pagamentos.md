# Pagamentos online

Esta versão de apresentação roda **sempre em modo de teste**: nenhuma cobrança é
real, e o app avisa isso na etapa de pagamento, na tela do Pix/cartão, no e-mail
(comprovante) e no painel (selo “Teste”).

## 1. Escolha do gateway

Comparação para este caso: sinal de agendamento com Pix e cartão parcelado,
pagamento confirmado em minutos e integração por Edge Functions (Deno + HTTP).

| | Mercado Pago | Asaas | Stripe |
| --- | --- | --- | --- |
| Taxas (referência; confirme no site) | Pix 0,99%; crédito 3,98% a 4,98% conforme o prazo de recebimento (página oficial do Checkout) | Tabela atual não encontrada; consultar asaas.com | Tabela BR de Pix e parcelado não encontrada; consultar stripe.com/br/pricing |
| Pix | Nativo, QR + copia e cola, expiração, webhook | Nativo | Via parceria com EBANX |
| Parcelamento | Até 12x no checkout, configurável | Sim | Sim (BR) |
| Débito / carteira | Débito, pré-pago e saldo Mercado Pago no Checkout Pro | Débito limitado | Cartões e carteiras |
| Sandbox | Credenciais e usuários de teste, cartões de teste | Ambiente sandbox | Modo teste muito bom |
| Integração com Edge Functions | API REST simples; checkout hospedado (PCI fora do nosso back-end) | API REST | API REST/SDK |

**Recomendação: Mercado Pago.** Já estava integrado, cobre Pix e cartão
(crédito parcelado e débito) num checkout hospedado, tem sandbox completo e é
muito conhecido pelas clientes. A camada é **desacoplada**: a interface
`PaymentProvider` (`supabase/functions/_shared/payments/types.ts`) tem
`createPayment`, `getPayment` e `refund`. Para trocar de gateway, basta
implementar essa interface (ex.: `asaas.ts`) e registrar em `payments/index.ts`.

Fontes das taxas: [Checkouts Mercado Pago](https://www.mercadopago.com.br/ferramentas-para-vender/check-out?code=barwy),
[Pix no Mercado Pago](https://www.mercadopago.com.br/blog/quanto-custa-receber-pagamentos-via-pix-e-codigo-qr),
[Blog Asaas — taxas](https://blog.asaas.com/taxas-asaas/),
[Stripe — Pix no Brasil](https://support.stripe.com/questions/how-to-enable-pix-as-a-payment-method-in-brazil).
Taxas mudam: confira antes do lançamento.

## 2. Métodos

| Método | Situação | Como |
| --- | --- | --- |
| **Pix** | Ativo | `POST /v1/payments` (`payment_method_id: pix`): QR Code, copia e cola e prazo de expiração; confirmação automática por webhook |
| **Cartão de crédito** | Ativo | Checkout Pro (página segura do Mercado Pago), parcelas até `businesses.max_installments` (1–12) |
| **Cartão de débito / pré-pago** | Ativo | Mesmo Checkout Pro |
| **Saldo Mercado Pago** | Ativo | Mesmo Checkout Pro |
| **Apple Pay / Google Pay** | Estrutura pronta | Dependem do que o Checkout Pro habilita para a conta; nenhum código extra no nosso back-end |
| **Boleto / lotérica** | Desativado de propósito | Compensam em até 3 dias úteis, mais que a pré-reserva (minutos). Para ativar, seria preciso uma pré-reserva longa; o tipo `ticket` está excluído em `checkoutPaymentMethods()` |

A clínica escolhe os meios aceitos e as parcelas em **Painel → Configurações →
Pagamento online do sinal** (`businesses.payment_methods`, `max_installments`).
O servidor lê essa configuração; o front-end não decide nada.

**Dados de cartão nunca passam pelo nosso back-end**: o cartão é digitado na
página do Mercado Pago (Checkout Pro). Guardamos apenas o resumo
(`payment_type_id`, parcelas, id da transação).

## 3. Fluxo e segurança

1. A cliente escolhe o horário → `public-booking` (Edge Function) valida com Zod,
   aplica rate limit e captcha e chama `create_booking` (transação + exclusion
   constraint + idempotência). **Preço e sinal são calculados no Postgres.**
2. Com sinal: reserva `pending_payment` com `hold_expires_at`; a cobrança é criada
   em `ensureDepositPayment` (chave secreta só no servidor).
3. O `pg_cron` expira pré-reservas vencidas a cada minuto (`expire_pending_bookings`)
   e o horário volta a ficar livre.
4. **Webhook** `payments-webhook`: valida a assinatura HMAC (`x-signature`), consulta
   o pagamento na API (nunca confia no corpo), confere o valor e chama
   `confirm_payment` (idempotente). Pagamento após a expiração: confirma se o
   horário ainda estiver livre; senão, estorno automático.
5. **Tempo real:** a tela do Pix recebe o novo status por Supabase Realtime
   (Broadcast em canal com nome secreto derivado do link seguro) e atualiza na
   hora; a consulta a cada 8 s é a rede de segurança.
6. E-mail de confirmação com **comprovante do sinal** (valor, forma de pagamento,
   restante a pagar, código da transação e aviso de teste quando for o caso).

## 4. Estados

| Pedido | No banco (`payment_status`) | Rótulo no app |
| --- | --- | --- |
| pendente | `pending` | Sinal pendente |
| pago | `approved` | Sinal pago |
| expirado | `expired` | Pagamento expirado |
| falhou | `rejected` | Pagamento recusado |
| reembolsado | `refund_pending` → `refunded` | Estorno em andamento → Sinal estornado |
| cancelado | `cancelled` | Pagamento cancelado |

Reembolso:

- **Pela política** (cliente cancela pelo link): dentro do prazo, devolve
  `refund_percent`% do sinal (estorno parcial suportado).
- **Pelo painel** (somente admin): Pagamentos → “Estornar”, valor total ou parcial
  (`panel_refund_payment`).
- O worker `process-queue` executa os estornos no gateway com idempotência e
  novas tentativas com espera crescente.

## 5. Variáveis e secrets

**Edge Functions** (secrets do Supabase: `supabase secrets set NOME=valor`):

| Nome | Valor | Observação |
| --- | --- | --- |
| `PAYMENTS_PROVIDER` | `fake` (local) / `mercadopago` | `fake` é bloqueado em produção |
| `PAYMENTS_MODE` | `test` (padrão) / `live` | `test` marca cobranças como teste |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token (teste ou produção) | **Secreto** — nunca no front-end |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta do webhook | Painel do Mercado Pago → Webhooks |
| `FUNCTIONS_PUBLIC_URL` | `https://<ref>.supabase.co/functions/v1` | URL do webhook |
| `APP_URL` | URL pública do app | Retorno do checkout |

**Front-end** (públicas): `VITE_PAYMENTS_MODE=test` (aviso de teste),
`VITE_WHATSAPP_CTA`. O fluxo atual (checkout hospedado) **não precisa** da chave
pública do Mercado Pago; ela só seria usada num checkout embutido (Bricks).

## 6. Como testar cada método

### Local, sem conta (provedor `fake`)

1. `pnpm db:start`, `pnpm functions:serve`, `pnpm dev`.
2. Em `http://localhost:5173/amanda-alves`, escolha um procedimento com sinal.
3. **Pix:** aparece um QR Code de teste e o código copia e cola. Clique em
   **“Simular pagamento aprovado”**: a tela muda sozinha para “Agendamento confirmado!”.
4. **Cartão:** escolha “Cartão”; sem gateway real, use o mesmo botão de simulação.
5. E-mails (com comprovante) em `http://127.0.0.1:54324` (Mailpit).
6. Estorno: painel → Pagamentos → “Estornar”.

### Sandbox do Mercado Pago

1. Crie uma aplicação em *Suas integrações* e copie as **credenciais de teste**.
   Crie **usuários de teste** (vendedor e comprador).
2. `supabase/functions/.env`: `PAYMENTS_PROVIDER=mercadopago`, `PAYMENTS_MODE=test`,
   `MERCADOPAGO_ACCESS_TOKEN=<token de teste do vendedor>`,
   `MERCADOPAGO_WEBHOOK_SECRET=<segredo>`.
3. O webhook precisa de URL pública: publique as funções no Supabase ou use um
   túnel local. Configure em *Webhooks → Pagamentos*:
   `https://<ref>.supabase.co/functions/v1/payments-webhook`.
4. **Cartão:** no checkout, entre com o usuário comprador de teste e use os
   **cartões de teste** da documentação do Mercado Pago (Mastercard, Visa, Amex),
   com o nome do titular definindo o resultado: `APRO` (aprovado), `OTHE`
   (recusado), `CONT` (pendente), entre outros. CVV e validade: os indicados na
   página “Cartões de teste”.
5. **Pix:** pagamentos de teste não são pagos de verdade; para simular a
   aprovação, siga a documentação de testes do Mercado Pago ou use o provedor
   `fake` localmente.
6. Confira o status em Painel → Pagamentos e o comprovante no e-mail.

## 7. Passo a passo para produção

1. Conta Mercado Pago da clínica verificada (CPF/CNPJ, conta bancária).
2. Gerar **credenciais de produção** e o **segredo do webhook**.
3. `supabase secrets set PAYMENTS_PROVIDER=mercadopago PAYMENTS_MODE=live MERCADOPAGO_ACCESS_TOKEN=... MERCADOPAGO_WEBHOOK_SECRET=...`
4. Front-end: `VITE_PAYMENTS_MODE=live` (remove o aviso de teste) e novo deploy.
5. Configurar o webhook de produção apontando para `payments-webhook`.
6. Remover os dados de demonstração (ver `00-LEIA-ME.md`) e cadastrar serviços,
   preços, horários e política oficiais.
7. Fazer **uma compra real de valor baixo** (Pix e cartão), conferir confirmação,
   comprovante e estorno, e só então divulgar o link.
