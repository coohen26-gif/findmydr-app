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
    // Broad/unfiltered searches can match thousands of rows, and a per-row
    // correlated LATERAL against dmd.professional (65k+ rows) for each one
    // was timing out (`canceling statement due to statement timeout`) -
    // found via live testing, not a static bug-hunt pass. Ranking
    // dmd.professional once with a window function, then doing a plain
    // equality JOIN, keeps the same deterministic tiebreak (verified status,
    // then dha id) without re-scanning it per outer row.
    const r = await pool.query(
      `WITH ranked_pro AS (
         SELECT full_name, is_dha_verified,
                ROW_NUMBER() OVER (
                  PARTITION BY full_name
                  ORDER BY is_dha_verified DESC NULLS LAST, dha_unique_id ASC
                ) as rn
           FROM dmd.professional
       )
       SELECT p.id, p.name, p.specialty, p.facility_name, COALESCE(p.search_rank, 0) as search_rank,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified
         FROM physicians p
         LEFT JOIN ranked_pro pr ON pr.full_name = p.name AND pr.rn = 1
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