# Identidade visual e tom de voz

## Estilo **[site]**

Minimalista, elegante, acolhedor e sofisticado. O foco é **naturalidade e
autoestima**: muito espaço em branco, fotos do espaço e dos procedimentos e o
símbolo decorativo **✦**.

No app: fundo creme, cartões brancos, cantos retos, títulos em Playfair Display,
rótulos em caixa alta espaçados e o ✦ como separador, como no site.

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

## Paleta — **[site]** (com ajustes de acessibilidade)

Extraída do CSS do site oficial e aplicada como tokens em
[`apps/web/src/index.css`](../../apps/web/src/index.css).

| Cor do site | HEX | Uso no app |
| --- | --- | --- |
| Creme (fundo) | `#F9F7F2` | `--background` |
| Fundo alternativo | `#EFECE6` | `--secondary` / `--muted` |
| Texto | `#3C3C3B` | `--foreground` |
| Texto claro | `#6E6E6E` → **`#666660`** | `--muted-foreground` (escurecido para 4,9:1 no fundo alternativo) |
| Dourado | `#BFA070` | `--gold`: **só decoração** (✦, filetes, numeração grande) — 2,3:1 não serve para texto |
| Dourado (texto) | **`#86683A`** | `--gold-text`: rótulos em caixa alta (4,8:1) |
| Oliva | `#6B705C` | `--olive`, anel de foco |
| Oliva escuro | `#4A4E40` | `--primary`: botões e links (texto branco 8,5:1) |

Tema escuro (o site não tem): fundo `#1C1D19`, texto `#F4F1EA`, primário dourado
claro `#CDB287`; a logo é invertida automaticamente (`.brand-logo`).

Cantos retos e discretos (4px), como no site. Contraste verificado pela
auditoria automática (axe) nos testes E2E.

## Tipografia — **[site]**

| Papel | Fonte | Observação |
| --- | --- | --- |
| Títulos | **Playfair Display** | Mesma do site; peso 500 |
| Texto | **Outfit** | Mesma do site |
| Rótulos | Outfit em caixa alta, espaçamento largo | Classe `.eyebrow` (“ESTÉTICA AVANÇADA ✦ NATURALIDADE”) |

Licença SIL OFL, servidas pelo próprio app (`@fontsource-variable/*`).

## Logo e imagens

- **Logo do app:** a logo oficial do site (`apps/web/public/brand/logo-amanda-alves.png`),
  com fundo transparente; aparece na página inicial, no login e nos e-mails.
- **Monograma “A”** (favicon do site): ícone do app instalável (PWA), favicon e
  cabeçalhos (`public/brand/monograma.png`, `pwa-*.png`, `apple-touch-icon.png`).
- Para trocar por uma versão vetorial, substitua esses arquivos mantendo os nomes.
- **Fotos:** ainda não usadas (ver [assets/README.md](assets/README.md)).
