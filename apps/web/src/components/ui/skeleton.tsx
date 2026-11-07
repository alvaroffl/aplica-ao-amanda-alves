import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div aria-hidden className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
  );
}

export function Spinner({ className, label }: { className?: string; label: string }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 text-sm text-muted-foreground',
        className,
      )}
    >
      <span
        className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
