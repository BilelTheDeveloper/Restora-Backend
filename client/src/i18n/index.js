import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enAdmin from './locales/en/admin.json';
import enPublic from './locales/en/public.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frAdmin from './locales/fr/admin.json';
import frPublic from './locales/fr/public.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arAdmin from './locales/ar/admin.json';
import arPublic from './locales/ar/public.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, admin: enAdmin, public: enPublic },
      fr: { common: frCommon, auth: frAuth, admin: frAdmin, public: frPublic },
      ar: { common: arCommon, auth: arAuth, admin: arAdmin, public: arPublic },
    },
    fallbackLng: 'fr',
    supportedLngs: ['en', 'fr', 'ar'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'restora-lang',
    },
    interpolation: { escapeValue: false },
  });

export const applyLang = (lang) => {
  const isRTL = lang === 'ar';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
};

// Apply on load
applyLang(i18n.language?.slice(0, 2) || 'fr');

i18n.on('languageChanged', (lng) => applyLang(lng.slice(0, 2)));

export default i18n;
