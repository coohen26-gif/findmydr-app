/**
 * /api/professional/[slug]
 * Unified API to fetch a single professional by slug.
 * Returns: { found, professional, related, stats }
 */
import pool from '../../../lib/db';

function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function tryParseSlug(slug) {
  const m = String(slug).match(/(\d{4,8})/);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  const licenseHint = tryParseSlug(slug);
  const slugText = String(slug).replace(/-/g, ' ');

  try {
    let rows = [];
    if (licenseHint) {
      const result = await pool.query(
        `SELECT dha_unique_id, full_name, category, specialty, license_type, facility_name, phone, phone_source
           FROM dmd.professional
          WHERE dha_unique_id = $1
             OR LOWER(full_name) LIKE $2
          ORDER BY (dha_unique_id = $1) DESC, length(full_name) ASC
          LIMIT 5`,
        [licenseHint, '%' + slugText.slice(0, 30) + '%']
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT dha_unique_id, full_name, category, specialty, license_type, facility_name, phone, phone_source
           FROM dmd.professional
          WHERE LOWER(full_name) LIKE $1
          ORDER BY length(full_name) ASC
          LIMIT 5`,
        ['%' + slugText + '%']
      );
      rows = result.rows;
    }

    if (rows.length === 0) {
      return res.status(404).json({ found: false, error: 'No professional matched this slug' });
    }

    const best = rows[0];

    let related = [];
    if (best.facility_name) {
      const rel = await pool.query(
        `SELECT dha_unique_id, full_name, specialty
           FROM dmd.professional
          WHERE facility_name = $1
            AND dha_unique_id != $2
          ORDER BY full_name
          LIMIT 10`,
        [best.facility_name, best.dha_unique_id]
      );
      related = rel.rows;
    }

    let stats = null;
    if (best.facility_name) {
      const s = await pool.query(
        `SELECT professional_count, category_count, specialty_count
           FROM dmd.facility_summary
          WHERE facility_name = $1`,
        [best.facility_name]
      );
      if (s.rows[0]) stats = s.rows[0];
    }

    return res.status(200).json({
      found: true,
      professional: {
        ...best,
        slug: slugify(best.full_name + '-' + best.dha_unique_id),
      },
      related,
      stats,
    });
  } catch (err) {
    console.error('api/professional/[slug] error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
