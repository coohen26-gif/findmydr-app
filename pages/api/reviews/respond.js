/**
 * /api/reviews/respond.js
 * POST — lets an authenticated professional post (or update) their reply to
 * one of their own reviews.
 * Body: { review_id, response_text }
 *
 * Auth: dmd_session cookie (see getUserFromCookie, same pattern as
 * /api/dashboard/profile.js). Ownership is enforced in the SQL itself: the
 * UPDATE is scoped to pro_dha_id = the authenticated professional's own
 * dha_license, so a professional can never write a reply onto a review that
 * isn't theirs. If the review_id doesn't match a row owned by the caller —
 * whether because it belongs to someone else or doesn't exist — we return a
 * plain 404 either way, so we don't leak which case it was.
 */
import pool from '../../../lib/db';
import { getUserFromCookie } from '../dashboard/middleware';

const RESPONSE_MAX = 2000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!user.dha_license) return res.status(403).json({ error: 'Forbidden' });

  const { review_id, response_text } = req.body || {};

  const reviewId = Number.parseInt(review_id, 10);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({ error: 'Invalid review_id' });
  }

  const text = typeof response_text === 'string' ? response_text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'response_text is required' });
  }
  if (text.length > RESPONSE_MAX) {
    return res.status(400).json({ error: `response_text must be at most ${RESPONSE_MAX} characters` });
  }

  try {
    const r = await pool.query(
      `UPDATE dmd.reviews
          SET response_text = $1, response_at = NOW()
        WHERE id = $2 AND pro_dha_id = $3
        RETURNING id, response_text, response_at`,
      [text, reviewId, String(user.dha_license).trim()]
    );
    if (!r.rows[0]) {
      return res.status(404).json({ error: 'Review not found' });
    }
    return res.status(200).json({ success: true, review: r.rows[0] });
  } catch (e) {
    console.error('api/reviews/respond POST error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
