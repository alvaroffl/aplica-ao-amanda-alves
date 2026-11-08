import * as React from 'react';

/** Curvas e durações (espelham os tokens --ease-out / --dur-* do CSS). */
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function media(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(query).matches === true;
}

export const prefersReducedMotion = () => media('(prefers-reduced-motion: reduce)');
/** Mouse ou trackpad (nunca em telas de toque). */
export const hasFinePointer = () => media('(hover: hover) and (pointer: fine)');

/** Aparelho modesto ou economia de dados: efeitos pesados ficam desligados. */
export function isConstrainedDevice(): boolean {
  if (typeof navigator === 'undefined') return true;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < 4) return true;
  return false;
}

/** Acompanha a preferência de movimento reduzido (muda em tempo real). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(prefersReducedMotion);
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** true quando o navegador fica ocioso (para carregar efeitos depois do essencial). */
export function useIdle(timeout = 1200): boolean {
  const [idle, setIdle] = React.useState(false);
  React.useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setIdle(true), { timeout });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setIdle(true), timeout);
    return () => window.clearTimeout(id);
  }, [timeout]);
  return idle;
}

/**
 * Executa `onFrame` a cada rolagem/movimento do mouse, no máximo uma vez por
 * quadro (requestAnimationFrame), só com transform/opacity no callback.
 */
export function useFrameCallback(
  onFrame: (state: { scrollY: number; pointerX: number; pointerY: number }) => void,
  enabled: boolean,
) {
  const cb = React.useRef(onFrame);
  cb.current = onFrame;
  React.useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const state = { scrollY: window.scrollY, pointerX: 0.5, pointerY: 0.5 };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        cb.current(state);
      });
    };
    const onScroll = () => {
      state.scrollY = window.scrollY;
      schedule();
    };
    const onPointer = (e: PointerEvent) => {
      state.pointerX = e.clientX / window.innerWidth;
      state.pointerY = e.clientY / window.innerHeight;
      schedule();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    if (hasFinePointer()) window.addEventListener('pointermove', onPointer, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
    };
  }, [enabled]);
}
