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
    const { urls = sampleUrls } = req.body || {};
    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
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
        submitted: urls.length,
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
