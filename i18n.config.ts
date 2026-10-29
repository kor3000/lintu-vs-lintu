import type { I18nConfig } from 'next-i18next/proxy'

const i18nConfig: I18nConfig = {
  supportedLngs: ['en', 'fi'],
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  localeInPath: false,
  resourceLoader: (language, namespace) =>
    import(`./app/locales/${language}/${namespace}.json`),
};

export type UiLanguage = {
  code: string;
  localName: string;
};

export const uiLanguages: UiLanguage[] = [
  { code: 'en', localName: 'English' },
  { code: 'fi', localName: 'suomi' }
];

export default i18nConfig
