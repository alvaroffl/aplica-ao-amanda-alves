import { AtSign, CalendarHeart, Clock, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CLINIC, whatsappUrl } from '@/brand/clinic';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { BrandLogo, Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';

/** Página inicial do app: a clínica Amanda Alves, no estilo do site oficial. */
export function HomePage() {
  const { t } = useTranslation();
  const book = `/${CLINIC.slug}`;

  return (
    <div className="min-h-dvh bg-background">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Logo />
          <nav className="flex items-center gap-1" aria-label={t('home.nav')}>
            <a
              href="#procedimentos"
              className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              {t('home.procedures')}
            </a>
            <a
              href="#contato"
              className="hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              {t('home.contact')}
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild size="sm" className="ml-1">
              <Link to={book}>{t('home.book')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        {/* Abertura */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-center sm:pt-20">
          <BrandLogo className="mx-auto h-28 sm:h-36" priority />
          <p className="eyebrow mt-8">
            {t('home.eyebrowLeft')} <span aria-hidden>✦</span> {t('home.eyebrowRight')}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl leading-tight sm:text-5xl">
            {t('home.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            {t('home.subtitle')}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to={book}>
                <CalendarHeart aria-hidden /> {t('home.ctaBook')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={`${book}?servico=avaliacao`}>{t('home.ctaEvaluation')}</Link>
            </Button>
          </div>
          <dl className="relative mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4 border-y py-8">
            {(['procedures', 'years', 'natural'] as const).map((k) => (
              <div key={k}>
                <dt className="sr-only">{t(`home.stats.${k}Label`)}</dt>
                <dd className="font-display text-2xl min-[380px]:text-3xl sm:text-4xl">
                  {t(`home.stats.${k}`)}
                </dd>
                <dd className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs sm:uppercase sm:tracking-[0.2em]">
                  {t(`home.stats.${k}Label`)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Quem é Amanda Alves */}
        <section aria-labelledby="sobre" className="bg-secondary/60 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <p className="eyebrow">{t('home.aboutEyebrow')}</p>
            <h2 id="sobre" className="mt-4 text-3xl sm:text-4xl">
              {t('home.aboutTitle')}
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>{t('home.about1')}</p>
              <p>{t('home.about2')}</p>
              <p>{t('home.about3')}</p>
            </div>
            <blockquote className="mx-auto mt-8 max-w-2xl font-display text-xl italic">
              “{t('home.mission')}”
            </blockquote>
          </div>
        </section>

        {/* Procedimentos */}
        <section
          id="procedimentos"
          aria-labelledby="procedimentos-titulo"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24"
        >
          <div className="text-center">
            <p className="eyebrow">{t('home.expertise')}</p>
            <h2 id="procedimentos-titulo" className="mt-4 text-3xl sm:text-4xl">
              {t('home.procedures')}
            </h2>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {CLINIC.procedures.map((p, i) => (
              <li key={p.key} className="flex flex-col bg-card p-8">
                <span className="font-display text-2xl text-gold-text" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-xl">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.text}</p>
                <Link
                  to={book}
                  className="mt-5 text-sm font-medium text-primary underline underline-offset-4"
                >
                  {t('home.bookThis', { name: p.title })}
                </Link>
              </li>
            ))}
            <li className="flex flex-col items-start justify-center bg-primary p-8 text-primary-foreground">
              <p className="font-display text-xl">{t('home.evaluationTitle')}</p>
              <p className="mt-2 text-sm opacity-90">{t('home.evaluationText')}</p>
              <Button asChild variant="secondary" className="mt-5">
                <Link to={`${book}?servico=avaliacao`}>{t('home.ctaEvaluation')}</Link>
              </Button>
            </li>
          </ol>
        </section>

        {/* Frase */}
        <section className="border-y bg-secondary/60 px-4 py-16 text-center">
          <p className="text-gold" aria-hidden>
            ✦
          </p>
          <blockquote className="mx-auto mt-4 max-w-3xl font-display text-2xl italic leading-snug sm:text-3xl">
            “{t('home.quote')}”
          </blockquote>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
            — {CLINIC.name}
          </p>
        </section>

        {/* Contato */}
        <section
          id="contato"
          aria-labelledby="contato-titulo"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24"
        >
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 id="contato-titulo" className="text-3xl sm:text-4xl">
                {t('home.talkTitle')}
              </h2>
              <p className="mt-3 text-muted-foreground">{t('home.talkText')}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to={book}>{t('home.ctaBook')}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href={whatsappUrl(t('common.whatsappGreeting'))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle aria-hidden /> {t('home.whatsapp')}
                  </a>
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-6 border bg-card p-8 text-sm sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-2 font-medium">
                  <Clock className="size-4 text-gold-text" aria-hidden /> {t('home.hours')}
                </dt>
                {CLINIC.hours.map((h) => (
                  <dd key={h.days} className="mt-1 text-muted-foreground">
                    {h.days}: {h.time}
                  </dd>
                ))}
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium">
                  <Mail className="size-4 text-gold-text" aria-hidden /> {t('home.contact')}
                </dt>
                <dd className="mt-1">
                  <a
                    className="text-muted-foreground underline underline-offset-4"
                    href={whatsappUrl()}
                  >
                    {CLINIC.whatsappLabel}
                  </a>
                </dd>
                <dd className="mt-1">
                  <a
                    className="break-all text-muted-foreground underline underline-offset-4"
                    href={`mailto:${CLINIC.email}`}
                  >
                    {CLINIC.email}
                  </a>
                </dd>
                <dd className="mt-1">
                  <a
                    className="inline-flex items-center gap-1 text-muted-foreground underline underline-offset-4"
                    href={CLINIC.instagram}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <AtSign className="size-3.5" aria-hidden /> {CLINIC.instagramHandle}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p className="font-display text-sm tracking-[0.3em] text-foreground">AMANDA ALVES</p>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>© {new Date().getFullYear()} Amanda Alves PMU</span>
          <a className="underline underline-offset-2" href="/privacidade">
            {t('common.privacy')}
          </a>
          <Link className="underline underline-offset-2" to="/painel">
            {t('home.staffArea')}
          </Link>
        </p>
      </footer>
    </div>
  );
}
