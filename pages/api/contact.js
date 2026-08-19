/**
 * pages/api/contact.js
 * POST { name, email, subject, message }
 * Forwards the message to contact@findmydr.ae via Brevo.
 * Public endpoint, no auth.
 *
 * Rate limited by requester IP (DB-backed, dmd.rate_limits — same table/pattern as
 * pages/api/auth/request-link.js and pages/api/reviews/submit.js). Each forwarded
 * message is a paid Brevo send, so an unthrottled endpoint is an open spam/cost vector.
 * Fails OPEN on DB errors so a rate-limit infra issue never blocks all contact requests.
 */
import pool from '../../lib/db';
import { sendContactEmail } from '../../lib/email';

const RATE_LIMIT_WINDOW_SQL = '1 hour';
const RATE_LIMIT_MAX = 5;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.socket.remoteAddress;
  return ip || 'unknown';
}

async function checkRateLimit(ip) {
  const key = `contact:${ip}`;
  try {
    const { rows } = await pool.query(
      `INSERT INTO dmd.rate_limits (key, attempts, window_start)
       VALUES ($1, 1, now())
       ON CONFLICT (key) DO UPDATE
       SET
         attempts = CASE
           WHEN dmd.rate_limits.window_start <= now() - $2::interval THEN 1
           ELSE dmd.rate_limits.attempts + 1
         END,
         window_start = CASE
           WHEN dmd.rate_limits.window_start <= now() - $2::interval THEN now()
           ELSE dmd.rate_limits.window_start
         END
       RETURNING attempts`,
      [key, RATE_LIMIT_WINDOW_SQL]
    );
    const attempts = rows[0]?.attempts ?? 1;
    return attempts <= RATE_LIMIT_MAX;
  } catch (err) {
    console.error('checkRateLimit error (failing open):', err);
    return true;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip))) {
    return res.status(429).json({ error: 'Too many messages sent from this network. Please try again in an hour.' });
  }
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
  }

  const result = await sendContactEmail({ name, email, subject: subject || 'general', message });
  return res.status(200).json({ ok: true, ...result });
}

export const config = { api: { bodyParser: true } };
