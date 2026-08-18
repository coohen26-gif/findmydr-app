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
  const search = url.search;
  const ua = request.headers.get('user-agent') || '';

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

  // 2b) Dashboard routes (professional login/profile/etc.) are shared across
  // both domains and must never be prefixed with /doctor or /dentist by the
  // host-rewrite below. Excluding a bare leading `/dashboard` in the matcher
  // config at the bottom of this file is not enough on its own: the matcher's
  // negative lookahead only excludes paths where `dashboard` appears right
  // after the leading slash, so a locale-prefixed path like `/fr/dashboard/login`
  // still reaches this function. Without this check it would fall through to
  // the host-rewrite (step 4/5) and become the nonexistent `/doctor/dashboard/login`
  // route, 404ing every time a user switches language while on a dashboard page.
  // Mirror the STATIC_PAGES passthrough below: leave the path (including its
  // locale prefix) untouched so Next's built-in i18n routing resolves the
  // locale itself from the URL, and just propagate it via header/cookie too.
  if (pathWithoutLocale === '/dashboard' || pathWithoutLocale.startsWith('/dashboard/')) {
    const res = NextResponse.next();
    res.headers.set('x-dmd-locale', locale);
    res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return res;
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

  // 4) Apply host-based rewrite (findmydr.ae → /doctor/*, findmydentist.ae → /dentist/*).
  //    NOTE: the root path is NOT an exception — it is always rewritten too (see
  //    below), so pages/index.js and pages/en/index.js are never actually reached
  //    in production. They are kept in place as inert fallbacks/history rather than
  //    deleted (pages/en/index.js in particular was a deliberate fix for a real
  //    /en root 404 back when this root-rewrite was conditional; that condition
  //    was later removed). If a future change reintroduces a path where the root
  //    rewrite does not apply, these files provide a safe landing page instead of
  //    a 404 or a raw Next.js page not found.
  let rewritePath = null;
  // Tracks whether the rewrite below actually consumed a legacy `?id=123`
  // query string (converting it into a `/doctor/123` or `/dentist/123`
  // path segment). Only in that specific case should `search` be dropped —
  // every other slug-passthrough case must preserve the original query
  // string (utm_*, ref, etc.) instead of stripping it unconditionally.
  let legacyIdConsumed = false;
  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    // Root: always rewritten to the domain's canonical home (/doctor for
    // findmydr.ae, /dentist for findmydentist.ae) for every host, including
    // unrecognized ones (see fallback below) — pages/index.js is unreachable.
    if (host.includes('findmydentist.ae')) {
      rewritePath = '/dentist';
    } else if (host.includes('findmydr.ae')) {
      rewritePath = '/doctor';
    } else {
      // Unknown host: fall back to doctor home. In practice nginx's per-domain
      // SNI/server_name routing rejects unrecognized hosts before they ever
      // reach this app, so this branch is also effectively unreachable today.
      rewritePath = '/doctor';
    }
  } else if (host.includes('findmydentist.ae')) {
    if (pathWithoutLocale.startsWith('/dentist/') || pathWithoutLocale === '/dentist') {
      if (pathWithoutLocale === '/dentist' && search.includes('id=')) {
        const id = new URLSearchParams(search).get('id');
        if (id && /^\d+$/.test(id)) {
          rewritePath = `/dentist/${id}`;
          legacyIdConsumed = true;
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
          legacyIdConsumed = true;
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
  if (legacyIdConsumed) {
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
