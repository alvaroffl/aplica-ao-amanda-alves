# Escopo e priorização

> Base: [`PESQUISA.md`](./PESQUISA.md). Este documento define **o que entra em cada versão e por quê**, as decisões de arquitetura que afetam o escopo e o plano de entrega por fases.
>
> **Status: aguardando aprovação.** Nada será implementado antes do "de acordo".

---

## 1. Público e proposta

**Para quem:** negócios de serviço presencial com agenda por profissional, como salão, barbearia, estética, clínica, estúdio e consultório. Podem ter **1 ou mais profissionais** e **1 ou mais unidades**.

**Proposta em uma frase:** o cliente marca em menos de um minuto pelo celular, sem criar conta. O negócio reduz faltas com lembrete de WhatsApp e sinal via Pix e **nunca** tem duas reservas no mesmo horário.

**Critério de priorização** (nesta ordem):
1. **Integridade:** nada de reserva duplicada, cobrança indevida ou horário errado.
2. **Conversão da reserva:** menos passos e menos atrito para o cliente.
3. **Redução de faltas:** é o maior prejuízo do segmento (ver PESQUISA §3.1).
4. **Operação diária do negócio:** agenda, clientes e disponibilidade.
5. **Gestão e crescimento:** relatórios, integrações e fidelização.

---

## 2. MVP: o que entra e por quê

O MVP precisa permitir que **um negócio real opere 100% online**: configurar a agenda, receber reservas com sinal, lembrar o cliente e acompanhar os resultados.

### 2.1 Página pública de reserva (cliente)
| Funcionalidade | Justificativa |
|---|---|
| Link próprio `/:slug` (ex.: `/studio-amanda`) e, por unidade, `/:slug/:unidade` | É o canal principal de divulgação (bio do Instagram, WhatsApp) |
| Fluxo em **4 passos**: ① serviço → ② profissional (ou "qualquer um") → ③ data e horário → ④ dados e confirmação | É o padrão Calendly. "Qualquer profissional" aumenta a conversão |
| Pula passos que não fazem sentido (ex.: 1 profissional, ou serviço pré-selecionado pelo link `?servico=`) | Menos toques |
| Horários mostrados **no fuso da unidade**, com o nome do fuso escrito, e aviso de conversão se o fuso do aparelho for diferente | Reclamação recorrente de horário divergente (PESQUISA §3.2) |
| **Reserva sem cadastro**: nome, e-mail e WhatsApp, com consentimento LGPD | Exigir conta é atrito citado em Booksy, Fresha e Avec |
| Política de cancelamento e valor do sinal **visíveis antes de confirmar** | Transparência evita disputa (crítica ao Fresha) |
| Página de confirmação com **adicionar ao calendário** (.ics + link do Google Calendar) e **compartilhar no WhatsApp** | Pedido explícito; o cliente "salva" o compromisso |
| **Reagendar e cancelar por link seguro** (token aleatório; só o hash fica salvo), respeitando a antecedência mínima configurada | Reduz ligações e é um pedido explícito |
| Estados de carregando, vazio ("sem horários nesta data → próxima data livre") e erro | Pedido de UX; evita beco sem saída |

### 2.2 Painel do negócio
| Funcionalidade | Justificativa |
|---|---|
| Cadastro e login (e-mail/senha + link mágico) e onboarding em 3 passos: negócio → serviços → horários | O negócio fica pronto para receber reservas em minutos |
| **Agenda dia / semana / mês**, cor por profissional, filtro por profissional e unidade, **arrastar e soltar para reagendar** e redimensionar | Padrão do segmento e pedido explícito |
| Criar reserva manual (balcão ou telefone), marcar **concluído / falta / cancelado** | Operação diária; alimenta os relatórios de faltas |
| **Disponibilidade:** regras semanais por profissional e unidade (vários intervalos por dia, o que já cobre pausas), folgas, feriados do negócio ou unidade e bloqueios pontuais | É o modelo do Cal.com (o mais maduro) |
| **Serviços:** duração, preço, *buffer* antes e depois, antecedência mínima e máxima, profissionais que atendem e **sinal (nenhum / fixo / %)** | Pedido explícito |
| **Multi-profissional e multi-unidade**, com papéis **admin / profissional / recepção** aplicados por RLS | Pedido explícito; o modelo de dados já nasce assim (migrar depois é caro) |
| **Clientes:** lista, busca, ficha com histórico, observações internas e contagem de faltas | Pedido explícito |
| **Relatórios:** ocupação, taxa de faltas, receita (prevista e realizada) e serviços mais pedidos, filtráveis por período, profissional e unidade | Pedido explícito; mostra a taxa *real* de faltas em vez de promessas |
| Configurações: dados do negócio, slug, fuso, logotipo (Storage), política de cancelamento e integrações | — |

### 2.3 Notificações
| Funcionalidade | Justificativa |
|---|---|
| E-mail transacional: confirmação, reagendamento, cancelamento e lembretes (com .ics anexo) | Canal universal e barato |
| **WhatsApp** pela Cloud API oficial (templates de **utilidade**): confirmação e lembretes | É o canal dominante no Brasil; o lembrete de 24h tem a melhor evidência (PESQUISA §3.1) |
| Lembretes automáticos **24h (padrão) e 2h (configurável)** | Pedido explícito |
| Fila de envio (*outbox*) com tentativas automáticas, registro de entrega e status no painel | Notificação que não chega é a crítica ao SimplyBook |
| Fallback sem custo: botão "enviar pelo WhatsApp" (`wa.me`) no painel quando a API não está configurada | Negócio pequeno começa sem a API da Meta |

### 2.4 Pagamentos
| Funcionalidade | Justificativa |
|---|---|
| **Sinal online por serviço** via **Mercado Pago**: **Pix** (QR + copia e cola) e **cartão** | O Pix é o meio dominante; o MP tem a integração Pix mais documentada (PESQUISA §3.4) |
| A reserva com sinal fica **pré-reservada por 15 min** (`pending_payment`) e é confirmada pelo *webhook* | Evita perder o horário enquanto o cliente paga e libera o horário se ele não pagar |
| Reembolso do sinal conforme a política (cancelou dentro do prazo → estorno automático) | Coerência com a política exibida |
| Camada `PaymentProvider` abstrata | Permite adicionar o Stripe na V2 sem reescrever |

### 2.5 Regras críticas (não negociáveis)
| Regra | Como |
|---|---|
| **Sem reserva duplicada** | `EXCLUDE USING gist (professional_id WITH =, periodo_ocupado WITH &&)` em `bookings` (com `btree_gist`), considerando *buffers* e só os status ativos. A criação acontece numa **função Postgres transacional**, que também revalida a disponibilidade. O front-end só sugere horários. |
| **Idempotência** | O cliente gera uma `idempotency_key` (UUID) por tentativa. Há uma restrição `UNIQUE (business_id, idempotency_key)`, e uma chave repetida devolve a mesma reserva. |
| **Condição de corrida** | A *exclusion constraint* resolve no banco: o segundo `INSERT` concorrente falha com `23P01` e a API responde `409 horário indisponível` com novas sugestões |
| **Rate limiting** | Tabela de janelas por IP (hash) e por e-mail ou telefone, verificada na Edge Function `public-booking` |
| **Captcha** | **Cloudflare Turnstile** (gratuito, sem rastreamento publicitário, melhor para a LGPD que o reCAPTCHA), validado no servidor |
| **Validação** | Os mesmos esquemas **Zod** ficam em pacote compartilhado (`packages/shared`), usados no front-end e nas Edge Functions (Deno) |
| **Fuso** | `timestamptz` (UTC) em tudo. A regra semanal é guardada como hora local + fuso da unidade e expandida para UTC **por data**, o que é seguro em caso de horário de verão |

### 2.6 Qualidade, segurança e LGPD
- **RLS em 100% das tabelas**, com testes automatizados de política (o usuário A não lê dados do negócio B; profissional só edita a própria disponibilidade etc.).
- Página pública **não lê tabelas diretamente**: os horários vêm de uma função `SECURITY DEFINER` que devolve só os intervalos livres, nunca dados de outros clientes.
- **LGPD:** consentimento registrado (data, versão do termo), **exportação** (JSON) e **exclusão** dos dados do cliente. A exclusão anonimiza os dados pessoais e preserva os números agregados dos relatórios. O pedido pode vir do painel (admin) ou do próprio cliente pelo link seguro.
- `.env.example` completo, sem segredos no repositório, e segredos das Edge Functions via `supabase secrets`.
- **PWA instalável**, **modo claro/escuro**, **WCAG AA** (contraste, foco visível, navegação por teclado, `aria-live` nos passos, testes com axe), **i18n** (`i18next`, pt-BR completo, estrutura pronta para en/es).

---

## 3. V2: logo após o MVP

| Funcionalidade | Por que não está no MVP |
|---|---|
| **Lista de espera** (entrar na fila de um dia ou faixa; quando vaga um horário, avisa o 1º da fila com prazo para aceitar; depois avisa o próximo) | **Item pedido, sugiro mover para a V2.** Depende do fluxo de cancelamento e das notificações estarem estáveis e só traz valor com volume. *Se quiser no MVP, custa cerca de 1 fase curta extra; é só dizer.* |
| **Sincronização com o Google Calendar em 2 vias** (eventos externos viram bloqueios; reservas viram eventos) | **Item pedido, sugiro mover para a V2.** Exige OAuth, *watch channels*, renovação de token e reconciliação. É a fonte de bugs mais citada no Calendly. Fazer bem leva tempo. No MVP o profissional já recebe o .ics e o link do Google. |
| **Login opcional do cliente** (link mágico) com "minhas reservas" e dados pré-preenchidos | **Item pedido, sugiro mover para a V2.** No MVP, o link seguro já permite gerenciar a reserva sem conta. O login é conforto, não bloqueio. |
| Stripe como 2º provedor de pagamento | O Mercado Pago cobre Pix e cartão no Brasil. O Stripe é útil para clientes internacionais. |
| Isenção de sinal para clientes de confiança (após N visitas sem falta) e bloqueio de clientes que faltam muito | Refina o sinal depois de medir o uso real |
| Cliente avisa atraso pelo link (inspiração: Trinks) | Diferencial barato, mas não essencial |
| Formulário de perguntas por serviço, salvo no perfil do cliente (inspiração: Acuity) | Útil para clínica e estética; pode esperar |
| Reserva de vários serviços na mesma visita (ex.: corte + barba em sequência) | Complica o motor de horários; melhor fazer sobre uma base estável |
| Exportar relatórios em CSV | Pedido comum, baixo custo |
| Personalização visual da página pública (cor, capa) | O MVP já tem logo e nome |

## 4. V3: crescimento

| Funcionalidade | Por quê |
|---|---|
| Pacotes, assinaturas (clube) e vale-presente | Receita recorrente (Acuity, salões BR) |
| Comissões e financeiro (caixa, comanda) | Trinks e Avec fazem; é outro produto (PDV) |
| Avaliações pós-atendimento (NPS → Google Reviews) | Fidelização e aquisição |
| Aulas e eventos em grupo (vagas por horário) | Novo tipo de agenda |
| Outlook/iCloud, API pública e *webhooks* | Integrações avançadas |
| Agendamento conversacional pelo WhatsApp (IA) | A Avec já oferece; depende de base sólida |
| Marketplace e descoberta de negócios | Muda o modelo de negócio; fora do foco |
| Programa de fidelidade | Depende de pagamentos e histórico maduros |

---

## 5. Decisões de arquitetura que afetam o escopo

| Decisão | Escolha | Motivo |
|---|---|---|
| Estrutura do repositório | Monorepo **pnpm**: `apps/web` (Vite/React), `packages/shared` (Zod, tipos, utilitários de data), `supabase/` (migrations, functions, seed, testes) | Compartilha validação e tipos entre o front-end e as Edge Functions |
| Cálculo de horários livres | **Função Postgres** `get_available_slots(...)` | Mesma fonte de verdade da *constraint*. Conversão de fuso nativa e segura com horário de verão. Não expõe reservas ao público. |
| Criação de reserva pública | Edge Function `public-booking` (captcha, rate limit, Zod) → função Postgres `create_booking(...)` (transação) | Separa a borda (abuso) da regra de negócio (integridade) |
| Agendamentos de tarefas | **pg_cron** chama Edge Functions: envio de notificações (1/min), expiração de pré-reservas (1/min) | Sem infraestrutura extra |
| Tempo real | **Supabase Realtime** na tabela `bookings`, filtrado por negócio | A agenda da recepção atualiza sozinha quando chega uma reserva |
| Calendário do painel | **FullCalendar** (plugins MIT: daygrid, timegrid, interaction) com tema próprio via Tailwind | Dia, semana, mês, arrastar e redimensionar prontos e acessíveis. A visão por recurso (coluna por profissional) é paga, então usamos filtro e cor por profissional. |
| E-mail | **Resend** (API HTTP, simples nas Edge Functions), com driver plugável | Implantação simples; trocável por SMTP |
| WhatsApp | **Meta Cloud API**, com driver plugável (pode virar Z-API, Twilio etc.) e driver `log` em desenvolvimento | API oficial, sem risco de banimento |
| Pagamento | **Mercado Pago** (Pix + cartão) por trás de `PaymentProvider` | Ver PESQUISA §3.4 |
| Captcha | **Cloudflare Turnstile** | Gratuito e com mais privacidade |
| Hospedagem do front-end | **Cloudflare Pages** (deploy pelo GitHub Actions), mais imagem **Docker** (nginx) para auto-hospedagem | Banda grátis ilimitada, bons pontos de presença na América do Sul, *preview* por PR. A Vercel funciona igualmente (configuração incluída). |
| Testes | **Vitest** + Testing Library (unidade e componentes), **pgTAP** (RLS, *constraints*, funções SQL), **Playwright** (fluxo de reserva ponta a ponta + axe) | Cobre as três camadas onde estão os riscos |

### 5.1 Modelo de dados (rascunho)

```
businesses ─┬─ units ──────────────┐
            ├─ business_members (user_id, role: admin|professional|reception)
            ├─ professionals ──── professional_units ─┘
            │       └─ availability_rules (weekday, start_time, end_time, unit_id)
            │       └─ time_off (starts_at, ends_at, kind: folga|bloqueio)
            ├─ holidays (date, unit_id?)
            ├─ services ──── service_professionals
            ├─ clients (LGPD: consent_at, consent_version, anonymized_at)
            ├─ bookings (starts_at, ends_at, buffers, status, idempotency_key,
            │            manage_token_hash, hold_expires_at)  ← EXCLUDE gist
            │       └─ payments (provider, method, status, amount)
            ├─ notifications (outbox: channel, template, scheduled_for, status, attempts)
            └─ audit_log
rate_limits · lgpd_requests
```

O diagrama completo (Mermaid ER) vai para `docs/BANCO.md` na fase de banco.

---

## 6. Plano de entrega por fases

Ao fim de **cada fase** eu rodo build e testes, resumo o que foi feito e **peço confirmação** antes de seguir.

| # | Fase | Entregáveis | Critério de pronto |
|---|---|---|---|
| 0 | Pesquisa + escopo | `docs/PESQUISA.md`, `docs/ESCOPO.md` | **Sua aprovação** ← estamos aqui |
| 1 | Fundação | Monorepo, Vite + TS + Tailwind + shadcn/ui, ESLint/Prettier, Vitest, i18n, tema claro/escuro, CI inicial | `pnpm build`, `pnpm test` e CI verdes |
| 2 | Banco | Migrations versionadas, RLS, *exclusion constraint*, funções `get_available_slots` / `create_booking`, seed, testes pgTAP, `docs/BANCO.md` | Testes de RLS, concorrência e idempotência passando |
| 3 | Backend | Edge Functions (`public-booking`, `manage-booking`, `lgpd`), Zod compartilhado, rate limit, Turnstile | Testes de unidade e integração passando |
| 4 | Painel | Auth, onboarding, agenda (arrastar e soltar), disponibilidade, serviços, profissionais, unidades, clientes, relatórios, permissões | Testes de componentes passando; navegação por teclado ok |
| 5 | Página pública | Fluxo de 4 passos, confirmação, .ics/Google, gerenciar reserva, PWA | Lighthouse ≥ 90 (desempenho e acessibilidade) no celular |
| 6 | Notificações | Outbox, pg_cron, e-mail (Resend), WhatsApp (Cloud API), lembretes 24h/2h | Testes do *dispatcher* passando; tentativas automáticas verificadas |
| 7 | Pagamentos | Mercado Pago (Pix + cartão), pré-reserva com expiração, *webhook* idempotente, estorno conforme política | Testes de *webhook* e de expiração passando |
| 8 | Testes E2E | Playwright: reservar, reagendar, cancelar, conflito concorrente, axe | E2E verde no CI |
| 9 | Deploy | Dockerfile, GitHub Actions (CI + deploy Cloudflare Pages + `supabase db push` + deploy das functions), README completo | Pipeline documentado e reproduzível |

---

## 7. Pontos para você decidir na aprovação

1. **Lista de espera, sincronização com o Google Calendar e login do cliente** vão para a V2 (recomendado) ou ficam no MVP?
2. **Provedor de pagamento:** Mercado Pago primeiro (recomendado) ou Stripe?
3. **Hospedagem do front-end:** Cloudflare Pages (recomendado) ou Vercel?
4. **Nome do produto/marca** para a interface (ex.: nome do negócio da Amanda, ou um nome de plataforma). Até lá, uso um nome provisório configurável por variável de ambiente (`VITE_APP_NAME`).
5. Algum **segmento-alvo** principal (salão/barbearia, clínica, consultoria)? Isso ajusta textos, ícones e dados de exemplo (*seed*).
