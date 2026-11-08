import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export function PublicLayout({
  business,
  children,
}: {
  business?: { name: string; logo_url: string | null; slug: string; phone?: string | null } | null;
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
          {/* app exclusivo: sempre a marca Amanda Alves, voltando para a página inicial */}
          <Logo />
          <div className="flex items-center">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        {children}
      </main>
      {business?.phone && <WhatsAppButton phone={business.phone} />}
      <footer className="border-t pb-24 pt-6 text-center text-xs text-muted-foreground">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© {new Date().getFullYear()} Amanda Alves PMU</span>
          <a className="underline underline-offset-2" href="/privacidade">
            {t('common.privacy')}
          </a>
        </p>
      </footer>
    </div>
  );
}
