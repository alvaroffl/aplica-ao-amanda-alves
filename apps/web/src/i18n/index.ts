import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ptBR from './locales/pt-BR';

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en', label: 'English' },
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { 'pt-BR': { translation: ptBR }, en: { translation: en } },
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en'],
    nonExplicitSupportedLngs: false,
    load: 'currentOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'agendae-lang',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng: string) => (lng.toLowerCase().startsWith('pt') ? 'pt-BR' : lng.split('-')[0] ?? lng),
    },
    returnNull: false,
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
