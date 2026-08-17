import pool from '../../../lib/db';
import { getUserFromCookie } from './middleware';

export default async function handler(req, res) {
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const r = await pool.query('SELECT * FROM dmd.professional WHERE dha_unique_id = $1', [user.dha_license]);
    return res.status(200).json({ user, professional: r.rows[0] });
  }

  if (req.method === 'POST') {
    const { bio_ar, bio_fr, instagram, linkedin, google_maps } = req.body;
    try {
      await pool.query(
        'UPDATE dmd.professional SET bio_ar = $1, bio_fr = $2, social_links = $3 WHERE dha_unique_id = $4',
        [bio_ar, bio_fr, JSON.stringify({ instagram, linkedin, google_maps }), user.dha_license]
      );
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
}
