import {
  ArrowRight,
  AtSign,
  CalendarHeart,
  Clock,
  Gem,
  Gift,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLINIC, whatsappUrl } from '@/brand/clinic';
import { ArchFrame } from '@/components/brand/ArchFrame';
import { BlossomBranch } from '@/components/brand/BlossomBranch';
import { GlassCard } from '@/components/brand/GlassCard';
import { GoldButton } from '@/components/brand/GoldButton';
import { GoldLogo } from '@/components/brand/GoldLogo';
import { MarbleBackground } from '@/components/brand/MarbleBackground';
import { SpaceGallery, SpacePhoto } from '@/components/brand/SpaceGallery';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { CursorLight } from '@/components/motion/CursorLight';
import { TransitionLink } from '@/components/motion/PageTransition';
import { Reveal, RevealText } from '@/components/motion/Reveal';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { useIdle } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Efeito mais pesado (canvas) carregado só depois do essencial.
const PetalFall = React.lazy(() => import('@/components/motion/PetalFall'));

const HIGHLIGHT_ICONS = {
  mapping: Gem,
  natural: Sparkles,
  biosafety: ShieldCheck,
  evaluation: Gift,
} as const;

/** Cabeçalho transparente sobre o mármore que vira vidro jateado ao rolar. */
function Header({ book }: { book: string }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    ['#clinica', t('home.nav.clinic')],
    ['#procedimentos', t('home.procedures')],
    ['#espaco', t('home.nav.space')],
    ['#contato', t('home.contact')],
  ] as const;
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,border-color] duration-500',
        scrolled ? 'glass border-x-0 border-t-0' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label={t('home.backToTop')}>
          <GoldLogo variant="mark" decorative className="h-6 w-auto" />
          <span className="font-display text-lg tracking-wide max-[359px]:sr-only">
            {CLINIC.name}
          </span>
        </a>
        <nav className="flex items-center gap-1" aria-label={t('home.nav.label')}>
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="hidden px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground lg:inline"
            >
              {label}
            </a>
          ))}
          <LanguageSwitcher />
          <ThemeToggle />
          <GoldButton to={book} size="sm" className="ml-1">
            {t('home.book')}
          </GoldButton>
        </nav>
      </div>
    </header>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div className="text-center">
      <Reveal as="p" className="eyebrow">
        {eyebrow}
      </Reveal>
      <RevealText id={id} text={title} className="mt-4 text-balance text-3xl sm:text-5xl" />
      <Reveal delay={200} className="gold-hairline mx-auto mt-6 w-24" aria-hidden />
    </div>
  );
}

/** Página inicial: a "recepção" do salão e um passeio pelo espaço. */
export function HomePage() {
  const { t } = useTranslation();
  const book = `/${CLINIC.slug}`;
  const evaluation = `${book}?servico=avaliacao`;
  const idle = useIdle();
  const demoTestimonials = CLINIC.testimonials.some((x) => x.demo);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <SmoothScroll />
      <CursorLight />
      <Header book={book} />

      <main id="conteudo">
        {/* ───────── Recepção (hero) ───────── */}
        <section
          id="inicio"
          aria-labelledby="titulo"
          className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-24"
        >
          <MarbleBackground parallax drawVeins spot />
          <BlossomBranch className="-right-16 top-10 w-[260px] sm:-right-10 sm:top-12 sm:w-[480px] lg:w-[640px]" />
          <BlossomBranch
            side="left"
            depth={0.04}
            className="-bottom-24 -left-24 hidden w-[380px] rotate-180 opacity-80 md:block"
          />
          {idle && (
            <React.Suspense fallback={null}>
              <PetalFall count={18} />
            </React.Suspense>
          )}

          <div className="relative mx-auto w-full max-w-4xl px-4 text-center">
            <GoldLogo animate halo className="mx-auto h-28 w-auto sm:h-40" />
            <Reveal as="p" delay={500} className="eyebrow mt-8">
              {t('home.eyebrowLeft')} <span aria-hidden>✦</span> {t('home.eyebrowRight')}
            </Reveal>
            <RevealText
              as="h1"
              id="titulo"
              text={t('home.title')}
              delay={650}
              className="mx-auto mt-5 max-w-3xl text-balance text-4xl leading-[1.08] sm:text-6xl"
            />
            <Reveal
              as="p"
              delay={950}
              className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground"
            >
              {t('home.subtitle')}
            </Reveal>
            <Reveal
              delay={1100}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <GoldButton to={book}>
                <CalendarHeart aria-hidden /> {t('home.ctaBook')}
              </GoldButton>
              <TransitionLink
                to={evaluation}
                className="inline-flex h-13 items-center rounded-full border border-gold/60 bg-background/60 px-7 text-base font-medium backdrop-blur-sm transition-colors hover:border-gold hover:bg-background/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {t('home.ctaEvaluation')}
              </TransitionLink>
            </Reveal>
          </div>

          <a
            href="#clinica"
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
          >
            {t('home.enter')}
            <span className="relative block h-10 w-px overflow-hidden bg-border" aria-hidden>
              <span className="scroll-cue absolute inset-x-0 top-0 block h-1/2 bg-gold" />
            </span>
          </a>
        </section>

        {/* ───────── A clínica ───────── */}
        <section
          id="clinica"
          aria-labelledby="clinica-titulo"
          className="relative scroll-mt-16 overflow-hidden py-20 sm:py-32"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20">
            <Reveal className="relative mx-auto w-full max-w-sm">
              <img
                src="/brand/pampas.svg"
                alt=""
                aria-hidden
                width={160}
                height={520}
                loading="lazy"
                className="pointer-events-none absolute -left-8 bottom-0 h-[78%] w-auto opacity-80 sm:-left-16"
              />
              <ArchFrame className="relative aspect-[3/4.2]">
                <SpacePhoto
                  photo="recepcao"
                  alt={t('home.space.photos.recepcao.alt')}
                  sizes="(min-width: 768px) 24rem, 90vw"
                />
              </ArchFrame>
            </Reveal>
            <div>
              <Reveal as="p" className="eyebrow">
                {t('home.aboutEyebrow')}
              </Reveal>
              <RevealText
                id="clinica-titulo"
                text={t('home.aboutTitle')}
                className="mt-4 text-balance text-3xl sm:text-5xl"
              />
              <div className="mt-6 space-y-4 text-muted-foreground">
                <Reveal as="p" delay={100}>
                  {t('home.about1')}
                </Reveal>
                <Reveal as="p" delay={180}>
                  {t('home.about2')}
                </Reveal>
                <Reveal as="p" delay={260}>
                  {t('home.about3')}
                </Reveal>
              </div>
              <Reveal
                as="blockquote"
                delay={320}
                className="mt-8 border-l-2 border-gold pl-5 font-display text-xl italic"
              >
                “{t('home.mission')}”
              </Reveal>
              <dl className="relative mt-10 grid grid-cols-3 gap-4 border-t pt-8">
                {(['procedures', 'years', 'natural'] as const).map((k, i) => (
                  <Reveal key={k} delay={i * 100}>
                    <dt className="sr-only">{t(`home.stats.${k}Label`)}</dt>
                    <dd className="text-gold-metal font-display text-3xl sm:text-4xl">
                      {t(`home.stats.${k}`)}
                    </dd>
                    <dd className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs sm:uppercase sm:tracking-[0.2em]">
                      {t(`home.stats.${k}Label`)}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>

          <ul className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {CLINIC.highlights.map((k, i) => {
              const Icon = HIGHLIGHT_ICONS[k];
              return (
                <Reveal as="li" key={k} delay={i * 90} className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold/50 text-gold-text">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg">{t(`home.highlights.${k}.title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`home.highlights.${k}.text`)}
                  </p>
                </Reveal>
              );
            })}
          </ul>
        </section>

        {/* ───────── Procedimentos (vidro jateado sobre mármore) ───────── */}
        <section
          id="procedimentos"
          aria-labelledby="procedimentos-titulo"
          className="relative isolate scroll-mt-16 overflow-hidden py-20 sm:py-32"
        >
          <MarbleBackground className="opacity-70" />
          <BlossomBranch
            side="left"
            depth={0.05}
            className="-left-20 -top-10 w-[280px] opacity-70 sm:w-[420px]"
          />
          <div className="relative mx-auto max-w-6xl px-4">
            <SectionHeading
              eyebrow={t('home.expertise')}
              title={t('home.procedures')}
              id="procedimentos-titulo"
            />
            <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CLINIC.procedures.map((p, i) => (
                <Reveal as="li" key={p.key} delay={i * 90}>
                  <GlassCard className="flex h-full flex-col p-7">
                    <span className="text-gold-metal font-display text-4xl" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-3 font-display text-2xl">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.text}</p>
                    <TransitionLink
                      to={book}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-text underline underline-offset-4"
                    >
                      {t('home.bookThis', { name: p.title })}
                      <ArrowRight className="size-4" aria-hidden />
                    </TransitionLink>
                  </GlassCard>
                </Reveal>
              ))}
              <Reveal as="li" delay={CLINIC.procedures.length * 90}>
                <div className="relative isolate flex h-full flex-col justify-center overflow-hidden rounded-2xl bg-ink p-7 text-[#f4efe6]">
                  <MarbleBackground variant="dark" overlay={false} className="opacity-60" />
                  <div className="relative">
                    <p className="font-display text-2xl">{t('home.evaluationTitle')}</p>
                    <p className="mt-2 text-sm text-[#d9d2c6]">{t('home.evaluationText')}</p>
                    <GoldButton to={evaluation} size="sm" className="mt-6">
                      {t('home.ctaEvaluation')}
                    </GoldButton>
                  </div>
                </div>
              </Reveal>
            </ol>
          </div>
        </section>

        {/* ───────── O espaço ───────── */}
        <section
          id="espaco"
          aria-labelledby="espaco-titulo"
          className="scroll-mt-16 overflow-hidden py-20 sm:py-32"
        >
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading
              eyebrow={t('home.space.eyebrow')}
              title={t('home.space.title')}
              id="espaco-titulo"
            />
            <Reveal as="p" className="mx-auto mt-6 max-w-xl text-center text-muted-foreground">
              {t('home.space.text')}
            </Reveal>
            <div className="mt-14">
              <SpaceGallery />
            </div>
          </div>
        </section>

        {/* ───────── Depoimentos (rosa blush) ───────── */}
        {CLINIC.testimonials.length > 0 && (
          <section
            aria-labelledby="depoimentos-titulo"
            className="relative isolate overflow-hidden bg-blossom-100/60 py-20 sm:py-28 dark:bg-blossom-50"
          >
            <BlossomBranch
              className="-right-24 -top-12 w-[300px] opacity-60 sm:w-[460px]"
              depth={0.04}
            />
            <div className="relative mx-auto max-w-6xl px-4">
              <SectionHeading
                eyebrow={t('home.testimonials.eyebrow')}
                title={t('home.testimonials.title')}
                id="depoimentos-titulo"
              />
              {demoTestimonials && (
                <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted-foreground">
                  {t('home.testimonials.demoNote')}
                </p>
              )}
              <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                {CLINIC.testimonials.map((item, i) => (
                  <Reveal as="li" key={item.name} delay={i * 110}>
                    <GlassCard as="figure" className="flex h-full flex-col p-7">
                      <span
                        className="text-gold-metal font-display text-5xl leading-none"
                        aria-hidden
                      >
                        “
                      </span>
                      <blockquote className="mt-2 flex-1 font-display text-lg italic leading-relaxed">
                        {item.text}
                      </blockquote>
                      <figcaption className="mt-6 text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {item.service}
                        </span>
                      </figcaption>
                    </GlassCard>
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ───────── Agendar (mármore escuro) ───────── */}
        <section
          id="contato"
          aria-labelledby="contato-titulo"
          className="relative isolate scroll-mt-16 overflow-hidden bg-ink py-20 text-[#f4efe6] sm:py-32"
        >
          <MarbleBackground variant="dark" spot className="opacity-90" />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 md:grid-cols-2 md:items-center">
            <div>
              <Reveal as="p" className="eyebrow !text-gold-bright">
                {t('home.talkEyebrow')}
              </Reveal>
              <RevealText
                id="contato-titulo"
                text={t('home.talkTitle')}
                className="mt-4 text-balance text-4xl sm:text-6xl"
              />
              <Reveal as="p" delay={150} className="mt-4 max-w-md text-[#d9d2c6]">
                {t('home.talkText')}
              </Reveal>
              <Reveal delay={250} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <GoldButton to={book}>
                  <CalendarHeart aria-hidden /> {t('home.ctaBook')}
                </GoldButton>
                <a
                  href={whatsappUrl(t('common.whatsappGreeting'))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-[#f4efe6]/40 px-7 text-base font-medium transition-colors hover:border-gold-bright hover:text-gold-bright focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
                >
                  <MessageCircle className="size-4" aria-hidden /> {t('home.whatsapp')}
                </a>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <dl className="grid gap-8 rounded-2xl border border-gold/30 bg-white/[0.04] p-8 text-sm backdrop-blur-sm sm:grid-cols-2">
                <div>
                  <dt className="flex items-center gap-2 font-medium text-gold-bright">
                    <Clock className="size-4" aria-hidden /> {t('home.hours')}
                  </dt>
                  {CLINIC.hours.map((h) => (
                    <dd key={h.days} className="mt-1 text-[#d9d2c6]">
                      {h.days}: {h.time}
                    </dd>
                  ))}
                </div>
                <div>
                  <dt className="flex items-center gap-2 font-medium text-gold-bright">
                    <Mail className="size-4" aria-hidden /> {t('home.contact')}
                  </dt>
                  <dd className="mt-1">
                    <a
                      className="text-[#d9d2c6] underline underline-offset-4 hover:text-gold-bright"
                      href={whatsappUrl()}
                    >
                      {CLINIC.whatsappLabel}
                    </a>
                  </dd>
                  <dd className="mt-1">
                    <a
                      className="break-all text-[#d9d2c6] underline underline-offset-4 hover:text-gold-bright"
                      href={`mailto:${CLINIC.email}`}
                    >
                      {CLINIC.email}
                    </a>
                  </dd>
                  <dd className="mt-1">
                    <a
                      className="inline-flex items-center gap-1 text-[#d9d2c6] underline underline-offset-4 hover:text-gold-bright"
                      href={CLINIC.instagram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <AtSign className="size-3.5" aria-hidden /> {CLINIC.instagramHandle}
                    </a>
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ───────── Rodapé com reflexo de piso polido ───────── */}
      <footer className="relative overflow-hidden bg-ink pb-10 pt-16 text-center text-xs text-[#b9b1a5]">
        <div className="gold-hairline absolute inset-x-0 top-0" aria-hidden />
        <div className="mx-auto w-40">
          <GoldLogo decorative className="h-auto w-full" />
          {/* reflexo num invólucro: a própria logo já usa mask para a forma */}
          <div className="floor-reflection -mt-1">
            <GoldLogo decorative className="h-auto w-full" />
          </div>
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>© {new Date().getFullYear()} Amanda Alves PMU</span>
          <a className="underline underline-offset-2 hover:text-gold-bright" href="/privacidade">
            {t('common.privacy')}
          </a>
          <TransitionLink
            className="underline underline-offset-2 hover:text-gold-bright"
            to="/painel"
          >
            {t('home.staffArea')}
          </TransitionLink>
        </p>
      </footer>
    </div>
  );
}
