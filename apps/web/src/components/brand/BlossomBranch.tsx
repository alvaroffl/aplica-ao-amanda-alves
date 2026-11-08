import * as React from 'react';
import { prefersReducedMotion, useFrameCallback } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Ramo de cerejeira (como a árvore que sobe pela parede do salão), entrando
 * por um canto da tela: balança devagar como com brisa e tem parallax leve.
 * Puramente decorativo.
 */
export function BlossomBranch({
  side = 'right',
  depth = 0.08,
  className,
}: {
  side?: 'left' | 'right';
  /** intensidade do parallax (fração da rolagem) */
  depth?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [motion] = React.useState(() => !prefersReducedMotion());
  useFrameCallback(({ scrollY }) => {
    if (ref.current)
      ref.current.style.transform = `translate3d(0, ${Math.min(scrollY, 1400) * -depth}px, 0)`;
  }, motion);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'decor-in pointer-events-none absolute select-none will-change-transform',
        className,
      )}
    >
      <img
        src="/brand/cerejeira.svg"
        alt=""
        width={640}
        height={340}
        decoding="async"
        draggable={false}
        className={cn(
          'branch-sway h-auto w-full',
          side === 'left' ? 'origin-top-left -scale-x-100' : 'origin-top-right',
        )}
      />
    </div>
  );
}
