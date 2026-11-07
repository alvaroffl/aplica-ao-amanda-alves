import { Link } from 'react-router';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8', className)} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <rect x="14" y="18" width="36" height="32" rx="6" fill="none" stroke="white" strokeWidth="4" />
      <path d="M14 28h36M24 12v10M40 12v10" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="m25 39 5 5 9-10" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <LogoMark className="size-7" />
      <span>{env.appName}</span>
    </Link>
  );
}
