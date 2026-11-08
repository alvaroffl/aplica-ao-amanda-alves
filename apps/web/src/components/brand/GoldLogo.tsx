import type { CSSProperties } from 'react';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

const SOURCES = {
  /** letreiro completo: monograma + AMANDA + assinatura "Alves" */
  full: { src: '/brand/logo-amanda-alves.webp', ratio: 640 / 383 },
  /** monograma "A" (cabeçalho, ícones) */
  mark: { src: '/brand/monograma.webp', ratio: 128 / 90 },
} as const;

/**
 * Logo em ouro "de verdade", como o letreiro de acrílico espelhado da recepção:
 * a forma vem do arquivo da logo (máscara) e a cor de um gradiente metálico.
 * `animate`: revelação + faixa de luz atravessando; o brilho repete no hover.
 * `halo`: luz quente atrás, como o LED indireto do letreiro.
 */
export function GoldLogo({
  variant = 'full',
  animate = false,
  halo = false,
  decorative = false,
  className,
}: {
  variant?: keyof typeof SOURCES;
  animate?: boolean;
  halo?: boolean;
  /** true quando o nome já aparece em texto ao lado (evita leitura duplicada) */
  decorative?: boolean;
  className?: string;
}) {
  const { src, ratio } = SOURCES[variant];
  const logo = (
    <span
      className={cn('gold-logo', className)}
      data-animate={animate ? 'true' : undefined}
      style={{ '--logo-mask': `url(${src})`, aspectRatio: String(ratio) } as CSSProperties}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': env.appName })}
    />
  );
  if (!halo) return logo;
  return (
    <span className="relative inline-block align-middle">
      <span
        aria-hidden
        className="absolute -inset-[22%] rounded-full bg-[radial-gradient(closest-side,rgb(246_231_168/0.55),rgb(246_231_168/0)_70%)] opacity-90"
      />
      <span className="relative inline-block">{logo}</span>
    </span>
  );
}
