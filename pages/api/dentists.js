import pool from "../../lib/db";

export default async function handler(req, res) {
  const { q = "", id } = req.query;
  try {
    if (id && !/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    if (id) {
      const r = await pool.query(
        `SELECT d.id, d.name, d.specialty, d.facility_name, COALESCE(d.search_rank, 0) as search_rank,
                COALESCE(pr.is_dha_verified, false) as is_dha_verified
           FROM dentists d
           LEFT JOIN LATERAL (
             SELECT pr2.is_dha_verified FROM dmd.professional pr2
              WHERE pr2.full_name = d.name
              ORDER BY (pr2.specialty = d.specialty) DESC NULLS LAST, pr2.is_dha_verified DESC NULLS LAST
              LIMIT 1
           ) pr ON true
          WHERE d.id = $1 LIMIT 1`,
        [id]
      );
      return res.status(200).json({ dentists: r.rows });
    }
    const r = await pool.query(
      `SELECT d.id, d.name, d.specialty, d.facility_name, COALESCE(d.search_rank, 0) as search_rank,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified
         FROM dentists d
         LEFT JOIN LATERAL (
           SELECT pr2.is_dha_verified FROM dmd.professional pr2
            WHERE pr2.full_name = d.name
            ORDER BY (pr2.specialty = d.specialty) DESC NULLS LAST, pr2.is_dha_verified DESC NULLS LAST
            LIMIT 1
         ) pr ON true
        WHERE d.name ILIKE $1 OR d.specialty ILIKE $1 OR d.facility_name ILIKE $1
        ORDER BY d.search_rank DESC, d.name ASC LIMIT 50`,
      ["%" + q + "%"]
    );
    return res.status(200).json({ dentists: r.rows });
  } catch (err) {
    console.error('api/dentists error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}