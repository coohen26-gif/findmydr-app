/**
 * /api/reviews/[id]
 * GET — reviews for a professional identified by their DHA unique id.
 *
 * Public mode (default): returns reviews for the given dha id, mirroring the
 * query used server-side on the doctor/dentist profile pages.
 *
 * Dashboard mode (?all=true): requires an authenticated dashboard session
 * (dmd_session cookie) belonging to the same professional whose reviews are
 * being requested — used by /dashboard/reviews to list a professional's own
 * reviews for management.
 *
 * Note: dmd.reviews has no response_text/response_at column yet, so replies
 * are not persisted or returned here. See /dashboard/reviews for the
 * user-facing "coming soon" state on the reply feature.
 */
import pool from '../../../lib/db';
import { getUserFromCookie } from '../dashboard/middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, all } = req.query;
  if (!id || !/^\d{4,8}$/.test(String(id))) {
    return res.status(400).json({ error: 'Invalid or missing professional id' });
  }

  if (all === 'true') {
    const user = await getUserFromCookie(req.headers.cookie);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (!user.dha_license || String(user.dha_license).trim() !== String(id).trim()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const r = await pool.query(
      `SELECT id, rating, text, author_name, verified, visit_date, created_at
         FROM dmd.reviews WHERE pro_dha_id = $1
        ORDER BY created_at DESC LIMIT 200`,
      [String(id).trim()]
    );
    return res.status(200).json({ reviews: r.rows });
  } catch (e) {
    console.error('api/reviews/[id] GET error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
