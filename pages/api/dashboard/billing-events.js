import pool from "../../../lib/db";
import { getUserFromCookie } from "./middleware";

export default async function handler(req, res) {
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  try {
    const r = await pool.query(
      "SELECT event_type, plan, cycle, amount, created_at FROM dmd.payment_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [user.id]
    );
    return res.status(200).json({ events: r.rows });
  } catch {
    return res.status(200).json({ events: [] });
  }
}
