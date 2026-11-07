# Referência — Clínica Amanda Alves

Fonte única de verdade para **design, conteúdo e regras** do app de agendamento
da clínica da Amanda Alves (micropigmentação e estética avançada). Toda tarefa
de produto deve consultar estes arquivos antes de criar telas, textos ou regras.

**Site oficial (referência de identidade e conteúdo):** <https://www.amandaalvespmu.com.br>

> O site é usado só como referência. Não copiamos código, textos longos nem
> fotos dele. Conteúdo do app = original ou arquivos fornecidos pela cliente.
>
> Observação: a leitura automática do site a partir do ambiente de
> desenvolvimento falhou (o domínio não está liberado na rede desse ambiente).
> As informações marcadas como **site oficial** abaixo vieram da leitura do site
> feita pelo responsável pelo projeto e foram repassadas na especificação.

## Índice

| Arquivo | Conteúdo |
| --- | --- |
| [01-sobre-a-clinica.md](01-sobre-a-clinica.md) | Quem é a Amanda, números, missão, contatos, horários, seções do site |
| [02-servicos.md](02-servicos.md) | Os serviços, separando o que é do site e o que é demonstração |
| [03-identidade-visual-e-tom.md](03-identidade-visual-e-tom.md) | Estilo, tom de voz, chamadas, paleta e fontes (proposta) |
| [04-fluxo-de-agendamento.md](04-fluxo-de-agendamento.md) | Fluxo da cliente e regras da agenda |
| [05-pagamentos.md](05-pagamentos.md) | Gateway, métodos, estados, webhook, testes em sandbox e ida para produção |
| [assets/README.md](assets/README.md) | Arquivos a pedir para a Amanda (logo, fotos, autorizações) |

## Origem de cada informação

Legenda: **[site]** site oficial · **[demo]** dado fictício de demonstração ·
**[técnico]** decisão técnica do projeto · **[confirmar]** pendente com a cliente.

| Informação | Origem |
| --- | --- |
| Nome, especialidade, “mais de 10 anos” e “mais de 20 mil procedimentos” | [site] (números declarados pela clínica) |
| Missão, abordagem e frase de destaque | [site] |
| WhatsApp, e-mail e Instagram | [site] |
| Horários terça a sexta 9h–20h e sábado 9h–15h | [site] |
| Segunda-feira fechada | [técnico] o site não informa; configurável no painel → **[confirmar]** |
| Endereço da clínica | **[confirmar]** — não cadastrado (campo vazio) |
| Lista e descrição dos procedimentos | [site] |
| Preço, duração da sessão, sinal e prazo de retoque | [demo] — `is_demo = true` no banco |
| Política de remarcação/cancelamento (48h / 24h) | [demo] — `is_demo = true` |
| Faixas de horário cadastradas, bloqueio de exemplo, clientes e reservas | [demo] — `is_demo = true` |
| Parcelamento em até 3x | [demo] (configuração do negócio, ajustável no painel) |
| Paleta de cores e par de fontes | [técnico] proposta → **[confirmar]** |
| Formação/credenciais (ex.: biomedicina) | **[confirmar]** — campo opcional vazio; nada aparece no app |
| Gateway Mercado Pago e modo de teste | [técnico] ver `05-pagamentos.md` |

## Como os dados de demonstração estão marcados

- **Banco:** coluna `is_demo` em `services`, `availability_rules`, `time_off`,
  `clients`, `bookings` e `booking_policies`. Os pagamentos de exemplo são do
  provedor `fake` com `test_mode = true`.
- **Painel:** aviso “Dados de demonstração” no topo enquanto houver registro demo;
  selo “Demonstração” em serviços e na política; chave “Dado de demonstração” no
  formulário de serviço e da política.
- **Página pública:** nota “Valores, durações e sinais ilustrativos (demonstração)”
  e aviso “Modo de teste: nenhuma cobrança é real” na etapa de pagamento.

### Remover os dados de demonstração (antes do lançamento real)

Escolha um dos caminhos. Todos removem serviços e preços fictícios, faixas de
horário, bloqueio de exemplo, clientes e reservas de exemplo (com os pagamentos
de teste) e **reservas feitas em serviços demo durante a apresentação**. A
política volta ao padrão (24h, 100%) até a oficial ser cadastrada.

1. **Pelo painel (recomendado):** Configurações → “Remover dados de demonstração”
   (somente administradora).
2. **Local:** `pnpm demo:purge` (com o Supabase local rodando).
3. **Produção:** colar [`supabase/scripts/remover-dados-demo.sql`](../../supabase/scripts/remover-dados-demo.sql)
   no SQL Editor do Supabase (ou `psql "$DATABASE_URL" -f supabase/scripts/remover-dados-demo.sql`).

Depois disso, cadastre os serviços, preços, horários e a política oficiais no painel.

## O que a Amanda precisa confirmar antes do lançamento real

- [ ] **Preços, durações das sessões e valor/percentual do sinal** de cada serviço.
- [ ] **Prazo de retoque** da Micro Sobrancelha (usamos “até 45 dias” na demo).
- [ ] **Política de remarcação e cancelamento** (janelas, percentual de devolução, texto).
- [ ] **Horários**: segunda-feira fechada? Pausa para almoço? Feriados e recessos.
- [ ] **Endereço completo** da clínica (para e-mails, convite de calendário e página).
- [ ] **Avaliação gratuita**: duração (30 min na demo) e se vale para todos os serviços.
- [ ] **Formação/credenciais** a exibir (ex.: biomedicina) — só publicar após confirmação.
- [ ] **Parcelamento**: número máximo de parcelas e se os juros ficam com a cliente.
- [ ] **Paleta, fontes e logo** (proposta em `03-identidade-visual-e-tom.md`).
- [ ] **Fotos** do espaço, dos procedimentos e antes/depois **com autorização das clientes**.
- [ ] **Conta Mercado Pago** da clínica (credenciais de produção, dados bancários, CNPJ/CPF).
- [ ] **E-mail remetente** (domínio próprio para o Resend) e **número de WhatsApp** oficial (API).
- [ ] **Textos legais**: política de privacidade (LGPD) e termos, com os dados da clínica.
