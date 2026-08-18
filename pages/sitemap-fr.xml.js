import pool from '../lib/db';

const LOCALES = ['fr', 'en', 'ar', 'zh', 'ru', 'fa'];
const LOCALE = 'fr';

export async function getServerSideProps({ req, res }) {
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

  const staticPaths = ['/', '/about', '/contact', '/pricing', '/legal'];
  staticPaths.forEach(p => {
    xml += '<url>';
    xml += `<loc>https://findmydr.ae/${LOCALE}${p}</loc>`;
    LOCALES.forEach(l => {
      xml += `<xhtml:link rel="alternate" hreflang="${l}" href="https://findmydr.ae/${l}${p}" />`;
    });
    xml += `<xhtml:link rel="alternate" hreflang="x-default" href="https://findmydr.ae/en${p}" />`;
    xml += `<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>`;
    xml += '</url>';
  });

  try {
    const r = await pool.query("SELECT id FROM public.physicians ORDER BY id LIMIT 25000");
    r.rows.forEach(p => {
      const path = `/doctor/${p.id}`;
      xml += '<url>';
      xml += `<loc>https://findmydr.ae/${LOCALE}${path}</loc>`;
      LOCALES.forEach(l => {
        xml += `<xhtml:link rel="alternate" hreflang="${l}" href="https://findmydr.ae/${l}${path}" />`;
      });
      xml += `<xhtml:link rel="alternate" hreflang="x-default" href="https://findmydr.ae/en${path}" />`;
      xml += `<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority>`;
      xml += '</url>';
    });
  } catch (e) {
    console.error('sitemap-fr error:', e.message);
  }

  xml += '</urlset>';
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function SitemapFr() { return null; }
