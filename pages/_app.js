import '../styles/globals.css';
import Head from 'next/head';
import React from 'react';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';

export const LOCALE_MAP = {
  fr: { dir: 'ltr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  en: { dir: 'ltr', label: 'English', short: 'EN', flag: '🇬🇧' },
  ar: { dir: 'rtl', label: 'العربية', short: 'AR', flag: '🇦🇪' },
  zh: { dir: 'ltr', label: '中文', short: 'ZH', flag: '🇨🇳' },
  ru: { dir: 'ltr', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  fa: { dir: 'rtl', label: 'فارسی', short: 'FA', flag: '🇮🇷' },
};

export const LocaleContext = React.createContext({ lang: 'fr', switchLang: () => {} });

function DetectLangWrapper({ children }) {
  const [lang, setLang] = React.useState('fr');
  const router = useRouter();

  React.useEffect(() => {
    // router.locale is the locale Next's own i18n routing actually resolved
    // for THIS render - the same value serverSideTranslations/t() used to
    // produce the page's translated content. Trusting it first guarantees
    // document.dir/lang can never disagree with what's actually on screen.
    // Without this, a prefix-less defaultLocale route (e.g. bare /doctor,
    // which never matches the path regex below) fell through straight to
    // a possibly-stale NEXT_LOCALE cookie from an earlier visit/locale,
    // flipping dir=rtl onto English/French content and visually scrambling
    // digit groups and punctuation via the browser's bidi algorithm.
    if (router.locale && LOCALE_MAP[router.locale]) {
      setLang(router.locale);
      document.cookie = `NEXT_LOCALE=${router.locale};path=/;max-age=31536000;SameSite=Lax`;
      return;
    }
    // Use the real browser path, not router.asPath: on routes rewritten by
    // middleware.js (e.g. /ar/doctor/100 -> /doctor/100 internally),
    // router.asPath can desync from the actual URL and this regex would
    // never match, leaving the page stuck on the default/cookie locale.
    const realPath = typeof window !== 'undefined' ? window.location.pathname : (router.asPath || '');
    const fromPath = realPath.match(/^\/(fr|en|ar|zh|ru|fa)(\/|$)/);
    const qLang = router.query.lang;
    if (fromPath) {
      setLang(fromPath[1]);
      document.cookie = `NEXT_LOCALE=${fromPath[1]};path=/;max-age=31536000;SameSite=Lax`;
    } else if (qLang && LOCALE_MAP[qLang]) {
      setLang(qLang);
      document.cookie = `NEXT_LOCALE=${qLang};path=/;max-age=31536000;SameSite=Lax`;
    } else {
      const cookieLang = document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1];
      if (cookieLang && LOCALE_MAP[cookieLang]) {
        setLang(cookieLang);
      }
    }
  }, [router.locale, router.query.lang, router.asPath]);

  React.useEffect(() => {
    const cur = LOCALE_MAP[lang];
    const dir = cur?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(dir);
  }, [lang]);

  const switchLang = (newLang) => {
    document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000;SameSite=Lax`;
    setLang(newLang);
  };

  return (
    <LocaleContext.Provider value={{ lang, switchLang }}>
      {children}
    </LocaleContext.Provider>
  );
}

function AppInner({ Component, pageProps }) {
  return (
    <DetectLangWrapper>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0066FF" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cairo:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;600;700;800;900&family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A9%BA%3C/text%3E%3C/svg%3E" />
      </Head>
      <Component {...pageProps} />
    </DetectLangWrapper>
  );
}

export default appWithTranslation(AppInner);
