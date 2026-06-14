/**
 * /api/auth/request-link
 * Magic link authentication. POST { email, dha_license? }
 * - Generates a one-time token (24h expiry)
 * - Sends it via Brevo (or prints to console in dev mode)
 * - Rate limited: 5 requests per email per hour
 */
import pool from '../../../lib/db';
import crypto from 'crypto';
import { sendMagicLinkEmail } from '../../../lib/email';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(email) {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + RATE_LIMIT_WINDOW;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  rateLimitMap.set(key, record);
  return true;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, dha_license } = req.body || {};
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!checkRateLimit(email)) {
    return res.status(429).json({ error: 'Too many requests. Try again in 1 hour.' });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    let userId;
    const userCheck = await pool.query('SELECT id FROM dmd.users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length === 0) {
      const newUser = await pool.query(
        `INSERT INTO dmd.users(email, dha_license, created_at, last_login_at)
         VALUES($1, $2, NOW(), NOW()) RETURNING id`,
        [email.toLowerCase(), dha_license || null]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userCheck.rows[0].id;
      await pool.query('UPDATE dmd.users SET last_login_at = NOW() WHERE id = $1', [userId]);
    }

    await pool.query(
      `INSERT INTO dmd.auth_tokens(user_id, token, expires_at, purpose)
       VALUES($1, $2, $3, 'magic_link')`,
      [userId, token, expiresAt]
    );

    const host = req.headers.host || 'findmydr.ae';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const magicUrl = `${proto}://${host}/dashboard/verify?token=${token}`;

    const emailSent = await sendMagicLinkEmail(email, magicUrl);

    return res.status(200).json({
      ok: true,
      message: emailSent
        ? 'Magic link sent. Check your inbox.'
        : 'Magic link created (dev mode: link printed to server logs).',
      magic_url: emailSent ? null : magicUrl,
    });
  } catch (err) {
    console.error('auth/request-link error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = { api: { bodyParser: true } };
