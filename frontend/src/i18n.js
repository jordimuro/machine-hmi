import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import deTranslation from './locales/de/translation.json';
import itTranslation from './locales/it/translation.json';
import frTranslation from './locales/fr/translation.json';
import plTranslation from './locales/pl/translation.json';
import zhTranslation from './locales/zh/translation.json';
import jaTranslation from './locales/ja/translation.json';

const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  de: { translation: deTranslation },
  it: { translation: itTranslation },
  fr: { translation: frTranslation },
  pl: { translation: plTranslation },
  zh: { translation: zhTranslation },
  ja: { translation: jaTranslation },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
