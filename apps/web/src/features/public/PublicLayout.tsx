import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { initials } from '@/lib/utils';

export function PublicLayout({
  business,
  children,
}: {
  business?: { name: string; logo_url: string | null; slug: string } | null;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-accent/40 via-background to-background">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          {business ? (
            <a href={`/${business.slug}`} className="flex min-w-0 items-center gap-2.5">
              {business.logo_url ? (
                <img src={business.logo_url} alt="" className="size-8 rounded-lg object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
                  {initials(business.name)}
                </span>
              )}
              <span className="truncate font-semibold">{business.name}</span>
            </a>
          ) : (
            <Logo />
          )}
          <div className="flex items-center">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
          <span>{t('common.poweredBy')}</span>
          <Logo className="gap-1 text-xs font-medium [&_svg]:size-4" />
          <span aria-hidden>·</span>
          <a className="underline-offset-2 hover:underline" href="/privacidade">
            {t('common.privacy')}
          </a>
        </p>
      </footer>
    </div>
  );
}
