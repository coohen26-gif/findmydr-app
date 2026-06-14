/**
 * pages/api/ping-search-engines.js
 * Public endpoint that pings search engines for sitemap updates.
 * Useful as a cron-triggerable endpoint or admin-action.
 *
 * Note: Google's public ping endpoint was deprecated in 2023.
 * Bing's public ping endpoint was also deprecated.
 * This endpoint now just logs and shows the sitemaps URLs.
 * Real submission requires Google Search Console / Bing Webmaster Tools auth.
 */
import pool from '../../lib/db';

const SITEMAPS = [
  'https://findmydr.ae/sitemap.xml',
  'https://findmydr.ae/sitemap-doctors.xml',
  'https://findmydentist.ae/sitemap.xml',
  'https://findmydentist.ae/sitemap-dentists.xml',
];

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Count current pros for stats
  let physicianCount = 0;
  let dentistCount = 0;
  try {
    const a = await pool.query('SELECT COUNT(*) FROM public.physicians');
    physicianCount = parseInt(a.rows[0].count, 10);
  } catch (e) { /* ignore */ }
  try {
    const a = await pool.query('SELECT COUNT(*) FROM public.dentists');
    dentistCount = parseInt(a.rows[0].count, 10);
  } catch (e) { /* ignore */ }

  const message = `
🗺️  FindMyDoctor.ae — Sitemap Index Status

Total indexed:
  • ${physicianCount} physicians (doctors)
  • ${dentistCount} dentists
  • ${physicianCount + dentistCount} total professionals

Sitemaps:
${SITEMAPS.map(s => `  • ${s}`).join('\n')}

To submit to Google:
  1. Visit https://search.google.com/search-console
  2. Add property "findmydr.ae" and "findmydentist.ae"
  3. Verify via DNS TXT (recommended) or HTML file
  4. Submit sitemaps in "Sitemaps" section

To submit to Bing:
  1. Visit https://www.bing.com/webmasters
  2. Add site (sign in with Microsoft account)
  3. Submit sitemaps directly (no verification needed for Bing IndexNow)

Alternative: Use IndexNow API for instant indexing on Bing + Yandex:
  POST https://api.indexnow.org/indexnow
  Body: { host, key, keyLocation, urlList }
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(message);
}
