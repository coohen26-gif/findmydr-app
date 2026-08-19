/**
 * /api/dashboard/middleware.js
 * Validates the session cookie and adds user info to req.
 * Used by all /api/dashboard/* endpoints.
 */
import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.DMD_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('DMD_JWT_SECRET env var is required — refusing to start with an insecure default.');
}

export async function getUserFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies['dmd_session'];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const r = await pool.query(
      `SELECT id, email, dha_license, plan, plan_expires_at, profile_completeness,
              full_name_fr, full_name_en, full_name_ar, bio_fr, bio_en, bio_ar,
              photo_url, specialties, languages_spoken, phone, whatsapp, stripe_customer_id
         FROM dmd.users WHERE id = $1`,
      [payload.uid]
    );
    return r.rows[0] || null;
  } catch (e) {
    return null;
  }
}
