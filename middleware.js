import { NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];
const DEFAULT_LOCALE = 'en';
const LOCALE_PREFIX_RE = /^\/(fr|en|ar|zh|ru|fa)(\/|$)/;
// Top-level static pages that exist as real routes on both domains and must
// NEVER be prefixed with /doctor or /dentist by the host-based rewrite below.
const STATIC_PAGES = ['/about', '/contact', '/pricing', '/legal'];

function detectLocaleFromAcceptLanguage(acceptLang) {
  if (!acceptLang) return DEFAULT_LOCALE;
  const parts = acceptLang.split(',').map((p) => {
    const [tag, ...rest] = p.trim().split(';');
    const qMatch = rest.join(';').match(/q=([0-9.]+)/);
    const q = qMatch ? parseFloat(qMatch[1]) : 1;
    return { tag: tag.toLowerCase(), q };
  });
  parts.sort((a, b) => b.q - a.q);
  for (const p of parts) {
    if (p.tag.startsWith('fr')) return 'fr';
    if (p.tag.startsWith('ar')) return 'ar';
    if (p.tag.startsWith('fa')) return 'fa';
    if (p.tag.startsWith('ru')) return 'ru';
    if (p.tag.startsWith('zh')) return 'zh';
    if (p.tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const path = url.pathname;
  console.log('[MW]', JSON.stringify({ host, path }));
  const search = url.search;
  const ua = request.headers.get('user-agent') || '';

  // Special: /dashboard/ - keep URL, but propagate locale via cookie/header so getServerSideProps can read it
  if (path.startsWith('/dashboard')) {
    let dlocale = null;
    const dm = path.match(LOCALE_PREFIX_RE);
    if (dm) dlocale = dm[1];
    if (!dlocale) {
      const acceptLang = request.headers.get('accept-language') || '';
      const cookieLocale = (request.cookies.get('NEXT_LOCALE')?.value || '').toLowerCase();
      if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) dlocale = cookieLocale;
      else if (acceptLang) dlocale = detectLocaleFromAcceptLanguage(acceptLang);
      else dlocale = DEFAULT_LOCALE;
    }
    const pathNoLocale = path.replace(LOCALE_PREFIX_RE, '/') || '/';
    const dres = NextResponse.rewrite(new URL(pathNoLocale, request.url));
    dres.headers.set('x-dmd-locale', dlocale);
    dres.cookies.set('NEXT_LOCALE', dlocale, { path: '/', maxAge: 60*60*24*365, sameSite: 'lax' });
    return dres;
  }

  // Skip API, static, sitemap, robots, blog, review
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/blog') ||
    path.startsWith('/review') ||
    path === '/favicon.ico' ||
    /\/[a-f0-9]{32}\.txt$/.test(path) ||
    path === '/robots.txt' ||
    path.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // 1) Detect locale prefix in URL
  let locale = null;
  let pathWithoutLocale = path;
  const m = path.match(LOCALE_PREFIX_RE);
  if (m) {
    locale = m[1];
    pathWithoutLocale = path.replace(LOCALE_PREFIX_RE, '/') || '/';
  }

  // 2) If no locale in URL, pick one (cookie > Accept-Language > default)
  if (!locale) {
    const acceptLang = request.headers.get('accept-language') || '';
    const cookieLocale = (request.cookies.get('NEXT_LOCALE')?.value || '').toLowerCase();
    let preferred = DEFAULT_LOCALE;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      preferred = cookieLocale;
    } else if (acceptLang) {
      preferred = detectLocaleFromAcceptLanguage(acceptLang);
    }
    locale = preferred;
  }

  // 3) Cross-domain redirects (preserve user's locale choice)
  if (host.includes('findmydr.ae') && pathWithoutLocale.startsWith('/dentist')) {
    const target = new URL(`/${locale}${pathWithoutLocale}${search}`, 'https://findmydentist.ae');
    return NextResponse.redirect(target, 308);
  }
  if (host.includes('findmydentist.ae') && pathWithoutLocale.startsWith('/doctor')) {
    const target = new URL(`/${locale}${pathWithoutLocale}${search}`, 'https://findmydr.ae');
    return NextResponse.redirect(target, 308);
  }

  // 3b) Top-level static pages (about/contact/pricing/legal) - never prefix
  // these with /doctor or /dentist. They render as-is on both domains; the
  // pages themselves read req.headers.host to adapt branding.
  if (STATIC_PAGES.includes(pathWithoutLocale)) {
    const res = NextResponse.next();
    res.headers.set('x-dmd-locale', locale);
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return res;
  }

  // 4) Apply host-based rewrite (findmydr.ae → /doctor/*, findmydentist.ae → /dentist/*)
  //    EXCEPT for the root path: serve pages/index.js (the actual home page)
  //    with the correct locale propagated via NEXT_LOCALE cookie.
  let rewritePath = null;
  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    // Root: rewrite to the domain's canonical home (/doctor for findmydr.ae, /dentist for findmydentist.ae)
    if (host.includes('findmydentist.ae')) {
      rewritePath = '/dentist';
    } else if (host.includes('findmydr.ae')) {
      rewritePath = '/doctor';
    } else {
      // Unknown host: fall back to doctor home
      rewritePath = '/doctor';
    }
  } else if (host.includes('findmydentist.ae')) {
    if (pathWithoutLocale.startsWith('/dentist/') || pathWithoutLocale === '/dentist') {
      if (pathWithoutLocale === '/dentist' && search.includes('id=')) {
        const id = new URLSearchParams(search).get('id');
        if (id && /^\d+$/.test(id)) {
          rewritePath = `/dentist/${id}`;
        } else {
          rewritePath = pathWithoutLocale;
        }
      } else {
        rewritePath = pathWithoutLocale;
      }
    } else {
      rewritePath = '/dentist' + pathWithoutLocale;
    }
  } else if (host.includes('findmydr.ae')) {
    if (pathWithoutLocale.startsWith('/doctor/') || pathWithoutLocale === '/doctor') {
      if (pathWithoutLocale === '/doctor' && search.includes('id=')) {
        const id = new URLSearchParams(search).get('id');
        if (id && /^\d+$/.test(id)) {
          rewritePath = `/doctor/${id}`;
        } else {
          rewritePath = pathWithoutLocale;
        }
      } else {
        rewritePath = pathWithoutLocale;
      }
    } else {
      rewritePath = '/doctor' + pathWithoutLocale;
    }
  } else {
    return NextResponse.next();
  }

  // 5) Pages Router rewrite to canonical path (locale resolved from URL prefix or NEXT_LOCALE)
  url.pathname = rewritePath;
  if (rewritePath.startsWith('/dentist/') || rewritePath.startsWith('/doctor/')) {
    url.search = '';
  } else {
    url.search = search;
  }

  const res = NextResponse.rewrite(url);
  res.headers.set('x-dmd-locale', locale);
  res.headers.set('Vary', 'Accept-Language');
  res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next|static|dashboard|favicon.ico).*)',
    '/'
  ],
};
