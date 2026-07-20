import pool from '../lib/db';

export async function getServerSideProps({ req, res }) {
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

  try {
    const r = await pool.query("SELECT id FROM public.dentists ORDER BY id LIMIT 25000");
    r.rows.forEach(p => {
      const path = `/dentist/${p.id}`;
      xml += '<url>';
      xml += `<loc>https://findmydentist.ae/ar${path}</loc>`;
      xml += `<xhtml:link rel="alternate" hreflang="fr" href="https://findmydentist.ae/fr${path}" />`;
      xml += `<xhtml:link rel="alternate" hreflang="en" href="https://findmydentist.ae/en${path}" />`;
      xml += `<xhtml:link rel="alternate" hreflang="ar" href="https://findmydentist.ae/ar${path}" />`;
      xml += `<xhtml:link rel="alternate" hreflang="x-default" href="https://findmydentist.ae/en${path}" />`;
      xml += `<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority>`;
      xml += '</url>';
    });
  } catch (e) {
    console.error('sitemap-ar error:', e.message);
  }

  xml += '</urlset>';
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function SitemapAr() { return null; }
