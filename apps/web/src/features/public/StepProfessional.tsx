import type { PublicBusiness } from '@agendae/shared';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { initials } from '@/lib/utils';

type Professional = PublicBusiness['professionals'][number];

export function StepProfessional({
  professionals,
  onSelect,
}: {
  professionals: Professional[];
  onSelect: (id: string | 'any') => void;
}) {
  const { t } = useTranslation();
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      <li>
        <button
          type="button"
          onClick={() => onSelect('any')}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
          <span
            className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden
          >
            <Sparkles className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{t('booking.anyProfessional')}</span>
            <span className="block text-sm text-muted-foreground">
              {t('booking.anyProfessionalHint')}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
      </li>
      {professionals.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onSelect(p.id)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="size-11 rounded-full object-cover" />
            ) : (
              <span
                className="flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: p.color }}
                aria-hidden
              >
                {initials(p.name)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{p.name}</span>
              {p.bio && (
                <span className="block truncate text-sm text-muted-foreground">{p.bio}</span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
