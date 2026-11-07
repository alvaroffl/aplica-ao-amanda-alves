# Identidade visual e tom de voz

## Estilo **[site]**

Minimalista, elegante, acolhedor e sofisticado. O foco é **naturalidade e
autoestima**: muito espaço em branco, fotos do espaço e dos procedimentos e o
símbolo decorativo **✦**.

No app: fundo claro “porcelana”, cartões brancos com bordas suaves, cantos
arredondados, títulos serifados e o ✦ acima do nome da clínica na página pública.

## Tom de voz **[site]**

Acolhedor, delicado, premium e sem exageros.

- Fale com a cliente de forma próxima (“você”), com frases curtas.
- Sem jargão técnico. Prefira “mapeamento do rosto” a termos clínicos.
- **Sem promessas absolutas de resultado** (“resultado garantido”, “para sempre”).
  Use “resultado natural”, “de acordo com a avaliação”, “duração média”.
- Valores e prazos sempre claros (sinal, restante, prazos da política).

Chamadas usadas no site — use as mesmas no app:

| Chamada | Onde no app |
| --- | --- |
| “Agendar Agora” | Link do Instagram/site para `/amanda-alves` |
| “Agendar Avaliação Gratuita” | Serviço “Avaliação gratuita” (primeiro da lista) |
| “Chamar no WhatsApp” / “Falar com a Amanda” | Botão flutuante na página pública (`VITE_WHATSAPP_CTA`) |

## Paleta — **PROPOSTA para aprovação da Amanda**

O site não informa paleta em texto. Proposta coerente com o estilo (tons de pele,
nude e rosé terroso, com champanhe só na decoração). Implementada como tokens
em [`apps/web/src/index.css`](../../apps/web/src/index.css): para ajustar a marca,
altere apenas as variáveis.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--background` | `#FBF8F5` porcelana | `#191412` | Fundo |
| `--foreground` | `#2B2220` café | `#F4EDE8` | Texto |
| `--primary` | `#8A5646` rosé terroso | `#DDB0A0` | Botões, links, destaques |
| `--accent` | `#F5EBE5` nude | `#33282B` | Realces suaves |
| `--secondary` | `#F1E9E3` areia | `#2E2522` | Superfícies secundárias |
| `--muted-foreground` | `#6B5D56` | `#BDAFA7` | Texto de apoio |
| `--gold` | `#B8956A` champanhe | `#CDAE85` | **Só decoração** (✦, filetes) |
| `--success` / `--warning` / `--destructive` | `#2F6A4B` / `#83540F` / `#B4362B` | `#7CC39B` / `#E3B26A` / `#F0877B` | Estados |

Acessibilidade (WCAG 2.1 AA) verificada: texto 14,7:1; texto de apoio ≥ 5,4:1;
primário sobre o fundo 5,7:1; texto sobre o primário 5,9:1; selos ≥ 4,6:1. O
champanhe claro (2,6:1) não é usado em texto. A auditoria automática (axe) roda
nos testes E2E.

## Tipografia — **PROPOSTA**

| Papel | Fonte | Por quê |
| --- | --- | --- |
| Títulos | **Cormorant Garamond** (serifada, variável) | Elegante, editorial, combina com estética premium |
| Texto | **Inter** (sem serifa, variável) | Muito legível no celular, neutra e limpa |

Ambas são de licença livre (SIL OFL) e servidas pelo próprio app (pacotes
`@fontsource-variable/*`), sem depender do Google Fonts em produção. Token:
`--font-display` (títulos `h1` e classe `font-display`).

## Imagens e logo

Enquanto a clínica não envia os arquivos, o app usa **placeholders**: iniciais do
nome no lugar do logo e nenhuma foto. Lista do que pedir: [assets/README.md](assets/README.md).
Os ícones do app instalável (PWA) ainda são os genéricos da plataforma e serão
trocados pelo logo da clínica.
