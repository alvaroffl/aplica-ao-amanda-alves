# Identidade visual e tom de voz

## Estilo **[site]**

Minimalista, elegante, acolhedor e sofisticado. O foco é **naturalidade e
autoestima**: muito espaço em branco, fotos do espaço e dos procedimentos e o
símbolo decorativo **✦**.

No app: fundo marfim, títulos em Playfair Display, rótulos em caixa alta
espaçados e o ✦ como separador, como no site — e, desde a versão "recepção",
os **materiais do salão** (ver abaixo): ao abrir o app, a cliente deve sentir
que acabou de entrar no espaço. Luxo discreto: rosa e dourado são **acentos**
sobre uma base branca e limpa, com muito respiro.

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

## O salão como referência **[salão]**

As três fotos do espaço enviadas pela clínica (salão com parede de mármore e
veios dourados, recepção com letreiro dourado iluminado, entrada com a
cerejeira, o espelho em arco e o capim-dos-pampas) definem a linguagem visual.
Elas aparecem na galeria "O espaço" em
`apps/web/public/brand/espaco/` (AVIF/WebP em 480, 800 e 1125 px).

| Elemento do salão | Tradução no app | Onde |
| --- | --- | --- |
| Mármore branco com veios dourados | Textura procedural leve (5–11 KB, AVIF/WebP) com veios que "se desenham" e parallax sutil | Hero, Procedimentos, faixa do agendamento |
| Mármore escuro | Versão preta com veios dourados | Seção "Agende", cartão da avaliação |
| Letreiro dourado iluminado | Logo em ouro (máscara + gradiente metálico) com brilho na entrada/hover e halo de LED | Hero, rodapé, cabeçalhos (monograma) |
| Cerejeira | Ramos entrando pelos cantos, balançando como com brisa; 15–25 pétalas caindo | Hero, Depoimentos, confirmação do agendamento |
| Espelho em arco com moldura dourada | Molduras em arco (`ArchFrame`) e dias do calendário em arco | A clínica, O espaço, resumo do agendamento |
| Capim-dos-pampas / palha | Acento discreto em SVG | A clínica |
| Porcelanato polido | Reflexo esmaecido da logo | Rodapé |
| Spots quentes do trilho | Luz que acompanha o cursor (só desktop) | Hero, Agende |

## Paleta — **[site]** + **[salão]** (com ajustes de acessibilidade)

Tokens em [`apps/web/src/index.css`](../../apps/web/src/index.css) (claro e escuro).

| Papel | HEX | Uso |
| --- | --- | --- |
| Marfim (fundo) | `#FAF8F3` | `--background` |
| Fundo alternativo | `#F2EEE7` | `--secondary` / `--muted` |
| Texto | `#2B2926` | `--foreground` (13,7:1) |
| Texto secundário | `#68625A` | `--muted-foreground` (5,7:1; 5,2:1 no alternativo) |
| Preto fosco | `#1E1D1B` | `--ink`: seções escuras e rodapé |
| Ouro (gradiente) | `#8A6A1F → #D4AF37 → #F6E7A8 → #C9A24B → #8A6A1F` | `--gold-metal`: logo, filetes, progresso. **Só decoração** no claro (2,3:1) |
| Ouro dos botões | `#C9A24B → #E5C77A` | `--gold-button`, texto `#2B2926` (6,1:1) |
| Ouro para texto | `#7C5F32` | `--gold-text`: rótulos e destaques pequenos (5,6:1; 5,1:1 no alternativo) |
| Rosa cerejeira | `#F8E1E7 → #E79AB0` | `--blossom-*`: pétalas, fundo dos depoimentos — só detalhes |
| Palha / greige / madeira | `#D8BFA0` / `#A39382` / `#5A3A2A` | Acentos de material |
| Teal | `#2F5D62` | Micro-acento, com parcimônia |

Tema escuro: fundo `#161513`, texto `#F4EFE6` (15,9:1), secundário `#B9B1A5`
(8,6:1), ouro de texto `#D9B968` (9,6:1), botões em ouro `#D4AF37` com texto
escuro (8,4:1). Regra: **ouro claro só como decoração ou sobre fundo escuro**.

## Tipografia — **[site]**

| Papel | Fonte | Observação |
| --- | --- | --- |
| Títulos | **Playfair Display** | Mesma do site; peso 500 |
| Texto | **Outfit** | Mesma do site |
| Rótulos | Outfit em caixa alta, espaçamento largo | Classe `.eyebrow` (“ESTÉTICA AVANÇADA ✦ NATURALIDADE”) |

Licença SIL OFL, servidas pelo próprio app (`@fontsource-variable/*`), com
preload das versões latinas.

## Componentes da marca **[técnico]**

Em `apps/web/src/components/brand/` e `components/motion/`:

| Componente | Função |
| --- | --- |
| `MarbleBackground` | Parede de mármore (clara/escura), veios desenhados, parallax e spot de luz |
| `GoldLogo` | Logo/monograma em ouro com brilho e halo |
| `BlossomBranch` | Ramo de cerejeira com balanço e parallax |
| `PetalFall` | Pétalas em canvas (ambiente ou chuva curta), carregado sob demanda |
| `ArchFrame` | Moldura em arco com filete dourado |
| `GlassCard` | Cartão de vidro fosco com borda dourada e reflexo no hover |
| `GoldButton` | CTA em ouro, magnético no desktop, preenchimento de luz no hover |
| `SpaceGallery` | Galeria assimétrica com lightbox (setas do teclado e botões) |
| `Reveal` / `RevealText` | Entrada ao rolar e revelação de título palavra por palavra |
| `PageTransition` | Links com transição "de porta" (View Transitions do navegador) |
| `CursorLight`, `SmoothScroll` | Luz no cursor e rolagem suave (Lenis), só desktop |

## Movimento **[técnico]**

- Só `transform` e `opacity`, 300–800 ms, curva `cubic-bezier(0.22, 1, 0.36, 1)`.
- Nada atrapalha a leitura ou o agendamento: o título aparece primeiro, a
  decoração chega depois; no fluxo de agendamento, só transições curtas.
- **Movimento reduzido** (configuração do aparelho): tudo aparece sem animação,
  sem pétalas, sem rolagem suave e sem cursor de luz.
- Pétalas também ficam desligadas em economia de dados ou aparelhos modestos,
  e pausam fora da tela ou com a aba oculta.
- Toque: nunca há cursor personalizado nem efeito magnético.

## Logo e imagens

- **Logo do app:** a logo oficial do site (`apps/web/public/brand/logo-amanda-alves.webp`),
  pintada em ouro pelo app; aparece na página inicial, no login e nos e-mails.
- **Monograma “A”** (favicon do site): ícone do app instalável (PWA), favicon e
  cabeçalhos (`public/brand/monograma.webp`, `pwa-*.png`, `apple-touch-icon.png`).
- Para trocar por uma versão vetorial, substitua esses arquivos mantendo os nomes.
- **Fotos do espaço:** as três enviadas pela clínica, na galeria "O espaço" e
  em molduras de arco. Fotos de procedimentos e da Amanda continuam pendentes
  (ver [assets/README.md](assets/README.md)).
