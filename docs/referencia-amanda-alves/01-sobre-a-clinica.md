# Sobre a clínica

Site oficial: <https://www.amandaalvespmu.com.br> · Origem: **[site]** salvo indicação.

## Quem é

**Amanda Alves | Estética Avançada** (assinatura no site: “Amanda Alves PMU”).

Chamada do site: “Estética Avançada ✦ Naturalidade” · “Beleza elevada à sua forma mais autêntica.”

- Mais de **10 anos** de experiência, **+20 mil** procedimentos realizados e
  **100% foco em naturalidade** (números declarados pela clínica no site).
- Abordagem: precisão técnica, sensibilidade estética, respeito às proporções e à
  harmonia facial. Cada atendimento é tratado como um **ritual exclusivo**.
- Missão, nas palavras da Amanda: “Não se trata apenas de estética, mas de como
  você se sente ao se olhar no espelho. Minha missão é devolver essa confiança de
  forma leve, sofisticada e verdadeira.”
- Frase de destaque:

  > “Transformar não é mudar quem você é, mas revelar o potencial que já existe em você.”

### Formação e credenciais — **[confirmar]**

O site **não menciona** formação em biomedicina. Até a confirmação:

- nenhum texto público do app cita biomedicina ou outra formação;
- o perfil da profissional tem o campo opcional **“Formação / credenciais”**
  (`professionals.credentials`), vazio no seed. Ele só aparece na página de
  agendamento quando preenchido no painel (Equipe → editar profissional).

## Contatos

| Canal | Valor | Uso no app |
| --- | --- | --- |
| WhatsApp | (32) 98882-9364 (`+5532988829364`) | Botão “Falar com a Amanda” na página pública; telefone do negócio |
| E-mail | contato@amandaalvespmu.com.br | E-mail de contato do negócio |
| Instagram | @amandalves.oficial | Divulgação do link de agendamento (bio) |
| Endereço | **[confirmar]** — o site não informa | Campo vazio até a Amanda informar |

## Horários de atendimento

| Dia | Horário | Origem |
| --- | --- | --- |
| Segunda | Fechado | [técnico] o site não informa → configurável → **[confirmar]** |
| Terça a sexta | 09h às 20h | [site] |
| Sábado | 09h às 15h | [site] |
| Domingo | Fechado | [site] (não listado) |

No banco, esses horários estão em `availability_rules` (marcados `is_demo = true`
para serem revisados) e podem ser alterados em **Painel → Disponibilidade**.

## Seções do site oficial

Início · A Clínica · Procedimentos · O Espaço (galeria) · Contato.

Equivalência no app:

| Site | App |
| --- | --- |
| Início, A Clínica, Procedimentos, Contato | Página inicial `/` (mesma estrutura e textos) |
| Agendar Agora / Agendar Avaliação Gratuita | `/amanda-alves` e `/amanda-alves?servico=avaliacao` |
| O Espaço (galeria) | Aguarda autorização das fotos (ver `assets/README.md`) |

Os dados de contato e os textos ficam em `apps/web/src/brand/clinic.ts` e nas
traduções (`home.*` em `apps/web/src/i18n/locales/`).
