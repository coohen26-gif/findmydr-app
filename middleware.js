import { NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];
const DEFAULT_LOCALE = 'en';
const LOCALE_PREFIX_RE = /^\/(fr|en|ar|zh|ru|fa)(\/|$)/;

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

function isBot(userAgent) {
  if (!userAgent) return false;
  return /googlebot|bingbot|duckduckbot|yandexbot|baiduspider|slurp|applebot|facebot|ia_archiver|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|rogerbot/i.test(
    userAgent
  );
}

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const path = url.pathname;
  const search = url.search;
  const ua = request.headers.get('user-agent') || '';

  // Skip API, static, dashboard, sitemap, robots
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/blog') ||
    path === '/favicon.ico' ||
    /\/[a-f0-9]{32}\.txt$/.test(path) ||
    path === '/robots.txt' ||
    path.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // 1) Detect locale prefix
  let locale = null;
  let pathWithoutLocale = path;
  const m = path.match(LOCALE_PREFIX_RE);
  if (m) {
    locale = m[1];
    pathWithoutLocale = path.replace(LOCALE_PREFIX_RE, '/') || '/';
  }

  // 2) If no locale, decide redirect (skip bots to preserve SEO)
  if (!locale && !isBot(ua)) {
    const acceptLang = request.headers.get('accept-language') || '';
    const cookieLocale = (request.cookies.get('NEXT_LOCALE')?.value || '').toLowerCase();
    let preferred = DEFAULT_LOCALE;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      preferred = cookieLocale;
    } else if (acceptLang) {
      preferred = detectLocaleFromAcceptLanguage(acceptLang);
    }
    const target = `/${preferred}${path === '/' ? '/' : path}`;
    return NextResponse.redirect(new URL(target, request.url), 302);
  }

  // If bot and no locale, default to English but keep URL clean
  if (!locale && isBot(ua)) {
    locale = DEFAULT_LOCALE;
  }

  // 3) Cross-domain redirects (apply to cleaned path)
  if (host.includes('findmydr.ae') && pathWithoutLocale.startsWith('/dentist')) {
    const target = new URL(pathWithoutLocale + search, 'https://findmydentist.ae');
    target.pathname = `/${locale}${target.pathname}`;
    return NextResponse.redirect(target, 308);
  }
  if (host.includes('findmydentist.ae') && pathWithoutLocale.startsWith('/doctor')) {
    const target = new URL(pathWithoutLocale + search, 'https://findmydr.ae');
    target.pathname = `/${locale}${target.pathname}`;
    return NextResponse.redirect(target, 308);
  }

  // 4) Apply host-based rewrite on cleaned path
  let rewritePath = null;
  if (host.includes('findmydentist.ae')) {
    if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
      rewritePath = '/dentist';
    } else if (pathWithoutLocale.startsWith('/dentist/') || pathWithoutLocale === '/dentist') {
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
    if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
      rewritePath = '/doctor';
    } else if (pathWithoutLocale.startsWith('/doctor/') || pathWithoutLocale === '/doctor') {
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

  url.pathname = rewritePath;
  url.search = search && !rewritePath.startsWith('/dentist/') && !rewritePath.startsWith('/doctor/') ? search : '';
  if (rewritePath.startsWith('/dentist/') || rewritePath.startsWith('/doctor/')) {
    url.search = '';
  }

  const res = NextResponse.rewrite(url);
  res.headers.set('x-dmd-locale', locale || DEFAULT_LOCALE);
  res.headers.set('Vary', 'Accept-Language');
  return res;
}

export const config = {
  matcher: ['/((?!api|_next|static|dashboard|favicon.ico).*)'],
};
