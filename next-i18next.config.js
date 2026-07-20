const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['fr', 'en', 'ar'],
    localeDetection: false,
  },
  localePath: path.resolve('./public/locales'),
  fallbackLng: 'en',
  supportedLngs: ['fr', 'en', 'ar'],
  defaultNS: 'common',
  react: { useSuspense: false },
  reloadOnPrerender: false,
};
