import '../styles/globals.css';
import Head from 'next/head';
import React from 'react';
import { useRouter } from 'next/router';

export const LOCALE_MAP = {
  fr: { dir: 'ltr', label: 'Français', short: 'FR', flag: '🇫🇷' },
  en: { dir: 'ltr', label: 'English', short: 'EN', flag: '🇬🇧' },
  ar: { dir: 'rtl', label: 'العربية', short: 'AR', flag: '🇦🇪' },
};

export const LocaleContext = React.createContext({ lang: 'fr', switchLang: () => {} });

function DetectLangWrapper({ children }) {
  const [lang, setLang] = React.useState('fr');
  const router = useRouter();

  React.useEffect(() => {
    const qLang = router.query.lang;
    if (qLang && LOCALE_MAP[qLang]) {
      setLang(qLang);
      document.cookie = `locale=${qLang};path=/;max-age=31536000;SameSite=Lax`;
    } else {
      const cookieLang = document.cookie.match(/locale=(\w+)/)?.[1];
      if (cookieLang && LOCALE_MAP[cookieLang]) {
        setLang(cookieLang);
      }
    }
  }, [router.query.lang]);

  React.useEffect(() => {
    document.documentElement.dir = LOCALE_MAP[lang]?.dir || 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const switchLang = (newLang) => {
    document.cookie = `locale=${newLang};path=/;max-age=31536000;SameSite=Lax`;
    setLang(newLang);
    const q = new URLSearchParams(window.location.search);
    q.set('lang', newLang);
    window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
  };

  return (
    <LocaleContext.Provider value={{ lang, switchLang }}>
      {children}
    </LocaleContext.Provider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <DetectLangWrapper>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0066FF" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🩺%3C/text%3E%3C/svg%3E" />
      </Head>
      <Component {...pageProps} />
    </DetectLangWrapper>
  );
}
