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
       SELECT d.id, d.name, d.specialty, d.facility_name, COALESCE(d.search_rank, 0) as search_rank,
              COALESCE(pr.is_dha_verified, false) as is_dha_verified
         FROM dentists d
         LEFT JOIN ranked_pro pr ON pr.full_name = d.name AND pr.rn = 1
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