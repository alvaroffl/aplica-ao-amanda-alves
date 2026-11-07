import * as React from 'react';
import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}

/**
 * Controle segmentado acessível (role="radiogroup"), com setas do teclado.
 * Usado para trocar visões/períodos — diferente de abas, não controla painéis.
 */
export function Segmented<T extends string>({ value, onChange, options, label, className }: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex h-10 items-center rounded-lg bg-muted p-1 text-muted-foreground', className)}>
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-ring',
              checked && 'bg-card text-foreground shadow-sm',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
