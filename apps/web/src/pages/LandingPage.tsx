import { BellRing, CalendarCheck2, CreditCard, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth';

export function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const features = [
    { icon: Smartphone, key: 'mobile' },
    { icon: CalendarCheck2, key: 'noDouble' },
    { icon: BellRing, key: 'reminders' },
    { icon: CreditCard, key: 'pix' },
    { icon: Users, key: 'team' },
    { icon: ShieldCheck, key: 'lgpd' },
  ] as const;
  return (
    <div className="min-h-dvh bg-gradient-to-b from-accent/70 via-background to-background">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1" aria-label={t('landing.nav')}>
          <LanguageSwitcher />
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to={user ? '/painel' : '/entrar'}>{user ? t('landing.openPanel') : t('auth.signIn')}</Link>
          </Button>
        </nav>
      </header>
      <main id="conteudo">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:pt-20">
          <p className="mx-auto mb-4 w-fit rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {t('landing.badge')}
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">{t('landing.title')}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={user ? '/painel' : '/cadastro'}>{t('landing.ctaStart')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/studio-exemplo">{t('landing.ctaDemo')}</Link>
            </Button>
          </div>
        </section>
        <section aria-labelledby="features" className="mx-auto max-w-6xl px-4 pb-24">
          <h2 id="features" className="sr-only">
            {t('landing.featuresTitle')}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key }) => (
              <li key={key} className="rounded-2xl border bg-card p-6 shadow-xs">
                <Icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold">{t(`landing.features.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`landing.features.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <Link to="/privacidade" className="hover:underline">
          {t('common.privacy')}
        </Link>
      </footer>
    </div>
  );
}
