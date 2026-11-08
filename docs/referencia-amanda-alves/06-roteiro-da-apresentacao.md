# Roteiro da apresentação para a Amanda

Duração sugerida: **15 a 20 minutos**. Objetivo: mostrar a experiência da cliente
no celular, o painel da Amanda e o que falta decidir para o lançamento.

> Tudo roda em **modo de teste**: nenhuma cobrança é real e os preços são
> ilustrativos (dados de demonstração). Diga isso logo no início.

## Antes de começar (checklist)

- [ ] App no ar, de um destes jeitos:
  - **Codespaces** (link no README, seção “GitHub Codespaces”), com a porta 5173
    marcada como **Public** para abrir no celular da Amanda;
  - ou no computador: `pnpm db:start`, `pnpm functions:serve`, `pnpm dev --host`.
- [ ] Dados limpos de demonstração: `pnpm db:reset` (recria o seed).
- [ ] Celular com o link da página inicial aberto (o QR Code do link facilita).
- [ ] Notebook com o **painel** logado: `/entrar` → `amanda@demo.test` / `demo12345`.
- [ ] Caixa de e-mails de teste aberta (Mailpit, porta 54324) para mostrar as confirmações.

## 1. A primeira impressão (2 min)

1. No celular, abra a **página inicial**: logo, “Estética Avançada ✦ Naturalidade”,
   os procedimentos e o contato, com a identidade do site dela.
2. Mostre o botão **“Falar com a Amanda”** (abre o WhatsApp da clínica).
3. Comente: a cliente pode **instalar como app** (Adicionar à tela inicial), com o
   ícone do “A” da marca.

## 2. Avaliação gratuita (3 min)

1. Toque em **“Agendar Avaliação Gratuita”** → a avaliação já vem escolhida.
2. Escolha dia e horário (só aparecem horários livres, de terça a sábado).
3. Preencha nome, e-mail e WhatsApp → **Confirmar agendamento**. Sem senha, sem cadastro.
4. Mostre a tela de confirmação: **Google Agenda**, **.ics** e o link para
   **remarcar ou cancelar**.
5. No Mailpit, abra o e-mail: logo, resumo e convite de calendário.

## 3. Procedimento com sinal por Pix (4 min)

1. Volte e escolha **Micro Labial · Hydra Gloss** (sinal de 50% = R$ 125, ilustrativo).
2. Mostre a política na tela (remarcação até 48h, devolução do sinal até 24h).
3. **Continuar para pagamento** → QR Code e **Pix copia e cola**, com o prazo da
   reserva correndo e o aviso **Modo de teste**.
4. Clique em **“Simular pagamento aprovado”**: a tela muda sozinha para
   **“Agendamento confirmado!”** (é o mesmo aviso que o banco envia quando o Pix cai).
5. No Mailpit: e-mail com o **comprovante do sinal**.

Pontos para destacar: o horário fica **reservado só durante o pagamento**; se a
cliente não pagar, ele volta a ficar livre sozinho.

## 4. Cartão (1 min)

Escolha um protocolo, marque **Cartão**: “crédito em até 3x ou débito”. Em
produção a cliente vai para a página segura do Mercado Pago; **nenhum dado de
cartão passa pelo app**.

## 5. O painel da Amanda (5 min)

1. **Agenda**: a reserva feita no celular **aparece sozinha**. Arraste um horário
   para remarcar; clique para ver detalhes, marcar como concluído ou falta.
2. **Disponibilidade**: horários da semana, pausas, **bloqueios** (ex.: curso) e feriados.
3. **Serviços**: mostre que ela mesma edita **preço, duração e sinal**, sem programador.
4. **Pagamentos**: sinais recebidos, forma de pagamento e o botão **Estornar**.
5. **Configurações**: política de remarcação/cancelamento, parcelas, formas de
   pagamento e lembretes (24h e 2h antes, e-mail e WhatsApp).
6. **Relatórios**: ocupação, faltas, faturamento e serviços mais procurados.

## 6. Segurança em um minuto

- Duas clientes tentando o **mesmo horário ao mesmo tempo**: só uma consegue (a
  regra está no banco de dados, não só na tela).
- Cada cliente acessa só a própria reserva, por um link assinado.
- A cliente pode **baixar ou apagar os próprios dados** (LGPD) pelo link.

## 7. Fechamento: o que precisamos dela

Use a lista de [`00-LEIA-ME.md`](00-LEIA-ME.md#o-que-a-amanda-precisa-confirmar-antes-do-lançamento-real):
preços e durações oficiais, política, horários (segunda-feira?), endereço,
formação a exibir, parcelas, logo em vetor, fotos autorizadas e a conta Mercado Pago.

Próximos passos sugeridos: (1) ela envia as definições; (2) cadastramos tudo e
removemos os dados de demonstração; (3) publicamos em um endereço próprio
(ex.: `agendar.amandaalvespmu.com.br`) com o Mercado Pago real; (4) link na bio
do Instagram e no site.

## Perguntas prováveis

| Pergunta | Resposta curta |
| --- | --- |
| Posso mudar preços e horários sozinha? | Sim, pelo painel (Serviços e Disponibilidade), na hora. |
| Quanto custa cada pagamento? | Taxas do Mercado Pago (Pix ~0,99%; crédito ~3,98% a 4,98%, conforme o prazo de recebimento). Confirmar na conta dela. |
| E se a cliente não aparecer? | Marque “Faltou” na agenda; o sinal fica retido conforme a política. Os relatórios mostram a taxa de faltas. |
| A cliente recebe lembrete? | Sim, por e-mail 24h e 2h antes; por WhatsApp quando a API oficial for ativada. |
| Dá para ter recepcionista? | Sim: Equipe → convidar, com acesso limitado (sem financeiro). |
| Os dados ficam seguros? | Banco com acesso por função, links assinados, conexões criptografadas e LGPD. |
