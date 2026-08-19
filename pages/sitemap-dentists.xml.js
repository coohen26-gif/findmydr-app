import pool from '../lib/db';
const SITE_URL = 'https://findmydentist.ae';
const LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];

function urlEntry(path, priority, today) {
  let xml = '<url>';
  xml += `<loc>${SITE_URL}${path}</loc>`;
  LOCALES.forEach((l) => {
    xml += `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}/${l}${path}" />`;
  });
  xml += `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/en${path}" />`;
  xml += `<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${priority}</priority>`;
  xml += '</url>';
  return xml;
}

export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || '';
  if (!host.includes('findmydentist')) {
    res.statusCode = 404; res.end(); return { props: {} };
  }
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];
  let body = urlEntry('/', '1.0', today);
  try {
    const r = await pool.query('SELECT id FROM public.dentists ORDER BY id LIMIT 5000');
    r.rows.forEach(p => {
      body += urlEntry('/dentist/' + p.id, '0.6', today);
    });
  } catch (e) {}
  res.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + body + '</urlset>');
  res.end(); return { props: {} };
}
export default function SitemapDentists() { return null; }
