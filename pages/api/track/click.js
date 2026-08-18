/**
 * pages/api/track/click.js
 * Records a click on a contact link (phone, whatsapp, email, website).
 * POST { type: 'doctor'|'dentist', id, click_type: 'phone'|'whatsapp'|'email'|'website' }
 * Looks up the user_id and inserts a row in dmd.link_clicks.
 */
import pool from '../../../lib/db';

const VALID_TYPES = new Set(['phone', 'whatsapp', 'email', 'website', 'maps', 'booking']);

async function getUserIdByProfessional(type, professionalId) {
  const table = type === 'dentist' ? 'public.dentists' : 'public.physicians';
  try {
    // public.physicians/dentists expose (id, name) but no DHA id.
    // DHA id lives in dmd.professional (PK = dha_unique_id).
    // Attribution is DHA-license match ONLY. full_name_en/full_name_fr on
    // dmd.users are freely user-editable and match the public listing name,
    // so a name-based fallback would let any user impersonate a competitor's
    // identity and silently harvest their view/click analytics (BUG-2).
    // Do NOT reintroduce a name-match fallback here.
    const meta = await pool.query(
      `SELECT pr.dha_unique_id AS dha_unique_id
         FROM ${table} p
         LEFT JOIN dmd.professional pr ON pr.full_name = p.name
        WHERE p.id = $1
        LIMIT 1`,
      [professionalId]
    );
    if (!meta.rows[0]) return null;
    const dha = meta.rows[0].dha_unique_id;
    if (dha) {
      const u = await pool.query(`SELECT id FROM dmd.users WHERE dha_license = $1 LIMIT 1`, [String(dha).trim()]);
      if (u.rows[0]) return u.rows[0].id;
    }
    return null;
  } catch {
    return null;
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
    return res.status(405).end();
  }
  res.status(204).end();

  try {
    const body = await readJsonBody(req);
    const { type, id, click_type } = body || {};
    if (!type || !id || !click_type || !VALID_TYPES.has(click_type)) return;

    const userId = await getUserIdByProfessional(type, id);
    if (!userId) return;

    const sourcePage = (req.headers.referer || req.headers.referrer || '').slice(0, 500);

    pool.query(
      `INSERT INTO dmd.link_clicks(user_id, click_type, clicked_at, source_page)
       VALUES ($1, $2, NOW(), $3)`,
      [userId, click_type, sourcePage]
    ).catch(() => {});
  } catch {
    // swallow errors (204 already sent)
  }
}

export const config = { api: { bodyParser: false } };
