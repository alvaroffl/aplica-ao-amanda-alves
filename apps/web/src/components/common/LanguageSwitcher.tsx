import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES } from '@/i18n';

/** Alterna entre os idiomas disponíveis (botão simples, sem menu). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const index = SUPPORTED_LANGUAGES.findIndex((l) => l.code === i18n.language);
  const current = SUPPORTED_LANGUAGES[index === -1 ? 0 : index]!;
  const next = SUPPORTED_LANGUAGES[(Math.max(index, 0) + 1) % SUPPORTED_LANGUAGES.length]!;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 px-2"
      onClick={() => void i18n.changeLanguage(next.code)}
      title={`${t('common.language')}: ${current.label}`}
    >
      <Languages aria-hidden />
      {/* o texto visível faz parte do nome acessível (WCAG 2.5.3) */}
      <span className="text-xs font-semibold uppercase">{current.code.slice(0, 2)}</span>
      <span className="sr-only">
        {' '}
        {t('common.language')}: {current.label} → {next.label}
      </span>
    </Button>
  );
}
