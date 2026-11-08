import * as React from 'react';
import { prefersReducedMotion, useFrameCallback } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Veios dourados desenhados por cima da textura: entram "se desenhando" na
 * primeira visita (stroke-dashoffset, uma única vez) e acompanham o parallax.
 */
const VEINS = [
  // pelas bordas, longe do texto central (viewBox 1920×1200, corte "slice")
  'M-40,250 C140,300 230,430 300,570 S430,860 640,1000 S900,1150 1060,1240',
  'M1960,600 C1830,670 1710,800 1650,930 S1510,1120 1380,1240',
  'M-40,980 C60,1010 150,1080 210,1240',
];

/**
 * Parede de mármore branco com veios dourados (como a do salão).
 * - Textura em AVIF/WebP via CSS (`.marble-surface`), retrato ou paisagem.
 * - `parallax`: veios e textura se deslocam levemente com a rolagem e o mouse.
 * - `spot`: luz quente que passa pela parede, como os spots do trilho.
 * - `variant="dark"`: mármore preto com veios dourados (seções escuras).
 * Animações só com transform/opacity; desligadas em movimento reduzido.
 */
export function MarbleBackground({
  variant = 'light',
  parallax = false,
  drawVeins = false,
  spot = false,
  overlay = true,
  className,
}: {
  variant?: 'light' | 'dark';
  parallax?: boolean;
  drawVeins?: boolean;
  spot?: boolean;
  overlay?: boolean;
  className?: string;
}) {
  const layer = React.useRef<HTMLDivElement>(null);
  const light = React.useRef<HTMLDivElement>(null);
  const [motion] = React.useState(() => !prefersReducedMotion());

  useFrameCallback(({ scrollY, pointerX, pointerY }) => {
    const y = Math.min(scrollY, 1200) * 0.12;
    const px = (pointerX - 0.5) * 14;
    const py = (pointerY - 0.5) * 10;
    if (layer.current)
      layer.current.style.transform = `translate3d(${px}px, ${py - y}px, 0) scale(1.08)`;
    if (light.current)
      light.current.style.transform = `translate3d(${(pointerX - 0.5) * 60}vw, ${(pointerY - 0.5) * 40}vh, 0)`;
  }, parallax && motion);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        ref={layer}
        className={cn(
          'absolute -inset-[6%] will-change-transform',
          variant === 'dark' ? 'marble-surface-dark' : 'marble-surface',
        )}
      >
        {drawVeins && (
          <svg
            className="vein-draw absolute inset-0 h-full w-full"
            viewBox="0 0 1920 1200"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="vein-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8a6a1f" />
                <stop offset=".45" stopColor="#d4af37" />
                <stop offset=".6" stopColor="#f6e7a8" />
                <stop offset="1" stopColor="#b8913a" />
              </linearGradient>
            </defs>
            {VEINS.map((d, i) => (
              <path
                key={i}
                d={d}
                pathLength={1}
                stroke="url(#vein-gold)"
                strokeWidth={i === 0 ? 1.8 : 1.2}
                strokeOpacity={variant === 'dark' ? 0.85 : 0.55}
                strokeLinecap="round"
                style={{ '--vein-delay': `${300 + i * 260}ms` } as React.CSSProperties}
              />
            ))}
          </svg>
        )}
      </div>
      {spot && (
        <div
          ref={light}
          className={cn(
            'absolute left-1/2 top-1/3 -ml-[35vmax] -mt-[35vmax] h-[70vmax] w-[70vmax] rounded-full will-change-transform',
            variant === 'dark'
              ? 'bg-[radial-gradient(closest-side,rgb(212_175_55/0.18),transparent)]'
              : 'bg-[radial-gradient(closest-side,rgb(255_244_214/0.75),transparent)]',
            !parallax && motion && 'animate-[spot-sweep_18s_var(--ease-in-out)_infinite]',
          )}
        />
      )}
      {overlay && (
        <div
          className={cn(
            'absolute inset-0',
            variant === 'dark'
              ? 'bg-gradient-to-b from-ink/40 via-ink/55 to-ink/80'
              : 'bg-gradient-to-b from-background/20 via-background/45 to-background/85 dark:from-background/70 dark:via-background/80 dark:to-background/95',
          )}
        />
      )}
    </div>
  );
}
