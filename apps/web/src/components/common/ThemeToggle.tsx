import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/theme';

const ORDER = ['light', 'dark', 'system'] as const;

/** Alterna claro → escuro → automático (botão simples, sem menu: mais leve). */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!;
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`${t('common.theme.toggle')}: ${t(`common.theme.${theme}`)} → ${t(`common.theme.${next}`)}`}
      title={t(`common.theme.${theme}`)}
    >
      <Icon aria-hidden />
    </Button>
  );
}
