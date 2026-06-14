/**
 * /api/dashboard/stats
 * GET — returns dashboard statistics: views, clicks, appointments
 * Each query is wrapped in try/catch so an empty/missing table doesn't kill the whole endpoint.
 */
import pool from '../../../lib/db';
import { getUserFromCookie } from './middleware';

async function safeQuery(sql, params) {
  try {
    const r = await pool.query(sql, params);
    return r.rows || [];
  } catch (e) {
    console.error('stats safeQuery error:', e.message);
    return [];
  }
}

export default async function handler(req, res) {
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const [views, appts, clicks] = await Promise.all([
    safeQuery(
      `SELECT DATE(viewed_at) as day, COUNT(*) as count
         FROM dmd.profile_views
        WHERE user_id = $1 AND viewed_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(viewed_at) ORDER BY day`,
      [user.id]
    ),
    safeQuery(
      `SELECT status, COUNT(*) as count
         FROM dmd.appointments
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY status`,
      [user.id]
    ),
    safeQuery(
      `SELECT click_type, COUNT(*) as count
         FROM dmd.link_clicks
        WHERE user_id = $1 AND clicked_at > NOW() - INTERVAL '30 days'
        GROUP BY click_type`,
      [user.id]
    ),
  ]);

  return res.status(200).json({
    period: '30d',
    views: {
      total: views.reduce((s, r) => s + parseInt(r.count || 0), 0),
      per_day: views,
    },
    appointments: {
      by_status: appts,
      total: appts.reduce((s, r) => s + parseInt(r.count || 0), 0),
    },
    clicks,
    profile_completeness: user.profile_completeness || 0,
    plan: user.plan || 'free',
  });
}

export const config = { api: { bodyParser: false } };
