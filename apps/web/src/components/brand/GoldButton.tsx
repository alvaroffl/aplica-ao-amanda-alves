import * as React from 'react';
import { Link, type LinkProps } from 'react-router';
import { hasFinePointer, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * CTA dourado: preenchimento de luz no hover e efeito magnético (o botão
 * acompanha levemente o cursor). Sem magnetismo em toque ou movimento reduzido.
 * Navega com transição de página (View Transitions).
 */
export function GoldButton({
  className,
  children,
  size = 'lg',
  ...props
}: LinkProps & { size?: 'sm' | 'lg' }) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const magnetic = React.useRef(false);
  React.useEffect(() => {
    magnetic.current = hasFinePointer() && !prefersReducedMotion();
  }, []);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!magnetic.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.18;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <Link
      ref={ref}
      viewTransition
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        'btn-gold inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&_svg]:size-4',
        size === 'lg' ? 'h-13 px-8 text-base' : 'h-9 px-5 text-sm',
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
