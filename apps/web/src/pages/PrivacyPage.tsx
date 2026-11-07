import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/features/public/PublicLayout';
import { CONSENT_VERSION } from '@agendae/shared';

/** Política de privacidade resumida (modelo — revise com assessoria jurídica). */
export function PrivacyPage() {
  const { t } = useTranslation();
  const sections = ['data', 'purpose', 'sharing', 'retention', 'rights', 'security'] as const;
  return (
    <PublicLayout>
      <article className="prose mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-bold tracking-tight">{t('privacy.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('privacy.version', { version: CONSENT_VERSION })}
        </p>
        <p>{t('privacy.intro')}</p>
        {sections.map((s) => (
          <section key={s} className="space-y-1.5">
            <h2 className="text-lg font-semibold">{t(`privacy.${s}.title`)}</h2>
            <p className="text-muted-foreground">{t(`privacy.${s}.text`)}</p>
          </section>
        ))}
      </article>
    </PublicLayout>
  );
}
