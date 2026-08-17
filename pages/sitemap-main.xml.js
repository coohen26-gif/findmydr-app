const SITE_URL = 'https://findmydr.ae';
export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || '';
  const domain = host.includes('findmydentist') ? 'findmydentist.ae' : 'findmydr.ae';
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml += '<url><loc>https://' + domain + '/</loc><lastmod>' + today + '</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>';
  ['/about','/contact','/pricing','/legal'].forEach(p => {
    xml += '<url><loc>https://' + domain + p + '</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>';
  });
  xml += '</urlset>';
  res.write(xml); res.end(); return { props: {} };
}
export default function SitemapMain() { return null; }
