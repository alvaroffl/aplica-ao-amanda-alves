import { Link } from 'react-router';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

/** Monograma "A" da marca Amanda Alves (ícone do app). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/monograma.png"
      alt=""
      width={512}
      height={362}
      className={cn('brand-logo h-6 w-auto', className)}
      aria-hidden
    />
  );
}

/** Logo completa (AMANDA Alves), usada em destaque. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-amanda-alves.png"
      alt={env.appName}
      width={900}
      height={538}
      className={cn('brand-logo h-24 w-auto', className)}
    />
  );
}

/** Monograma + nome: cabeçalhos e menus. */
export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-lg tracking-wide">{env.appName}</span>
    </Link>
  );
}
