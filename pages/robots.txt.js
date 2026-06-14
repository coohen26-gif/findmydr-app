const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://findmydr.ae';

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');

  const body = `# FindMyDoctor.ae robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

# Crawl-delay (gentle)
Crawl-delay: 1

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-doctors.xml
Sitemap: ${SITE_URL}/sitemap-dentists.xml

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
