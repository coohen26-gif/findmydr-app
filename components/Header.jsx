import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Stethoscope, Menu, X, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { useTranslation } from 'next-i18next';
import { LocaleContext, LOCALE_MAP } from '../pages/_app';

function useSiteBrand() {
  if (typeof window === 'undefined') return { name: 'FindMyDoctor', suffix: '.ae', site: 'findmydr.ae' };
  const host = (window.location.hostname || '').toLowerCase();
  if (host.includes('findmydentist')) return { name: 'FindMyDentist', suffix: '.ae', site: 'findmydentist.ae' };
  return { name: 'FindMyDoctor', suffix: '.ae', site: 'findmydr.ae' };
}

function detectBrandFromPath(pathname) {
  if (!pathname) return null;
  // router.pathname is the matched page route (e.g. "/doctor/[slug]"), which
  // never carries a locale prefix - it already reflects the host-based
  // rewrite done in middleware.js, so no locale-stripping is needed here.
  const clean = pathname.replace(/^\/(fr|en|ar|zh|ru|fa)(\/|$)/, '/');
  if (clean.startsWith('/dentist')) return { name: 'FindMyDentist', suffix: '.ae', site: 'findmydentist.ae' };
  if (clean.startsWith('/doctor')) return { name: 'FindMyDoctor', suffix: '.ae', site: 'findmydr.ae' };
  return null;
}

// Resolve the brand from data available at SSR time - an explicit isDentist
// prop (pages that already compute it from req.headers.host) or the resolved
// route pathname (already host-aware via middleware.js's rewrite). Both are
// identical on server and first client render, unlike window.location.
function resolveBrand(isDentist, pathname) {
  if (typeof isDentist === 'boolean') {
    return isDentist
      ? { name: 'FindMyDentist', suffix: '.ae', site: 'findmydentist.ae' }
      : { name: 'FindMyDoctor', suffix: '.ae', site: 'findmydr.ae' };
  }
  return detectBrandFromPath(pathname);
}

export function Logo({ size = 'md', isDentist }) {
  const router = useRouter();
  const fontSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const defaultBrand = { name: 'FindMyDoctor', suffix: '.ae', site: 'findmydr.ae' };
  // Computed synchronously (no window) so SSR markup and the first client
  // render agree - this is what removes the wrong-brand flash.
  const [brand, setBrand] = React.useState(
    () => resolveBrand(isDentist, router.pathname) || defaultBrand
  );
  React.useEffect(() => {
    const resolved = resolveBrand(isDentist, router.pathname);
    if (resolved) {
      setBrand(resolved);
      return;
    }
    // Last-resort client-only correction for pages that pass neither an
    // isDentist prop nor render under a /doctor or /dentist route.
    setBrand(useSiteBrand());
  }, [isDentist, router.pathname]);

  const brandPrefix = brand.name.slice(0, 6); // "FindMy"
  const brandWord = brand.name.slice(6); // "Doctor" | "Dentist"

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-white shadow-sm group-hover:shadow-md transition-shadow">
        <Stethoscope className="h-5 w-5" />
      </div>
      <div className={cn('font-extrabold tracking-tight', fontSize)}>
        <span className="text-foreground">{brandPrefix}</span>
        <span className="text-primary">{brandWord}</span>
        <span className="text-foreground">{brand.suffix}</span>
      </div>
    </Link>
  );
}

export function SearchBar({ placeholder = 'Médecin, spécialité, clinique…', className, size = 'md', onSearch, value }) {
  const { t } = useTranslation('common');
  const [q, setQ] = useState(value ?? '');
  // Stay in sync with an externally-controlled value (e.g. a page deriving
  // the current query from the URL) without breaking callers that never
  // pass `value` at all - those keep the original fully-uncontrolled behavior.
  useEffect(() => {
    if (value !== undefined) setQ(value);
  }, [value]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };
  const isLarge = size === 'lg';
  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <button
        type="submit"
        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer z-10"
        aria-label={t("nav.search_button")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      </button>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border-0 ring-1 ring-border focus:ring-2 focus:ring-primary outline-none',
          isLarge ? 'pl-12 pr-32 h-14 text-base' : 'pl-11 pr-4 h-11 text-sm',
          'shadow-lg'
        )}
      />
      {isLarge && (
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-11 px-5 rounded-md bg-primary text-white font-semibold hover:bg-primary-600 transition-colors text-sm"
        >
          Rechercher
        </button>
      )}
    </form>
  );
}

function LangSelector() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { lang, switchLang } = useContext(LocaleContext);
  const [open, setOpen] = useState(false);

  const current = LOCALE_MAP[lang] || LOCALE_MAP.fr;

  const SUPPORTED_LANGS = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];
  const LOCALE_REGEX = new RegExp(`^/(${SUPPORTED_LANGS.join('|')})(/|$)`);

  // Use the real browser URL, not router.asPath: on this app's hybrid
  // middleware+built-in-i18n routing, asPath can already be locale-stripped
  // (or not) depending on how the current page was reached client-side,
  // which produced double-prefixed URLs like /fr/en/doctor?id=707. Same
  // desync documented in _app.js's DetectLangWrapper for the same reason.
  const realPathWithSearch = () =>
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : (router.asPath || '/');

  const stripLocale = (path) => {
    const cleaned = path.replace(LOCALE_REGEX, '/');
    return cleaned === '' ? '/' : cleaned;
  };

  const switchTo = (code) => {
    if (!SUPPORTED_LANGS.includes(code)) return;
    const realPath = realPathWithSearch();
    const stripped = stripLocale(realPath);
    let nextPath;
    if (realPath === '/' || realPath === '') {
      nextPath = `/${code}`;
    } else if (stripped === '/') {
      nextPath = `/${code}/`;
    } else {
      nextPath = `/${code}${stripped}`;
    }
    setOpen(false);
    switchLang(code);
    // Hard navigation (not router.push): guarantees middleware runs and the
    // page is served fresh for the target locale, avoiding any client-side
    // routing mismatch between this app's custom locale system and Next's
    // built-in i18n page matching (which caused the double-prefix 404).
    window.location.href = nextPath;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label={t("nav.change_language")}
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs font-semibold">{current.short}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-40 rounded-lg border border-border bg-white shadow-xl z-20 py-1.5">
            {Object.entries(LOCALE_MAP).map(([code, locale]) => (
              <button
                key={code}
                onClick={() => switchTo(code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  lang === code ? 'bg-primary-50 text-primary font-semibold' : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{locale.flag}</span>
                <span>{locale.label}</span>
                {lang === code && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Desktop "logged in" affordance: turns the previously-dead "My account"
// button into a small dropdown with a working logout action, reusing the
// same open/click-outside pattern as LangSelector above.
function UserMenu({ t, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        {t('nav.my_account')}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-44 rounded-lg border border-border bg-white shadow-xl z-20 py-1.5">
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {t('nav.logout')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function SiteHeader({ user = null, currentPath, isDentist }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  // Derive the active path from the router instead of relying on callers to
  // pass currentPath - none of this app's ~22 call sites did, so the nav
  // highlight was always comparing against the hardcoded '/' default.
  // router.pathname (not asPath) matches the format detectBrandFromPath
  // above already relies on: the matched page route, host-rewritten by
  // middleware.js, with no locale prefix to strip.
  const activePath = currentPath ?? router.pathname;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors - still redirect to login below so the user
      // isn't stuck on a page that thinks they're logged in.
    }
    router.push('/dashboard/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="container-wide flex h-16 items-center justify-between">
        <Logo isDentist={isDentist} />
        <nav className="hidden md:flex items-center gap-1">
          {isDentist ? (
            <>
              <a href="https://findmydr.ae/" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t('nav.doctors')}
              </a>
              <Link href="/" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath === '/dentist' ? 'text-primary' : 'text-muted-foreground')}>
                {t('nav.dentists')}
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath === '/doctor' ? 'text-primary' : 'text-muted-foreground')}>
                {t('nav.doctors')}
              </Link>
              <a href="https://findmydentist.ae/" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t('nav.dentists')}
              </a>
            </>
          )}
          <Link href="/pricing" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath === '/pricing' ? 'text-primary' : 'text-muted-foreground')}>
            {t('nav.pricing')}
          </Link>
          <Link href="/about" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath === '/about' ? 'text-primary' : 'text-muted-foreground')}>
            {t('nav.about')}
          </Link>
          <Link href="/contact" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath === '/contact' ? 'text-primary' : 'text-muted-foreground')}>
            {t('nav.contact')}
          </Link>
          <Link href="/dashboard" className={cn('px-3 py-2 text-sm font-medium hover:text-primary transition-colors', activePath.startsWith('/dashboard') ? 'text-primary' : 'text-muted-foreground')}>
            {t('nav.dashboard')}
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-1">
          <LangSelector />
          {user ? (
            <UserMenu t={t} onLogout={handleLogout} />
          ) : (
            <>
              <Link href="/dashboard/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link href="/dashboard/login">
                <Button size="sm">{t('nav.signup')}</Button>
              </Link>
            </>
          )}
        </div>
        <div className="flex md:hidden items-center gap-1">
          <button
            className="min-h-[44px] min-w-[44px] h-10 w-10 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
            onClick={() => setOpen(true)}
            aria-label={t("nav.open_menu")}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl z-50 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b">
              <Logo size="sm" isDentist={isDentist} />
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center" aria-label={t("nav.close_menu")}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {isDentist ? (
                <>
                  <a href="https://findmydr.ae/" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.doctors')}</a>
                  <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.dentists')}</Link>
                </>
              ) : (
                <>
                  <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.doctors')}</Link>
                  <a href="https://findmydentist.ae/" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.dentists')}</a>
                </>
              )}
              <Link href="/pricing" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.pricing')}</Link>
              <Link href="/about" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.about')}</Link>
              <Link href="/contact" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.contact')}</Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.dashboard')}</Link>
              <Link href="/dashboard/profile" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted">{t('nav.my_profile')}</Link>
            </nav>
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('nav.change_language')}</span>
                <LangSelector />
              </div>
              {user ? (
                <div className="space-y-2">
                  <div className="px-1 text-sm font-medium text-foreground truncate">{user.email || t('nav.my_account')}</div>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px]"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/dashboard/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[44px]">{t('nav.login')}</Button>
                  </Link>
                  <Link href="/dashboard/login" onClick={() => setOpen(false)}>
                    <Button className="w-full min-h-[44px]">{t('nav.signup')}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
