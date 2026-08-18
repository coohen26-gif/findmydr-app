/**
 * lib/seo.js
 * SEO metadata helpers — generates title, description, canonical, OG, JSON-LD.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://findmydr.ae';
const DENTIST_URL = process.env.NEXT_PUBLIC_DENTIST_URL || 'https://findmydentist.ae';

export const SITE_NAME = 'FindMyDoctor.ae';
export const DENTIST_SITE_NAME = 'FindMyDentist.ae';
export const SITE_DESCRIPTION = 'Annuaire des médecins et dentistes DHA-licensés à Dubai. 15 673 médecins, 5 049 dentistes, 5 241 établissements. Trilingue FR/EN/AR. Réservation en ligne.';
export const SITE_TWITTER = '@findmydr_ae';
export const SITE_LOGO = 'https://findmydr.ae/logo.png';

export function pageTitle(title) {
  if (!title) return `${SITE_NAME} - 15 673 médecins DHA-licensés à Dubai`;
  const clean = String(title).replace(/<[^>]+>/g, '').trim();
  // Strip redundant prefixes anywhere
  let short = clean
    .replace(/\bSpecialist\s+/g, '')
    .replace(/\bConsultant\s+/g, '')
    .replace(/\bGeneral Practitioner\s+/g, 'GP ')
    .replace(/\s+Dubai\s*$/i, '');
  if (short.length > 50) {
    const cut = short.substring(0, 50);
    const lastSpace = cut.lastIndexOf(' ');
    short = lastSpace > 20 ? cut.substring(0, lastSpace) : cut;
  }
  return `${short} | ${SITE_NAME}`;
}

export function pageDescription(text, fallback = SITE_DESCRIPTION) {
  if (!text) return fallback;
  const clean = String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 160) return clean;
  return clean.substring(0, 157) + '...';
}

export function pageUrl(host, path) {
  const base = host && host.includes('findmydentist') ? DENTIST_URL : SITE_URL;
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

export function canonical(host, path) {
  return pageUrl(host, path);
}

export function physicianJsonLd(pro, baseUrl) {
  if (!pro) return null;
  const url = `${baseUrl}/doctor/${pro.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: pro.name,
    url,
    medicalSpecialty: pro.specialty || 'Physician',
    identifier: pro.dha_unique_id || `dha-${pro.id}`,
    affiliation: pro.facility_name
      ? {
          '@type': 'Hospital',
          name: pro.facility_name,
        }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    availableService: {
      '@type': 'MedicalProcedure',
      name: 'Medical consultation',
    },
  };
}

export function breadcrumbJsonLd(items, baseUrl) {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${baseUrl}${it.url}`,
    })),
  };
}

export function organizationJsonLd(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: SITE_NAME,
    url: baseUrl,
    logo: SITE_LOGO,
    description: SITE_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressCountry: 'AE',
    },
    sameAs: [
      'https://twitter.com/findmydr_ae',
      'https://www.linkedin.com/company/findmydr',
    ],
  };
}

export function websiteJsonLd(baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/doctor?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
