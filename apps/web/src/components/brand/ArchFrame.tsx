import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Moldura em arco com filete dourado, como o espelho em arco do salão.
 * Use com uma <img>/<picture> que preencha o espaço (object-cover).
 */
export function ArchFrame({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        'arch bg-[image:var(--gold-metal)] p-[3px] shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <div className={cn('arch relative h-full overflow-hidden bg-secondary', innerClassName)}>
        {children}
      </div>
    </div>
  );
}
