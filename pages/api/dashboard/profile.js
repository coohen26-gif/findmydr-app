import pool from '../../../lib/db';
import { getUserFromCookie } from './middleware';

export default async function handler(req, res) {
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const r = await pool.query('SELECT * FROM dmd.professional WHERE dha_unique_id = $1', [user.dha_license]);
    return res.status(200).json({ user, professional: r.rows[0] });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const {
      full_name_fr, full_name_en, full_name_ar,
      bio_fr, bio_en, bio_ar,
      photo_url, specialties, languages_spoken,
      phone, whatsapp, consultation_fee_aed,
      instagram, linkedin, google_maps_url,
    } = req.body;
    try {
      const filledCount = [full_name_fr, full_name_en, full_name_ar, bio_fr, bio_en, bio_ar, photo_url, phone, whatsapp, consultation_fee_aed]
        .filter((v) => v !== undefined && v !== null && v !== '').length
        + [specialties, languages_spoken].filter((v) => Array.isArray(v) && v.length > 0).length;
      const profile_completeness = Math.round((filledCount / 12) * 100);

      await pool.query(
        `UPDATE dmd.users SET
           full_name_fr = $1, full_name_en = $2, full_name_ar = $3,
           bio_fr = $4, bio_en = $5, bio_ar = $6,
           photo_url = $7, specialties = $8, languages_spoken = $9,
           phone = $10, whatsapp = $11, consultation_fee_aed = $12,
           social_links = $13, profile_completeness = $14, updated_at = NOW()
         WHERE id = $15`,
        [
          full_name_fr || null, full_name_en || null, full_name_ar || null,
          bio_fr || null, bio_en || null, bio_ar || null,
          photo_url || null, specialties || [], languages_spoken || [],
          phone || null, whatsapp || null, consultation_fee_aed || null,
          JSON.stringify({ instagram, linkedin, google_maps_url }), profile_completeness,
          user.id,
        ]
      );
      return res.status(200).json({ success: true, profile_completeness });
    } catch (e) {
      console.error('api/dashboard/profile POST error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
