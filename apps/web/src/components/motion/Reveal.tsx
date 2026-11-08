import * as React from 'react';
import { cn } from '@/lib/utils';

/** Observa a entrada na tela uma única vez (IntersectionObserver). */
function useInView<T extends Element>(rootMargin = '0px 0px -10% 0px') {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return [ref, inView] as const;
}

/** Bloco que surge com fade + deslocamento ao entrar na tela (com atraso para stagger). */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType; delay?: number }) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-reveal={inView ? 'in' : ''}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={className}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Título revelado por máscara, palavra por palavra (o texto continua inteiro
 * para leitores de tela e para a quebra de linha natural).
 */
export function RevealText({
  as: Tag = 'h2',
  text,
  stagger = 45,
  delay = 0,
  className,
  id,
}: {
  as?: React.ElementType;
  text: string;
  stagger?: number;
  delay?: number;
  className?: string;
  id?: string;
}) {
  const [ref, inView] = useInView<HTMLElement>();
  const words = text.split(' ');
  return (
    <Tag ref={ref} id={id} data-reveal-text={inView ? 'in' : ''} className={cn(className)}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="reveal-line inline-block pb-[0.12em] align-bottom">
            <span style={{ '--reveal-delay': `${delay + i * stagger}ms` } as React.CSSProperties}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}
