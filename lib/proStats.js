/**
 * lib/proStats.js
 * Computes real (non-fabricated) profile stats for a doctor/dentist detail page:
 * views (30d), WhatsApp contact clicks (30d), and review rating/count.
 *
 * Views and clicks are tracked against dmd.users.id (see pages/api/track/view.js
 * and pages/api/track/click.js), resolved the same way those endpoints resolve it:
 * DHA-license match ONLY (dmd.users.dha_license = pro.dha_unique_id). There is no
 * name-based fallback — full_name_en/full_name_fr on dmd.users are freely
 * user-editable and match the public listing name, so name matching would let
 * any user impersonate a competitor's identity and harvest their analytics
 * (BUG-2). Unclaimed profiles (no matching dmd.users row) have no tracked
 * user_id and correctly show zero — that's an honest zero, not a bug.
 *
 * Rating/review count comes from dmd.reviews, keyed by pro_dha_id (dha_unique_id).
 */

async function resolveUserId(pool, pro) {
  try {
    if (pro.dha_unique_id) {
      const u = await pool.query(`SELECT id FROM dmd.users WHERE dha_license = $1 LIMIT 1`, [String(pro.dha_unique_id).trim()]);
      if (u.rows[0]) return u.rows[0].id;
    }
  } catch (e) {
    console.error('proStats resolveUserId error:', e.message);
  }
  return null;
}

export async function getProStats(pool, pro) {
  const stats = { views: 0, whatsappClicks: 0, avgRating: 0, totalReviews: 0 };
  if (!pro) return stats;

  try {
    const userId = await resolveUserId(pool, pro);
    if (userId) {
      const [viewsRes, clicksRes] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS n FROM dmd.profile_views WHERE user_id = $1 AND viewed_at > NOW() - INTERVAL '30 days'`,
          [userId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM dmd.link_clicks WHERE user_id = $1 AND click_type = 'whatsapp' AND clicked_at > NOW() - INTERVAL '30 days'`,
          [userId]
        ),
      ]);
      stats.views = viewsRes.rows[0]?.n || 0;
      stats.whatsappClicks = clicksRes.rows[0]?.n || 0;
    }
  } catch (e) {
    console.error('proStats views/clicks error:', e.message);
  }

  try {
    if (pro.dha_unique_id) {
      const agg = await pool.query(
        `SELECT COUNT(*)::int AS total, COALESCE(AVG(rating), 0)::float AS avg
           FROM dmd.reviews WHERE pro_dha_id = $1`,
        [pro.dha_unique_id]
      );
      const a = agg.rows[0];
      stats.totalReviews = a.total;
      stats.avgRating = a.total > 0 ? Math.round(a.avg * 10) / 10 : 0;
    }
  } catch (e) {
    console.error('proStats rating error:', e.message);
  }

  return stats;
}

export default getProStats;
