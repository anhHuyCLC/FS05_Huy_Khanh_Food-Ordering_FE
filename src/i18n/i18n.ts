import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import viMessages from './vi.json';
import enMessages from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enMessages },
      vi: { translation: viMessages },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already protects from xss
    },
  });

export default i18n;

