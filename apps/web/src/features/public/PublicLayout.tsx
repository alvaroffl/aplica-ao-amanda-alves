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
    <div className="relative isolate flex min-h-dvh flex-col bg-background">
      {/* faixa de mármore no topo, esmaecendo: a "parede" da recepção ao fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] overflow-hidden opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      >
        <div className="marble-surface absolute inset-0" />
      </div>
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
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
      <footer className="relative pb-24 pt-6 text-center text-xs text-muted-foreground">
        <div className="gold-hairline absolute inset-x-0 top-0" aria-hidden />
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
