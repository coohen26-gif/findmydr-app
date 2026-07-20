import pool from '../lib/db';

const SITE_URL = 'https://findmydr.ae';
const DENTIST_URL = 'https://findmydentist.ae';

export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || '';
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

  const staticPaths = ['/', '/about', '/contact', '/pricing', '/legal'];
  staticPaths.forEach(p => {
    xml += '<url>';
    xml += `<loc>https://findmydr.ae/fr${p}</loc>`;
    xml += `<xhtml:link rel="alternate" hreflang="fr" href="https://findmydr.ae/fr${p}" />`;
    xml += `<xhtml:link rel="alternate" hreflang="en" href="https://findmydr.ae/en${p}" />`;
    xml += `<xhtml:link rel="alternate" hreflang="ar" href="https://findmydr.ae/ar${p}" />`;
    xml += `<xhtml:link rel="alternate" hreflang="x-default" href="https://findmydr.ae/en${p}" />`;
    xml += `<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>`;
    xml += '</url>';
  });

  try {
    const r = await pool.query("SELECT id FROM public.physicians ORDER BY id LIMIT 25000");
    r.rows.forEach(p => {
      const path = `/doctor/${p.id}`;
      xml += '<url>';
      xml += `<loc>https://findmydr.ae/fr${path}</loc>`;
      xml += `<xhtml:link rel="alternate" hreflang="fr" href="https://findmydr.ae/fr${path}" />`;
      xml += `<xhtml:link rel="alternate" hreflang="en" href="https://findmydr.ae/en${path}" />`;
      xml += `<xhtml:link rel="alternate" hreflang="ar" href="https://findmydr.ae/ar${path}" />`;
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
