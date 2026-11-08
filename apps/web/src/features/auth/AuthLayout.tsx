import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { BrandLogo, Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-accent/60 via-background to-background">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <header className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Logo />
        <div className="flex">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main
        id="conteudo"
        className="flex flex-1 flex-col items-center justify-start gap-6 px-4 py-8 sm:justify-center"
      >
        <BrandLogo className="h-20" />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h1" className="text-xl">
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </main>
      {footer && (
        <footer className="pb-8 text-center text-sm text-muted-foreground">{footer}</footer>
      )}
    </div>
  );
}
