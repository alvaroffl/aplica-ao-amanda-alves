# Serviços

Cada serviço separa **[site]** (o que vem do site oficial) de **[demo]** (dado
fictício, `is_demo = true`, editável em **Painel → Serviços** sem mexer em código).

Regras gerais **[demo]**: intervalo de limpeza de 15 min após cada procedimento;
antecedência mínima de 24h para procedimentos e 2h para a avaliação; agenda
aberta para até 90 dias (60 para avaliação e retoque).

Resumo dos valores de demonstração:

| Serviço | Sessão | Preço | Sinal | Valor do sinal |
| --- | --- | --- | --- | --- |
| Avaliação gratuita (qualquer serviço) | 30 min | R$ 0 | sem pagamento | — |
| Micro Sobrancelha (Nanoblading e Shadow) | 2h30 | R$ 790 | 30% | R$ 237 |
| Retoque da Micro Sobrancelha (até 45 dias) | 1h30 | R$ 190 | 30% | R$ 57 |
| Micro Labial · Revitalização | 2h30 | R$ 890 | 30% | R$ 267 |
| Micro Labial · Neutralização | 2h30 | R$ 990 | 30% | R$ 297 |
| Micro Labial · Hydra Gloss | 1h | R$ 250 | 50% | R$ 125 |
| Camuflagem de Cicatrizes e Estrias (por sessão) | 1h30 | R$ 450 | 30% | R$ 135 |
| Remoção a Laser (por sessão) | 45 min | R$ 280 | 50% | R$ 140 |
| Protocolo Rejuvenescimento | 1h30 | R$ 350 | 50% | R$ 175 |
| Protocolo Controle de Acne | 1h15 | R$ 280 | 50% | R$ 140 |
| Protocolo Hidratação Profunda | 1h | R$ 220 | 50% | R$ 110 |

O sinal é sempre calculado **no servidor** (`public.compute_deposit`) a partir do
cadastro do serviço; o front-end nunca envia valores. Teste: `packages/shared/test/payments.test.ts`.

---

## Avaliação gratuita

- **[site]** Avaliação gratuita disponível (citada na Micro Sobrancelha; chamada
  “Agendar Avaliação Gratuita”).
- **[demo]** 30 min · R$ 0 · sem pagamento · vale para qualquer serviço. Confirma na hora.

## Micro Sobrancelha (Nanoblading e Shadow)

- **[site]** Fio a fio (nanoblading), shadow e mapeamento facial personalizado.
  Duração média de **8 a 12 meses**, com saída gradual da cor. Tem avaliação gratuita.
- **[demo]** Sessão 2h30 · R$ 790 · sinal 30%.

### Retoque da Micro Sobrancelha

- **[site]** — (o site não detalha o retoque).
- **[demo]** Até **45 dias** após o procedimento · 1h30 · R$ 190 · sinal 30%.

## Micro Labial (efeito Lip Tint)

- **[site]** Efeito Lip Tint, aveludado e translúcido. Variações:
  - **Revitalização:** devolve cor a lábios pálidos.
  - **Neutralização:** clareia lábios escuros ou arroxeados.
  - **Hydra Gloss:** hidratação com ácido hialurônico e vitaminas.
- **[demo]**
  - Revitalização: 2h30 · R$ 890 · sinal 30%.
  - Neutralização: 2h30 · R$ 990 · sinal 30%.
  - Hydra Gloss: 1h · R$ 250 · sinal 50%.

## Camuflagem de Cicatrizes e Estrias

- **[site]** Pigmentos de alta fixação que uniformizam o tom da pele ao redor da
  cicatriz. Materiais esterilizados e normas de biossegurança.
- **[demo]** Por sessão: 1h30 · R$ 450 · sinal 30%.

## Remoção a Laser

- **[site]** Remoção de micropigmentação antiga em poucas sessões.
  A página específica deste serviço não abriu na leitura do site: **não
  acrescentamos nenhum detalhe técnico além desta descrição.**
- **[demo]** Por sessão: 45 min · R$ 280 · sinal 50%.

## Protocolos Exclusivos (gerenciamento de pele)

- **[site]** Rejuvenescimento, Controle de Acne e Hidratação Profunda, sempre após
  avaliação personalizada.
- **[demo]**
  - Rejuvenescimento: 1h30 · R$ 350 · sinal 50%.
  - Controle de Acne: 1h15 · R$ 280 · sinal 50%.
  - Hidratação Profunda: 1h · R$ 220 · sinal 50%.
