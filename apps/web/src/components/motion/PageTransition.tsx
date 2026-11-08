import { Link, type LinkProps } from 'react-router';

/**
 * Transição de página como "passar por uma porta": usa a View Transitions API
 * nativa (via React Router). O estilo está em index.css
 * (::view-transition-old/new) e é desligado em movimento reduzido.
 * Navegadores sem suporte simplesmente trocam de página.
 */
export function TransitionLink(props: LinkProps) {
  return <Link viewTransition {...props} />;
}
