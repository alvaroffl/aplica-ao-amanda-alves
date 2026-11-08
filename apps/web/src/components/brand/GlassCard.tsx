import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cartão de vidro jateado (como a porta da recepção) com filete dourado e um
 * brilho que atravessa no hover.
 */
export function GlassCard<T extends ElementType = 'div'>({
  as,
  className,
  children,
  ...props
}: { as?: T; className?: string; children: ReactNode } & Omit<
  ComponentPropsWithoutRef<T>,
  'as' | 'className' | 'children'
>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={cn(
        'glass group relative overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-out)] group-hover:translate-x-[300%] group-hover:opacity-100 motion-reduce:hidden dark:via-white/10"
      />
      {children}
    </Tag>
  );
}
