/**
 * Dados da marca Amanda Alves usados nas telas institucionais.
 * Fonte: site oficial (https://www.amandaalvespmu.com.br) e
 * docs/referencia-amanda-alves/. Para mudar contatos ou textos, edite aqui.
 */
export const CLINIC = {
  /** slug da página de agendamento (/amanda-alves) */
  slug: import.meta.env.VITE_CLINIC_SLUG || 'amanda-alves',
  name: 'Amanda Alves',
  tagline: 'Estética Avançada',
  whatsapp: '+5532988829364',
  whatsappLabel: '(32) 98882-9364',
  email: 'contato@amandaalvespmu.com.br',
  instagram: 'https://www.instagram.com/amandalves.oficial/',
  instagramHandle: '@amandalves.oficial',
  site: 'https://www.amandaalvespmu.com.br',
  hours: [
    { days: 'Ter – Sex', time: '09h às 20h' },
    { days: 'Sáb', time: '09h às 15h' },
  ],
  /** famílias de procedimentos, na ordem do site */
  procedures: [
    {
      key: 'sobrancelha',
      title: 'Micro Sobrancelha',
      text: 'Fio a fio e shadow com mapeamento facial personalizado: sobrancelhas naturais todos os dias, sem maquiagem.',
    },
    {
      key: 'labial',
      title: 'Micro Labial',
      text: 'Efeito Lip Tint, aveludado e translúcido: revitalização, neutralização e Hydra Gloss.',
    },
    {
      key: 'camuflagem',
      title: 'Camuflagem de Cicatrizes',
      text: 'Arte e técnica para suavizar o contraste de estrias e cicatrizes, devolvendo a uniformidade da pele.',
    },
    {
      key: 'remocao',
      title: 'Remoção a Laser',
      text: 'Remoção de micropigmentação antiga em poucas sessões.',
    },
    {
      key: 'protocolos',
      title: 'Protocolos Exclusivos',
      text: 'Tratamentos faciais personalizados, mediante avaliação, para rejuvenescimento e qualidade de pele.',
    },
  ],
} as const;

export function whatsappUrl(text?: string) {
  const digits = CLINIC.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
