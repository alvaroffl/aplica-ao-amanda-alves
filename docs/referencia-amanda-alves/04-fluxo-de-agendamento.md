# Fluxo de agendamento

## Fluxo da cliente (sem cadastro)

1. **Serviço** — lista por categoria (Avaliação, Sobrancelhas, Lábios, Camuflagem,
   Remoção, Protocolos de pele). A avaliação aparece como “Gratuito”.
2. **Data e horário** — só horários livres, no fuso da clínica (America/Sao_Paulo).
   Como há uma profissional, o passo “escolher profissional” é pulado.
3. **Dados** — nome, e-mail, WhatsApp, observações e consentimento LGPD. Mostra a
   política e, se houver sinal, a forma de pagamento (Pix ou cartão).
4. **Pagamento** — só para procedimentos com sinal. O horário fica **pré-reservado**
   por alguns minutos (`booking_hold_min`, 15 min na demo) e é liberado se o
   pagamento expirar.
5. **Confirmação** — tela de confirmação + e-mail com comprovante do sinal, convite
   de calendário (.ics) e link seguro para remarcar/cancelar. WhatsApp opcional.

Página pública: `/amanda-alves`. Link seguro: `/r/<token>` (HMAC, revogável).

## Regras da agenda

| Regra | Como funciona | Onde configurar |
| --- | --- | --- |
| Horário de funcionamento | Só gera horários dentro das faixas semanais | Painel → Disponibilidade |
| Horários ocupados | Bloqueados no banco por **exclusion constraint** (sem dupla reserva, mesmo com cliques simultâneos) | — |
| Bloqueios manuais | Folgas, cursos, compromissos: somem da agenda pública | Painel → Disponibilidade → bloqueios |
| Feriados | Dia inteiro fechado | Painel → Disponibilidade |
| Antecedência mínima/máxima | Por serviço | Painel → Serviços |
| Intervalo de limpeza | Tempo após o procedimento, também bloqueado | Painel → Serviços |
| Avaliação gratuita × procedimento pago | Preço R$ 0 → confirma na hora, sem pagamento; com sinal → pré-reserva + pagamento | Painel → Serviços (preço e sinal) |

## Política de remarcação e cancelamento (configurável por regra)

Tabela `booking_policies` (uma por negócio), editável em **Painel → Configurações**:

| Regra | Demo |
| --- | --- |
| Remarcação gratuita pelo link até N horas antes | 48h |
| Devolução do sinal cancelando até N horas antes | 24h |
| Percentual do sinal devolvido dentro do prazo | 100% |
| Cliente pode remarcar pelo link | sim |
| Cliente pode cancelar pelo link | sim (pré-reservas sempre podem) |
| Texto livre da política | “Remarcação gratuita com até 48h de antecedência. Cancelamentos com menos de 24h não têm o sinal devolvido.” |

As regras valem no **servidor** (`get_booking_by_token`, `reschedule_booking_by_token`,
`cancel_booking_by_token`), não só na tela. Testes: `supabase/tests/database/05_policy_demo_payments.test.sql`.

A clínica pode cancelar e estornar a qualquer momento pelo painel (agenda e
página Pagamentos).

## WhatsApp

- **Canal de apoio:** botão flutuante “Falar com a Amanda” na página pública
  (abre conversa no número da clínica).
- **Canal opcional de confirmações e lembretes (24h e 2h):** API oficial do
  WhatsApp (Meta), ativada em Configurações → Lembretes. Sem a API, tudo segue
  por e-mail.
