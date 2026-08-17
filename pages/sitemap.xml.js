export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || 'findmydr.ae';
  const isDentist = host.includes('findmydentist');
  const domain = isDentist ? 'findmydentist.ae' : 'findmydr.ae';
  res.setHeader('Content-Type', 'application/xml');
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  xml += '<sitemap><loc>https://' + domain + '/sitemap-main.xml</loc><lastmod>' + today + '</lastmod></sitemap>';
  if (!isDentist) {
    ['fr', 'en', 'ar', 'zh', 'ru', 'fa'].forEach((lang) => {
      xml += '<sitemap><loc>https://' + domain + '/sitemap-' + lang + '.xml</loc><lastmod>' + today + '</lastmod></sitemap>';
    });
  } else {
    xml += '<sitemap><loc>https://' + domain + '/sitemap-dentists.xml</loc><lastmod>' + today + '</lastmod></sitemap>';
  }
  xml += '</sitemapindex>';
  res.write(xml); res.end(); return { props: {} };
}
export default function Sitemap() { return null; }
