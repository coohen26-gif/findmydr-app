export async function getServerSideProps({ req, res }) {
  const host = req.headers.host || 'findmydr.ae';
  const isDentist = host.includes('findmydentist');
  const domain = isDentist ? 'findmydentist.ae' : 'findmydr.ae';
  const siteUrl = `https://${domain}`;
  const brand = isDentist ? 'FindMyDentist.ae' : 'FindMyDoctor.ae';

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');

  const body = `# ${brand} robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

# Crawl-delay (gentle)
Crawl-delay: 1

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml

# AI bots - block training, allow indexing (for SEO)
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
`;

  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
