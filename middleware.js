import { NextResponse } from 'next/server';

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const path = url.pathname;
  const search = url.search;

  // Skip API, static, dashboard, sitemap, robots
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/dashboard') ||
    path === '/favicon.ico' ||
    /\/[a-f0-9]{32}\.txt$/.test(path) ||
    path === '/robots.txt' ||
    path.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // Cross-domain redirects
  if (host.includes('findmydr.ae') && path.startsWith('/dentist')) {
    return NextResponse.redirect(new URL(path + search, 'https://findmydentist.ae'), 308);
  }
  if (host.includes('findmydentist.ae') && path.startsWith('/doctor')) {
    return NextResponse.redirect(new URL(path + search, 'https://findmydr.ae'), 308);
  }

  // findmydentist.ae
  if (host.includes('findmydentist.ae')) {
    if (path === '/' || path === '') {
      url.pathname = '/dentist';
      return NextResponse.rewrite(url);
    }
    if (path.startsWith('/dentist/') || path === '/dentist') {
      if (path === '/dentist' && search.includes('id=')) {
        const id = new URLSearchParams(search).get('id');
        if (id && /^\d+$/.test(id)) {
          url.pathname = `/dentist/${id}`;
          url.search = '';
          return NextResponse.rewrite(url);
        }
      }
      return NextResponse.next();
    }
    url.pathname = '/dentist' + path;
    return NextResponse.rewrite(url);
  }

  // findmydr.ae
  if (host.includes('findmydr.ae')) {
    if (path === '/' || path === '') {
      url.pathname = '/doctor';
      return NextResponse.rewrite(url);
    }
    if (path.startsWith('/doctor/') || path === '/doctor') {
      if (path === '/doctor' && search.includes('id=')) {
        const id = new URLSearchParams(search).get('id');
        if (id && /^\d+$/.test(id)) {
          url.pathname = `/doctor/${id}`;
          url.search = '';
          return NextResponse.rewrite(url);
        }
      }
      return NextResponse.next();
    }
    url.pathname = '/doctor' + path;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|dashboard|favicon.ico).*)'],
};
