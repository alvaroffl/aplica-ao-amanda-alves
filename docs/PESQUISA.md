# Pesquisa de referências: plataformas de agendamento

> Data da pesquisa: novembro de 2026.
> **Sobre as fontes:** a maior parte vem de sites de avaliação (Capterra, GetApp, Software Advice), blogs de comparação e páginas dos próprios fornecedores. Preços e limites de plano mudam com frequência e várias fontes se contradizem. Por isso, usei os números como **ordem de grandeza** e não como dado contratual. Onde as fontes divergem, isso está marcado.

---

## 1. Resumo por plataforma

### 1.1 Calendly (EUA, reuniões B2B)
- **Foco:** agendar reuniões 1:1 e em equipe (vendas, recrutamento, consultoria).
- **Fluxo de reserva:** link → calendário do mês → lista de horários → formulário curto → confirmação. São 3 telas e é a referência de "poucos toques".
- **Destaques:** tipos de evento ilimitados (plano pago), *workflows* (lembretes e follow-up), formulários de roteamento e *round-robin* no plano Teams, integrações com CRM, SSO/SCIM no Enterprise.
- **Pontos fortes nas avaliações:** evita conflitos (o horário é bloqueado assim que alguém reserva). O convidado reagenda ou cancela sozinho pelo link.
- **Pontos fracos:** sincronização com o Google Calendar às vezes falha e há relatos de reservas simultâneas. O fluxo é rígido: não aceita assistentes de vários passos nem lógica condicional, e os formulários de roteamento são básicos. Não tem pagamento local (Pix) nem foco em serviços presenciais.
- **Preço (aprox.):** Free, Standard cerca de US$ 10–12 por usuário/mês, Teams cerca de US$ 16–20 por usuário/mês, Enterprise sob consulta.

### 1.2 Cal.com (código aberto, reuniões)
- **Foco:** alternativa aberta e auto-hospedável ao Calendly, voltada a desenvolvedores e empresas.
- **Destaques:** disponibilidade detalhada (horário de trabalho, limites diários, semanais e mensais, *buffers* antes e depois, antecedência mínima), *round-robin*, disponibilidade compartilhada de equipe, API e *webhooks*.
- **Observação:** uma fonte de 2026 diz que o código principal ficou privado e que o sucessor aberto se chama "Cal.diy". Outras avaliações ainda tratam o Cal.com como aberto. **Não confirmado.**
- **Lições para nós:** o modelo de dados de disponibilidade (regras semanais + exceções por data + limites + *buffers*) é a referência técnica mais madura.

### 1.3 Booksy (beleza e barbearia, marketplace)
- **Foco:** salões, barbearias e estética, com app para o cliente e marketplace de descoberta.
- **Destaques:** *No-Show Protection*, que junta sinal (depósito) e taxa de cancelamento configuráveis e permite isentar o cliente após N visitas. Lista de espera que avisa automaticamente quando um horário vaga. Opção de bloquear clientes que faltam muito.
- **Pontos fracos:** a proteção contra faltas recebe avaliações mistas (um relato diz que "não funcionou"). Há relatos de cobrança duplicada, app fora do ar e confusão do cliente quando há vários profissionais. O custo por profissional adicional é alto (cerca de US$ 20/mês cada, sobre uma base de cerca de US$ 30/mês).

### 1.4 Fresha (beleza e bem-estar, marketplace)
- **Foco:** salões e spas, com marketplace e PDV.
- **Destaques:** a reserva pode ser confirmada com depósito ou cartão salvo. Taxas de falta e de cancelamento tardio podem ser aplicadas **por cliente, por serviço, por agendamento ou por valor**. Reserva por página própria, Google e redes sociais.
- **Pontos fracos:** os controles de cancelamento são considerados restritivos. É difícil cobrar a taxa de falta quando o cartão é recusado. Há taxas sobre clientes novos vindos do marketplace e preço pouco transparente (as fontes divergem entre "sem assinatura" e planos por usuário).

### 1.5 SimplyBook.me (genérico, modular)
- **Foco:** pequenos negócios de qualquer segmento, com um modelo de "recursos personalizados" contratados à parte.
- **Pontos fortes:** custo de entrada baixo (há plano grátis), intuitivo e com bom suporte.
- **Pontos fracos:** pagamentos limitados e confusos (é a reclamação mais comum). Curva de aprendizado grande, custo que sobe a cada recurso, personalização visual limitada e **entrega de notificações pouco confiável**, com relatos de travamentos em volume.

### 1.6 Acuity Scheduling (Squarespace)
- **Foco:** coaches, terapeutas e aulas pagas.
- **Destaques:** formulários de anamnese ou triagem dentro da própria reserva, por tipo de serviço. Pacotes, vale-presente e assinaturas.
- **Pontos fracos:** interface datada. O cliente precisa repetir o formulário a cada reserva. Não tem plano grátis, e recursos como SMS e pacotes ficam em planos mais caros.

### 1.7 Trinks (Brasil, beleza, Grupo Stone)
- **Foco:** gestão completa de salão: agenda online, financeiro, estoque, comissões, maquininha (Stone) e app do cliente com busca por localização ou preço.
- **Destaques:** o cliente pode **avisar que vai atrasar**, há programa de fidelidade e escolha de profissional específico. Diz ter mais de 50 mil negócios.
- **Pontos fracos:** poucas avaliações independentes. Um usuário reclamou da dificuldade de encontrar clientes e de horários indisponíveis.

### 1.8 Avec (Brasil, beleza)
- **Foco:** gestão de salão, barbearia, spa e estética, com **agenda com IA no WhatsApp** (o cliente marca, altera ou cancela pelo WhatsApp), comanda digital, comissões, estoque, nota fiscal, BI e várias unidades. Diz ter mais de 40 mil negócios.
- **Pontos fracos:** avaliação na loja (2025) relata que não era possível cancelar um agendamento recém-feito.

---

## 2. Tabela comparativa

Legenda: ✅ tem · ⚠️ parcial, limitado ou só em plano caro · ❌ não tem ou não é o foco · ? não confirmado

| Funcionalidade | Calendly | Cal.com | Booksy | Fresha | SimplyBook | Acuity | Trinks | Avec |
|---|---|---|---|---|---|---|---|---|
| Página pública de reserva com link próprio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reserva sem cadastro do cliente | ✅ | ✅ | ⚠️ (incentiva o app) | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| Escolha de profissional | ⚠️ (round-robin) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Serviços com duração, preço e *buffer* | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Antecedência mínima e máxima | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ? | ? |
| Reagendar e cancelar pelo link | ✅ | ✅ | ✅ | ⚠️ (restritivo) | ✅ | ✅ | ✅ | ⚠️ |
| Lista de espera automática | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ? | ? |
| Sinal ou pré-pagamento | ⚠️ (Stripe/PayPal) | ⚠️ | ✅ | ✅ | ⚠️ (confuso) | ✅ | ✅ | ✅ |
| Pix nativo | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Lembretes por e-mail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lembretes por WhatsApp | ⚠️ | ⚠️ | ❌ (SMS) | ⚠️ | ⚠️ | ❌ (SMS) | ✅ | ✅ (IA) |
| Agenda dia/semana com arrastar e soltar | ❌ (não é o foco) | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Várias unidades | ❌ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Permissões por papel | ✅ (Teams+) | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Cadastro de clientes com histórico | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Relatórios (ocupação, faltas, receita) | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Google Calendar em 2 vias | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ? | ? |
| Comissões e financeiro | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Marketplace de descoberta | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Código aberto ou auto-hospedagem | ❌ | ⚠️ (ver obs.) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Evidências que orientam decisões

### 3.1 Lembretes e faltas (no-show)
- O estudo mais robusto que encontrei (preprint, 475.214 consultas em Buenos Aires, 2023–2024) mostra que **um único lembrete por WhatsApp cerca de 24h antes** reduz faltas em cerca de **8 pontos percentuais** (risco relativo 0,76, sobre uma base de 34,6%). Foi o momento de envio mais eficaz do estudo.
- Um ensaio no Punjab não encontrou efeito significativo. Lembretes ajudam na média, mas não fazem milagre.
- Números de fornecedores ("reduz faltas em 70%") **não têm estudo que os sustente**. Não devemos prometê-los na interface.
- **Decisão:** lembrete de 24h é obrigatório e o de 2h é configurável. O **sinal (depósito)** é a ferramenta complementar mais forte contra faltas, e Booksy e Fresha a colocam no centro do produto.

### 3.2 Fuso horário
Reclamações recorrentes em Square, Zoho e MediRecords:
1. a confirmação por SMS ou e-mail mostra um horário diferente do que o cliente viu na tela;
2. o cliente escolhe o fuso errado quando a página pergunta;
3. viajantes veem o horário no fuso atual do aparelho em vez do fuso do local do atendimento.

**Decisão:** para atendimento **presencial**, os horários aparecem **no fuso da unidade** e o fuso fica escrito por extenso ("Horário de Brasília"). Se o fuso do navegador for diferente, aparece um aviso discreto com a conversão. Todas as mensagens (e-mail, WhatsApp e .ics) usam o mesmo fuso explícito. No banco, tudo é salvo em UTC (`timestamptz`).

### 3.3 WhatsApp Business (API oficial / Cloud API)
- A partir de 1º/10/2026, as fontes dizem que a Meta cobra no Brasil cerca de **R$ 0,035 por mensagem de utilidade** (lembretes e confirmações) e cerca de **R$ 0,32 por mensagem de marketing**, e que passa a cobrar também mensagens de serviço acima de uma franquia. Os valores variam entre fontes e precisam ser confirmados na tabela oficial.
- Lembrete de agendamento é **template de utilidade**. Classificar como marketing custa cerca de 9 vezes mais, e a Meta pode reclassificar o template.
- **Decisão:** usar templates de utilidade aprovados, com envio por provedor plugável (Cloud API da Meta por padrão). Também oferecer o **link `wa.me` sem custo**, para o negócio que ainda não tem a API.

### 3.4 Pagamentos no Brasil
- O Pix é o meio dominante no comércio online brasileiro (as fontes estimam 40–50% do valor).
- **Mercado Pago:** Pix com integração bem documentada (checkout transparente e *webhooks*). Uma fonte aponta tarifa de 0% em Pix direto, enquanto outra lista taxas maiores. **Confirmar com o contrato do cliente.**
- **Stripe:** as fontes **divergem** sobre o Pix nativo para contas brasileiras (algumas falam em parceria com a EBANX). Os prazos de repasse no Brasil são longos.
- **Decisão:** **Mercado Pago como primeiro provedor** (Pix + cartão), com uma camada de abstração `PaymentProvider` que permite adicionar o Stripe depois.

---

## 4. O que adotar

| # | Adotar | Inspiração | Por quê |
|---|---|---|---|
| 1 | Fluxo de reserva em **3–4 passos**, um por tela no celular, com progresso visível | Calendly | É o padrão de mercado de menor atrito |
| 2 | **Reserva sem cadastro** (nome, e-mail, WhatsApp) e login opcional | Calendly, SimplyBook | Exigir app ou conta é atrito citado em Booksy e Fresha |
| 3 | Opção **"Qualquer profissional"** (primeiro disponível) | Cal.com (round-robin), salões | Aumenta a conversão quando o cliente não tem preferência |
| 4 | Disponibilidade = **regras semanais + exceções por data + bloqueios + *buffers* + antecedência mín./máx.** | Cal.com | É o modelo mais maduro e expressivo |
| 5 | **Reagendar e cancelar por link** com política de antecedência clara e exibida **antes** de reservar | Calendly, Booksy | Reduz ligações. A política transparente evita disputa |
| 6 | **Lista de espera** com aviso automático e prazo para o primeiro da fila aceitar | Booksy, Fresha | Reaproveita cancelamentos. Calendly, Cal.com e Acuity não têm |
| 7 | **Sinal configurável por serviço** (fixo ou %), com Pix como primeira opção | Fresha, Booksy | É a ferramenta mais eficaz contra faltas e o Pix é o meio local dominante |
| 8 | Isentar o sinal para clientes de confiança (após N visitas sem falta) | Booksy | Não penaliza quem é fiel |
| 9 | Lembretes de **24h (padrão) e 2h**, por e-mail e WhatsApp | Estudo de Buenos Aires | 24h é o envio com melhor evidência |
| 10 | Cliente pode **avisar atraso** pelo link | Trinks | Diferencial barato e útil (V2) |
| 11 | Formulário de perguntas por serviço, **salvo no perfil** para não repetir | Acuity (e a reclamação sobre ele) | Corrige uma dor citada nas avaliações do Acuity (V2) |
| 12 | Agenda do painel em dia, semana e mês, com **arrastar e soltar** e cor por profissional | Booksy, Fresha, Trinks | É o padrão do segmento de serviços |
| 13 | **Unicidade garantida no banco** (exclusion constraint) | — | As reclamações de reserva duplicada e reservas simultâneas no Calendly mostram que o front-end não basta |

## 5. O que evitar

| Evitar | Visto em | Como evitamos |
|---|---|---|
| Obrigar o cliente a baixar app ou criar conta | Booksy, Fresha, Avec | Reserva como convidado; PWA opcional |
| Taxas escondidas (marketplace, por cliente novo) | Fresha | Sem marketplace no MVP; preço claro |
| Pagamentos confusos ou limitados | SimplyBook | Um provedor bem integrado (Mercado Pago) com estados claros |
| Notificações que não chegam | SimplyBook | Fila com tentativas automáticas, registro de entrega e status visível no painel |
| Horário diferente entre tela e mensagem | Square, MediRecords | Fuso da unidade explícito em toda a comunicação, usando um único formatador |
| Política de cancelamento opaca ou que impede cancelar | Fresha, Avec | Política exibida antes de confirmar; cancelamento sempre possível (o que muda é a devolução do sinal) |
| Repetir o mesmo formulário a cada reserva | Acuity | Pré-preencher com os dados do cliente conhecido |
| Custo por recurso que trava o crescimento | SimplyBook, Acuity | Não se aplica ao produto (é nosso), mas evitamos "recursos pagos" artificiais na arquitetura |
| Sincronização com o Google frágil, que gera conflitos | Calendly | Sincronizar por *webhook* + *polling* de reconciliação; eventos externos viram bloqueios no banco, sujeitos à mesma constraint |
| Interface datada ou só para desktop | Acuity | Mobile-first; testes de acessibilidade (axe) |
| Prometer números de redução de faltas sem evidência | Fornecedores de WhatsApp | Não prometemos; mostramos a taxa real de faltas do próprio negócio nos relatórios |

---

## 6. Fontes

- Calendly, preços e recursos: [automationatlas.io: Calendly pricing 2026](https://automationatlas.io/answers/calendly-pricing-explained-2026/), [automationatlas.io: Calendly review 2026](https://automationatlas.io/answers/calendly-review-2026/), [schedulingkit: Calendly review](https://www.schedulingkit.com/reviews/calendly-review), [cal.com: Calendly pricing](https://cal.com/blog/calendly-pricing), [Capterra: Calendly reviews](https://capterra.com/p/148036/Calendly/reviews/)
- Cal.com: [aiindigo: Cal.com review 2026](https://aiindigo.com/blog/cal-com-review-2026-the-open-source-standard-for-scheduling), [dupple: Cal.com](https://dupple.com/tools/cal-com), [selfhostyourself: Cal.com](https://selfhostyourself.com/services/cal-com)
- Booksy: [Booksy: No-Show Protection](https://biz.booksy.com/en-us/features/no-show-protection), [Booksy: Deposits and Prepayments](https://biz.booksy.com/en-gb/blog/deposits-and-prepayments), [schedulingkit: Booksy review](https://schedulingkit.com/reviews/booksy-review), [makerstack: Booksy review 2026](https://makerstack.co/reviews/booksy-review/), [Calendesk: Booksy vs Fresha](https://calendesk.com/compare/booksy-vs-fresha)
- Fresha: [Fresha: Payments policies overview](https://www.fresha.com/help-center/knowledge-base/payments/613-payments-policies-overview), [Capterra: Fresha](https://capterra.com/p/142138/Shedul-com/), [Software Advice: Fresha](https://www.softwareadvice.com/appointment-scheduling/shedul-profile), [Pabau: Fresha review](https://pabau.com/blog/fresha-review/)
- SimplyBook.me: [Capterra: SimplyBook.me](https://www.capterra.com/p/140086/Simplybook-me/), [zeeg: SimplyBook.me pros and cons](https://zeeg.me/post/simplybookme-pros-and-cons), [GetApp: SimplyBook.me](https://www.getapp.co.uk/reviews/105387/simplybook-me)
- Acuity: [schedulingkit: Acuity review](https://schedulingkit.com/reviews/acuity-scheduling-review), [schedulingkit: Acuity pros and cons](https://schedulingkit.com/pros-and-cons/acuity-pros-and-cons), [Trustpilot: Acuity](https://au.trustpilot.com/review/acuityscheduling.com?page=3)
- Trinks: [Mobile Time: Trinks](https://www.mobiletime.com.br/noticias/04/12/2017/trinks-ajuda-clientes-a-encontrar-salao-de-beleza-e-estabelecimentos-ganham-em-agilidade/), [Capterra: Trinks](https://www.capterra.com/p/252863/Trinks/), [Software Advice: Trinks](https://www.softwareadvice.com/salon/trinks-profile), [Mercado Pago: ferramentas para salão](https://www.mercadopago.com.br/blog/ferramentas-automatizar-agenda-pagamento-salao)
- Avec: [Avec Negócios](https://negocios.avec.app/), [Avec: planos](https://negocios.avec.app/avec-planos), [App Store: Avec](https://apps.apple.com/br/app/avec-servi%C3%A7os-de-beleza/id1394288142), [Capterra BR: programas para salão](https://www.capterra.com.br/blog/2708/programa-salao-beleza)
- Lembretes e faltas: [PMC: estudo sobre lembretes](https://pmc.ncbi.nlm.nih.gov/articles/PMC9258479), [Medos: WhatsApp reminders](https://medos-website.pages.dev/blog/whatsapp-reminders-reduced-no-shows-35-percent), [SimplyBook: automated reminders](https://simplybook.me/en/blog/automated-appointment-reminders)
- Fuso horário: [Solum: time zone handling](https://getsolum.com/time-zone-handling-for-telehealth-scheduling), [Square Seller Community](https://sellercommunity.com/t5/Troubleshooting/Appointments-are-saved-in-my-timezone-but-notifications-are-sent/m-p/153368), [Zoho Bookings: time zone settings](https://help.zoho.com/portal/nl/community/topic/tip-10-various-time-zone-settings-on-the-bookings-page?page=2), [MediRecords FAQ](https://support.medirecords.com/hc/en-us/articles/5659490713103-Why-did-my-patient-receive-a-different-appointment-time-via-SMS-despite-booking-through-the-appointment-widget), [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/a/12659294)
- WhatsApp API, preços BR: [Digisac: preço API outubro 2026](https://digisac.com.br/blog/preco-whatsapp-api-outubro-2026), [ChatMaxima: preços Brasil](https://chatmaxima.com/pt-br/whatsapp-api-pricing/brazil/), [Zenvia: novas regras 2026](https://zenvia.com/novas-regras-cobranca-whatsapp-2026/), [whapi.cloud: cálculo pós-outubro 2026](https://whapi.cloud/blog/pt/how-to-calculate-whatsapp-api-bill-after-october-1-2026-with-examples)
- Pagamentos BR: [ParityDeals: gateways no Brasil 2026](https://www.paritydeals.com/blog/best-payment-gateways-brazil-2026/), [Payment Expert: Stripe Pix](https://paymentexpert.com/2025/08/12/stripe-pix-brtazil-latin-america/), [Techloy: Stripe + EBANX](https://techloy.com/stripe-expands-in-brazil-through-ebanx-pix-payments-integration), [learnwithhasan: Mercado Pago](https://learnwithhasan.com/payment-gateways/mercadopago/), [Forbes BR: Pix 40% do mercado](https://forbes.com.br/geral/2024/01/pix-sera-40-do-mercado-de-pagamentos-online-no-brasil-ate-2026-diz-ebanx/)
