/**
 * /api/dashboard/appointments
 * GET  — list appointments for the logged-in professional, optionally scoped
 *        to [from, to) (used by the calendar to fetch the visible month).
 * POST — create a new appointment for the logged-in professional (used by
 *        the "Nouveau RDV" modal on the calendar page).
 */
import pool from '../../../lib/db';
import { getUserFromCookie } from './middleware';

export default async function handler(req, res) {
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'GET') {
    const { from, to } = req.query;
    try {
      let sql = `SELECT id, patient_name, patient_email, patient_phone, appointment_at,
                        duration_min, status, reason, notes, language, created_at, updated_at
                   FROM dmd.appointments
                  WHERE user_id = $1`;
      const params = [user.id];
      if (from && !isNaN(Date.parse(from))) {
        params.push(from);
        sql += ` AND appointment_at >= $${params.length}`;
      }
      if (to && !isNaN(Date.parse(to))) {
        params.push(to);
        sql += ` AND appointment_at < $${params.length}`;
      }
      sql += ' ORDER BY appointment_at ASC LIMIT 500';
      const r = await pool.query(sql, params);
      return res.status(200).json({ appointments: r.rows });
    } catch (e) {
      console.error('api/dashboard/appointments GET error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    const { patient_name, patient_phone, patient_email, appointment_at, duration_min, reason, language } = req.body || {};
    if (!patient_name || !String(patient_name).trim()) {
      return res.status(400).json({ error: 'patient_name is required' });
    }
    if (!appointment_at || isNaN(Date.parse(appointment_at))) {
      return res.status(400).json({ error: 'appointment_at is required and must be a valid date/time' });
    }
    const parsedDuration = parseInt(duration_min, 10);
    try {
      const r = await pool.query(
        `INSERT INTO dmd.appointments
           (user_id, patient_name, patient_email, patient_phone, appointment_at, duration_min, status, reason, language)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
         RETURNING id, patient_name, patient_email, patient_phone, appointment_at, duration_min, status, reason, notes, language, created_at, updated_at`,
        [
          user.id,
          String(patient_name).trim(),
          patient_email || null,
          patient_phone || null,
          appointment_at,
          Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 30,
          reason || null,
          language || 'en',
        ]
      );
      return res.status(201).json({ appointment: r.rows[0] });
    } catch (e) {
      console.error('api/dashboard/appointments POST error:', e.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
