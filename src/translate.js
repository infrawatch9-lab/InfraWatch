import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from '../translationEN.json';
import translationPT from '../translationPT.json';

const resources = {
  en: {
    translation: translationEN,
  },
  pt: {
    translation: translationPT,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt', // Idioma padrão
    interpolation: {
      escapeValue: false, // React já escapa
    },
  });

export default i18n;

// MyComponent.jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <h1>{t('greeting')}</h1>
  );
}