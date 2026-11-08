import { Link } from 'react-router';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

/** Monograma "A" da marca Amanda Alves (ícone do app). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/monograma.webp"
      alt=""
      width={128}
      height={90}
      decoding="async"
      className={cn('brand-logo h-6 w-auto', className)}
      aria-hidden
    />
  );
}

/** Logo completa (AMANDA Alves), usada em destaque. */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  /** true no topo da página inicial (carrega antes das demais imagens) */
  priority?: boolean;
}) {
  return (
    <img
      src="/brand/logo-amanda-alves.webp"
      alt={env.appName}
      width={640}
      height={383}
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('brand-logo h-24 w-auto', className)}
    />
  );
}

/** Monograma + nome: cabeçalhos e menus. */
export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {/* em telas muito estreitas fica só o monograma (o nome segue para leitores de tela) */}
      <span className="font-display text-lg tracking-wide max-[359px]:sr-only">{env.appName}</span>
    </Link>
  );
}
