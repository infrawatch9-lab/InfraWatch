import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from '../translationEN.json';
import translationPT from '../translationPT.json';

const resources = {
  en: { translation: translationEN },
  pt: { translation: translationPT },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'pt', // idioma padrão salvo
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;