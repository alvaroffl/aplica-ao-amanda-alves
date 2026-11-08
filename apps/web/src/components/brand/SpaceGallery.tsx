import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CLINIC, spaceSources } from '@/brand/clinic';
import { ArchFrame } from '@/components/brand/ArchFrame';
import { Reveal } from '@/components/motion/Reveal';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Foto real do espaço em AVIF/WebP responsivo, com carregamento preguiçoso. */
export function SpacePhoto({
  photo,
  alt,
  sizes,
  className,
  eager = false,
}: {
  photo: string;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const src = spaceSources(photo);
  return (
    <picture>
      <source type="image/avif" srcSet={src.avif} sizes={sizes} />
      <source type="image/webp" srcSet={src.webp} sizes={sizes} />
      <img
        src={src.fallback}
        alt={alt}
        width={1125}
        height={2000}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('h-full w-full object-cover', className)}
      />
    </picture>
  );
}

const LAYOUT = [
  'md:col-span-5 aspect-[3/4] md:aspect-[3/4.6]',
  'md:col-span-4 aspect-[3/4] md:mt-24',
  'md:col-span-3 aspect-[3/4.4] md:mt-48',
];

/**
 * "O espaço": fotos reais em molduras de arco, grade assimétrica, zoom suave
 * no hover e lightbox navegável por teclado (setas) e toque (botões).
 */
export function SpaceGallery() {
  const { t } = useTranslation();
  const photos = CLINIC.space;
  const [open, setOpen] = React.useState<number | null>(null);
  const go = (delta: number) =>
    setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length));

  return (
    <>
      <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-12 md:gap-10">
        {photos.map((p, i) => (
          <Reveal
            as="li"
            key={p.key}
            delay={i * 120}
            className={cn(LAYOUT[i], i === 0 && 'sm:col-span-2')}
          >
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group block h-full w-full rounded-t-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label={t('home.space.open', { name: t(`home.space.photos.${p.key}.title`) })}
            >
              <ArchFrame className="h-full">
                <SpacePhoto
                  photo={p.key}
                  alt={t(`home.space.photos.${p.key}.alt`)}
                  sizes="(min-width: 768px) 40vw, (min-width: 640px) 50vw, 100vw"
                  className="transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Expand className="size-4" aria-hidden />
                </span>
              </ArchFrame>
              <span className="mt-4 block text-center">
                <span className="eyebrow block">{t(`home.space.photos.${p.key}.title`)}</span>
              </span>
            </button>
          </Reveal>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent
          className="max-w-[min(92vw,30rem)] gap-3 bg-card/95 p-4 sm:max-w-[30rem]"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          {open !== null && (
            <>
              <DialogTitle className="pr-8 font-display text-xl font-medium">
                {t(`home.space.photos.${photos[open]!.key}.title`)}
              </DialogTitle>
              <DialogDescription>
                {t(`home.space.photos.${photos[open]!.key}.alt`)}
              </DialogDescription>
              <ArchFrame className="mx-auto aspect-[9/16] max-h-[68dvh] w-full">
                <SpacePhoto
                  photo={photos[open]!.key}
                  alt=""
                  sizes="(min-width: 640px) 30rem, 92vw"
                  eager
                />
              </ArchFrame>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm hover:bg-accent"
                >
                  <ChevronLeft className="size-4" aria-hidden /> {t('home.space.prev')}
                </button>
                <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                  {open + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm hover:bg-accent"
                >
                  {t('home.space.next')} <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
