import { phoneDigits } from '@agendae/shared/phone';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Canal de apoio: abre uma conversa no WhatsApp da clínica. O texto do botão
 * vem de VITE_WHATSAPP_CTA (ex.: "Falar com a Amanda").
 */
export function WhatsAppButton({ phone }: { phone: string }) {
  const { t } = useTranslation();
  const label = import.meta.env.VITE_WHATSAPP_CTA || t('common.whatsappCta');
  const href = `https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(t('common.whatsappGreeting'))}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring print:hidden"
    >
      <MessageCircle className="size-4" aria-hidden />
      {label}
    </a>
  );
}
