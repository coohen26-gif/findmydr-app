import pool from '../lib/db';
const SITE_URL = 'https://findmydentist.ae';
export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || '';
  if (!host.includes('findmydentist')) {
    res.statusCode = 404; res.end(); return { props: {} };
  }
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];
  let body = '<url><loc>' + SITE_URL + '/</loc><lastmod>' + today + '</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>';
  try {
    const r = await pool.query('SELECT id FROM public.dentists ORDER BY id LIMIT 5000');
    r.rows.forEach(p => {
      body += '<url><loc>' + SITE_URL + '/dentist/' + p.id + '</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>';
    });
  } catch (e) {}
  res.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + body + '</urlset>');
  res.end(); return { props: {} };
}
export default function SitemapDentists() { return null; }
