import pool from "../../lib/db";

export default async function handler(req, res) {
  const { q = "", id } = req.query;
  try {
    if (id && !/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    if (id) {
      const r = await pool.query(
        `SELECT p.id, p.name, p.specialty, p.facility_name, COALESCE(p.search_rank, 0) as search_rank,
                COALESCE(pr.is_dha_verified, false) as is_dha_verified
           FROM physicians p
           LEFT JOIN LATERAL (
             SELECT pr2.is_dha_verified FROM dmd.professional pr2
              WHERE pr2.full_name = p.name
              ORDER BY (pr2.specialty = p.specialty) DESC NULLS LAST, pr2.is_dha_verified DESC NULLS LAST
              LIMIT 1
           ) pr ON true
          WHERE p.id = $1 LIMIT 1`,
        [id]
      );
      return res.status(200).json({ physicians: r.rows });
    }
    const r = await pool.query(
      `SELECT p.id, p.name, p.specialty, p.facility_name, COALESCE(p.search_rank, 0) as search_rank,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified
         FROM physicians p
         LEFT JOIN LATERAL (
           SELECT pr2.is_dha_verified FROM dmd.professional pr2
            WHERE pr2.full_name = p.name
            ORDER BY (pr2.specialty = p.specialty) DESC NULLS LAST, pr2.is_dha_verified DESC NULLS LAST
            LIMIT 1
         ) pr ON true
        WHERE p.name ILIKE $1 OR p.specialty ILIKE $1 OR p.facility_name ILIKE $1
        ORDER BY p.search_rank DESC, p.name ASC LIMIT 50`,
      ["%" + q + "%"]
    );
    return res.status(200).json({ physicians: r.rows });
  } catch (err) {
    console.error('api/physicians error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}