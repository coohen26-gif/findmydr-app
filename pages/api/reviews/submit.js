/**
 * pages/api/reviews/submit.js
 * POST — public review submission for a professional.
 * Body: { pro_dha_id, rating (1-5 int), text (10-2000 chars), author_name (optional), visit_date (optional) }
 * No auth required. Basic validation only (trim strings, bounds-check rating/text length,
 * confirm pro_dha_id exists in dmd.professional before insert).
 *
 * Rate limited by requester IP (DB-backed, dmd.rate_limits — same table/pattern as
 * pages/api/auth/request-link.js). Reviews are lower-frequency than login attempts, so the
 * limit is looser than the 5/hour used for magic links, but still tight enough to stop a
 * script from spamming fake reviews for a professional: 5 submissions per IP per hour.
 * Fails OPEN on DB errors so a rate-limit infra issue never blocks all submissions.
 */
import pool from '../../../lib/db';

const TEXT_MIN = 10;
const TEXT_MAX = 2000;
const NAME_MAX = 100;

const RATE_LIMIT_WINDOW_SQL = '1 hour';
const RATE_LIMIT_MAX = 5;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || req.socket.remoteAddress;
  return ip || 'unknown';
}

async function checkRateLimit(ip) {
  const key = `review:${ip}`;
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
    // Never let a rate-limit infra issue block all review submissions: fail open.
    console.error('checkRateLimit error (failing open):', err);
    return true;
  }
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip))) {
    return res.status(429).json({ error: 'Too many reviews submitted from this network. Please try again in an hour.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const proDhaId = typeof body.pro_dha_id === 'string' ? body.pro_dha_id.trim() : '';
  const rating = Number.parseInt(body.rating, 10);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const authorName = typeof body.author_name === 'string' ? body.author_name.trim().slice(0, NAME_MAX) : '';
  const visitDateRaw = typeof body.visit_date === 'string' ? body.visit_date.trim() : '';
  const language = typeof body.language === 'string' && body.language.trim() ? body.language.trim().slice(0, 5) : 'en';

  if (!proDhaId) {
    return res.status(400).json({ error: 'pro_dha_id is required' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }
  if (text.length < TEXT_MIN) {
    return res.status(400).json({ error: `text must be at least ${TEXT_MIN} characters` });
  }
  if (text.length > TEXT_MAX) {
    return res.status(400).json({ error: `text must be at most ${TEXT_MAX} characters` });
  }

  // visit_date: optional, must parse as a valid date if provided; reject future dates.
  let visitDate = null;
  if (visitDateRaw) {
    const parsed = new Date(visitDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'visit_date is not a valid date' });
    }
    if (parsed.getTime() > Date.now()) {
      return res.status(400).json({ error: 'visit_date cannot be in the future' });
    }
    visitDate = visitDateRaw.slice(0, 10);
  }

  try {
    const pro = await pool.query(
      'SELECT dha_unique_id FROM dmd.professional WHERE dha_unique_id = $1 LIMIT 1',
      [proDhaId]
    );
    if (!pro.rows[0]) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    await pool.query(
      `INSERT INTO dmd.reviews (pro_dha_id, rating, text, author_name, visit_date, language, verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [proDhaId, rating, text, authorName || null, visitDate, language]
    );

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('reviews/submit error:', e.message);
    return res.status(500).json({ error: 'Could not save review' });
  }
}

export const config = { api: { bodyParser: false } };
