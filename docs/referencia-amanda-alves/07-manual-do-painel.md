# Manual do painel (para a Amanda e a equipe)

Acesse **`/entrar`** no endereço do app. A equipe entra por **convite**: a
administradora convida o e-mail em **Equipe**, a pessoa abre o link recebido e
cria o acesso.

| Função | Pode |
| --- | --- |
| **Administradora** | Tudo: serviços, preços, horários, equipe, configurações, pagamentos e estornos, LGPD |
| **Recepção** | Agenda completa, clientes, bloqueios, relatórios e pagamentos (só leitura) |
| **Profissional** | A própria agenda, os próprios horários e bloqueios |

## Agenda

- Visões **Dia, Semana, Mês e Lista**. A agenda **atualiza sozinha** quando uma
  cliente agenda pela página.
- **Novo agendamento**: para clientes que marcam pelo WhatsApp ou telefone. O app
  não deixa dois atendimentos no mesmo horário.
- **Arrastar e soltar** um atendimento muda o horário (a cliente é avisada por e-mail).
- Clique no atendimento para **concluir**, marcar **falta** ou **cancelar** (com ou sem estorno do sinal).

## Clientes

Busca por nome, e-mail ou telefone; histórico de atendimentos, faltas e valores;
observações internas (não aparecem para a cliente). **LGPD**: exportar ou anonimizar
os dados de uma cliente a pedido dela (somente administradora).

## Disponibilidade

- **Horários da semana** por profissional (ex.: terça a sexta 9h–20h, sábado 9h–15h).
  Para fazer pausa, divida o dia em duas faixas (ex.: 9h–12h e 13h–20h).
- **Bloqueios e folgas**: cursos, compromissos, férias. Somem da página de agendamento.
- **Feriados**: dia inteiro fechado.

## Serviços

Nome, descrição, categoria, **duração**, **preço**, **sinal** (nenhum, valor fixo ou
percentual), intervalo de limpeza depois do atendimento, antecedência mínima e
até quantos dias à frente aceitar reservas. Serviço com **preço R$ 0** vira
“Gratuito” e confirma sem pagamento (ex.: avaliação). A chave **“Dado de
demonstração”** marca serviços fictícios.

## Equipe

Profissionais (nome, apresentação, **formação/credenciais** opcional, cor na agenda,
serviços que atende) e convites de acesso por e-mail com a função.

## Pagamentos

Lista de sinais pagos online por atendimento: status (pendente, pago, expirado,
recusado, estornado, cancelado), valor, forma de pagamento (Pix, crédito com
parcelas, débito) e código da transação. **Estornar** devolve o valor total ou
parcial pelo mesmo meio (somente administradora). O selo **Teste** indica
cobranças do modo de teste.

## Relatórios

Por período: total de atendimentos, **ocupação da agenda**, **taxa de faltas**,
faturamento realizado e previsto, sinais recebidos e **serviços mais procurados**.

## Notificações

Histórico dos e-mails e mensagens de WhatsApp enviados às clientes (confirmação,
remarcação, cancelamento e lembretes), com status de envio.

## Configurações

- **Dados da clínica**: nome, descrição, telefone, e-mail, logo e endereço da página.
- **Regras da agenda**: intervalo entre horários e tempo da reserva aguardando sinal.
- **Pagamento online do sinal**: Pix, cartão e número máximo de parcelas.
- **Lembretes**: 24h e 2h antes; envio também por WhatsApp (quando a API estiver ativa).
- **Política de remarcação e cancelamento**: até quantas horas antes a cliente
  remarca, até quando o sinal é devolvido e quanto (%), se ela pode cancelar pelo
  link e um texto livre exibido na reserva e no e-mail.
- **Dados de demonstração**: botão para remover tudo o que é fictício antes do
  lançamento (ver [`00-LEIA-ME.md`](00-LEIA-ME.md)).

## Dicas

- Divulgue o link da página inicial na **bio do Instagram** e no **site**.
- O painel funciona no celular; dá para **instalar como app** (Adicionar à tela inicial).
- Tema claro/escuro e idioma no rodapé do menu.
