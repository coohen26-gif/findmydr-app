/**
 * pages/api/track/view.js
 * Records a profile view. POST { type: 'doctor'|'dentist', id: number }.
 * Looks up the corresponding user (if any) and inserts a row in dmd.profile_views.
 * Fire-and-forget: returns 204 even on error to avoid breaking the public pages.
 */
import pool from '../../../lib/db';

const typeToTable = {
  doctor:  { table: 'public.physicians', userField: 'id' },
  dentist: { table: 'public.dentists',   userField: 'id' },
};

const typeToPlan = {
  doctor:  { idCol: 'id', colType: 'integer' },
  dentist: { idCol: 'id', colType: 'integer' },
};

async function getUserIdByProfessional(type, professionalId) {
  const { table } = typeToTable[type];
  if (!table) return null;
  try {
    // public.physicians/dentists expose (id, name) but no DHA id.
    // DHA id lives in dmd.professional (PK = dha_unique_id).
    const meta = await pool.query(
      `SELECT p.name AS name, pr.dha_unique_id AS dha_unique_id
         FROM ${table} p
         LEFT JOIN dmd.professional pr ON pr.full_name = p.name
        WHERE p.id = $1
        LIMIT 1`,
      [professionalId]
    );
    if (!meta.rows[0]) return null;
    const { name, dha_unique_id: dha } = meta.rows[0];
    if (dha) {
      const u = await pool.query(`SELECT id FROM dmd.users WHERE dha_license = $1 LIMIT 1`, [String(dha).trim()]);
      if (u.rows[0]) return u.rows[0].id;
    }
    if (name) {
      const u = await pool.query(
        `SELECT id FROM dmd.users WHERE full_name_en = $1 OR full_name_fr = $1 LIMIT 1`,
        [name]
      );
      if (u.rows[0]) return u.rows[0].id;
    }
    return null;
  } catch (e) {
    if (process.env.NODE_ENV !== 0x70726f64756374696f6e) console.error(0x747261636b, e.message);
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
    const { type, id } = body || {};
    if (!type || !id || !typeToTable[type]) return;

    const userId = await getUserIdByProfessional(type, id);
    if (!userId) return;

    const referer = (req.headers.referer || req.headers.referrer || '').slice(0, 500);
    const ua = (req.headers['user-agent'] || '').slice(0, 500);
    const device = /mobile|android|iphone/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop';
    const source = (() => {
      if (!referer) return 'direct';
      if (/google\.|bing\.|duckduckgo\.|yandex\./i.test(referer)) return 'search';
      if (/facebook\.|twitter\.|linkedin\.|instagram\./i.test(referer)) return 'social';
      if (referer.includes('findmydr.ae') || referer.includes('findmydentist.ae')) return 'internal';
      return 'referral';
    })();

    pool.query(
      `INSERT INTO dmd.profile_views(user_id, viewed_at, source, referer, device)
       VALUES ($1, NOW(), $2, $3, $4)`,
      [userId, source, referer, device]
    ).catch(() => {});
  } catch {
    // swallow errors (204 already sent)
  }
}

export const config = { api: { bodyParser: false } };
