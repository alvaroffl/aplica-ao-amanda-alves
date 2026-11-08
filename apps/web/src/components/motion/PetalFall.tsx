import * as React from 'react';
import { isConstrainedDevice, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface Petal {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  rot: number;
  spin: number;
  tone: number;
}

const TONES = ['#f8e1e7', '#efb8c7', '#fbeff2', '#e79ab0'];

/**
 * Pétalas de cerejeira caindo devagar (canvas). `ambient`: contínuo e discreto;
 * `burst`: uma chuva curta (ex.: ao confirmar o agendamento).
 * Não roda em movimento reduzido, economia de dados ou aparelhos modestos,
 * e pausa fora da tela ou com a aba oculta. Carregue com React.lazy.
 */
export default function PetalFall({
  count = 18,
  mode = 'ambient',
  className,
}: {
  count?: number;
  mode?: 'ambient' | 'burst';
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [enabled] = React.useState(() => !prefersReducedMotion() && !isConstrainedDevice());

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // no tema escuro as pétalas claras saltam demais: mais transparentes
    const alpha = document.documentElement.classList.contains('dark') ? 0.5 : 0.85;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (initial: boolean): Petal => ({
      x: Math.random() * w,
      y:
        initial && mode === 'ambient'
          ? Math.random() * h
          : -20 - Math.random() * (mode === 'burst' ? h * 0.6 : 40),
      size: 6 + Math.random() * 7,
      speed: (mode === 'burst' ? 60 : 18) + Math.random() * (mode === 'burst' ? 50 : 22),
      drift: 10 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.2,
      tone: Math.floor(Math.random() * TONES.length),
    });
    let petals = Array.from({ length: count }, () => spawn(true));

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.phase)));
      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s);
      ctx.fillStyle = TONES[p.tone]!;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    };

    let visible = true;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of petals) {
        p.phase += dt * 1.4;
        p.y += p.speed * dt;
        p.x += Math.sin(p.phase) * p.drift * dt;
        p.rot += p.spin * dt;
        drawPetal(p);
      }
      if (mode === 'ambient') {
        petals = petals.map((p) => (p.y > h + 20 ? spawn(false) : p));
      } else {
        petals = petals.filter((p) => p.y < h + 20);
        if (petals.length === 0) return; // chuva curta terminou
      }
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      resume();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', resume);
    resume();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', resume);
    };
  }, [enabled, count, mode]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  );
}
