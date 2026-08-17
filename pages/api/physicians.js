import pool from "../../lib/db";

export default async function handler(req, res) {
  const { q = "", id } = req.query;
  try {
    if (id) {
      const r = await pool.query(
        "SELECT id, name, specialty, facility_name, COALESCE(search_rank, 0) as search_rank FROM physicians WHERE id = $1 LIMIT 1",
        [id]
      );
      return res.status(200).json({ physicians: r.rows });
    }
    const r = await pool.query(
      "SELECT id, name, specialty, facility_name, COALESCE(search_rank, 0) as search_rank FROM physicians WHERE name ILIKE $1 OR specialty ILIKE $1 OR facility_name ILIKE $1 ORDER BY search_rank DESC, name ASC LIMIT 50",
      ["%" + q + "%"]
    );
    return res.status(200).json({ physicians: r.rows });
  } catch (err) {
    console.error('api/physicians error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}