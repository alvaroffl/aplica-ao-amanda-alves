import * as React from 'react';
import { hasFinePointer, prefersReducedMotion } from '@/lib/motion';

/**
 * Rolagem suave (Lenis) só no desktop, sem movimento reduzido e carregada sob
 * demanda. No celular a rolagem continua nativa (melhor para leitura e para o
 * agendamento). Links de âncora (#secao) também deslizam.
 */
export function SmoothScroll() {
  React.useEffect(() => {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    let destroyed = false;
    let frame = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    void import('lenis').then(({ default: Lenis }) => {
      if (destroyed) return;
      lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 } });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });
    return () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);
  return null;
}
