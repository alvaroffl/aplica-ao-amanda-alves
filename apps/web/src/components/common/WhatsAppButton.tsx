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
      className="fixed bottom-4 right-4 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg ring-1 ring-gold/50 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-sm:w-12 max-sm:px-0 print:hidden"
    >
      <MessageCircle className="size-4 max-sm:size-5" aria-hidden />
      {/* no celular fica só o ícone, para não cobrir o formulário */}
      <span className="max-sm:sr-only">{label}</span>
    </a>
  );
}
