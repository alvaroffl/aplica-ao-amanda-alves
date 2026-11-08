import * as React from 'react';
import { hasFinePointer, prefersReducedMotion } from '@/lib/motion';

const INTERACTIVE = 'a, button, [role="button"], input, select, textarea, label, summary';

/**
 * Desktop: luz quente que acompanha o cursor (como os spots do trilho) e um
 * anel dourado discreto que cresce sobre elementos clicáveis. O cursor nativo
 * continua visível. Nunca aparece em toque nem com movimento reduzido.
 */
export function CursorLight() {
  const glow = React.useRef<HTMLDivElement>(null);
  const ring = React.useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    setEnabled(hasFinePointer() && !prefersReducedMotion());
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let rx = x;
    let ry = y;
    let hover = false;
    let frame = 0;
    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (glow.current) glow.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current)
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hover ? 1.8 : 1})`;
      frame = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      hover = Boolean((e.target as Element | null)?.closest?.(INTERACTIVE));
      if (ring.current) ring.current.style.opacity = '1';
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      if (ring.current) ring.current.style.opacity = '0';
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] -ml-[260px] -mt-[260px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(246_231_168/0.22),transparent)] mix-blend-soft-light will-change-transform"
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[61] -ml-4 -mt-4 size-8 rounded-full border border-gold opacity-0 transition-[opacity,scale] duration-300 will-change-transform"
      />
    </>
  );
}
