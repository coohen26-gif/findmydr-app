/**
 * pages/api/indexnow.js
 * IndexNow API: instant indexing on Bing, DuckDuckGo, Yandex, Naver.
 * Free, no auth required (just need an API key per domain).
 *
 * IndexNow protocol:
 *   POST https://api.indexnow.org/indexnow
 *   { "host": "findmydr.ae", "key": "xxx", "keyLocation": "https://findmydr.ae/xxx.txt", "urlList": [...] }
 *
 * After submission, Bing crawls within 24-48h.
 */
import crypto from 'crypto';

const KEYS = {
  'findmydr.ae': 'd8e8fca2dc140f7d4e0b3a7c1e2d4f5a',
  'findmydentist.ae': 'b9c2d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
};
const DEFAULT_HOST = 'findmydr.ae';
const ALLOWED_URL_PREFIXES = ['https://findmydr.ae/', 'https://findmydentist.ae/'];
// Shared secret gating the mutating POST (submits to IndexNow using this
// site's key on behalf of whatever URLs are supplied). No codebase-wide
// admin/cron-token convention exists yet (checked dashboard JWT middleware,
// Stripe routes) so this introduces one; unset means POST is refused.
const ADMIN_TOKEN = process.env.INDEXNOW_ADMIN_TOKEN;

export default async function handler(req, res) {
  // Resolve host and key per request
  const requestHost = (req.headers && req.headers.host) || '';
  const HOST = KEYS[requestHost] ? requestHost : DEFAULT_HOST;
  const KEY = KEYS[HOST] || KEYS[DEFAULT_HOST];

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sampleUrls = [
    `https://${HOST}/`,
    `https://${HOST}/doctor`,
    `https://${HOST}/doctor/14526`,
    `https://${HOST}/dentist/3000`,
  ];

  if (req.method === 'POST') {
    if (!ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    const authHeader = req.headers.authorization || '';
    const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (providedToken !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const { urls = sampleUrls } = req.body || {};
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }
    const validUrls = urls.filter(
      (u) => typeof u === 'string' && ALLOWED_URL_PREFIXES.some((prefix) => u.startsWith(prefix))
    );
    if (validUrls.length === 0) {
      return res.status(400).json({
        error: 'No valid URLs supplied — each must start with https://findmydr.ae/ or https://findmydentist.ae/',
      });
    }

    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: validUrls,
    };

    try {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const status = r.status;
      const text = await r.text();
      return res.status(200).json({
        submitted: validUrls.length,
        rejected: urls.length - validUrls.length,
        host: HOST,
        indexnow_status: status,
        indexnow_response: text,
        keyLocation: payload.keyLocation,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(200).json({
    message: 'IndexNow API endpoint',
    host: HOST,
    usage: 'POST { "urls": ["url1", "url2"] } to submit URLs to IndexNow',
    samplePayload: {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: sampleUrls,
    },
    keyFileNote: `Key file at /public/${KEY}.txt must contain just the key "${KEY}" to activate IndexNow`,
    coverage: ['Bing', 'DuckDuckGo', 'Yandex', 'Naver', 'Seznam'],
  });
}
