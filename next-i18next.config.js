const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["fr", "en", "ar", "zh", "ru", "fa"],
    localeDetection: false,
  },
  localePath: path.resolve("./public/locales"),
  fallbackLng: "en",
  supportedLngs: ["fr", "en", "ar", "zh", "ru", "fa"],
  defaultNS: "common",
  react: { useSuspense: false },
  reloadOnPrerender: false,
};
