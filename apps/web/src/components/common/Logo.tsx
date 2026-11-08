import { Link } from 'react-router';
import { GoldLogo } from '@/components/brand/GoldLogo';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

/** Monograma "A" da marca Amanda Alves em ouro (ícone do app). */
export function LogoMark({ className }: { className?: string }) {
  return <GoldLogo variant="mark" decorative className={cn('h-6 w-auto', className)} />;
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
