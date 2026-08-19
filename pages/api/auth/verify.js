/**
 * /api/auth/verify
 * GET ?token=xxx — verifies a magic link token and returns a session JWT
 * If valid, sets a secure httpOnly cookie and returns user info.
 */
import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.DMD_JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('DMD_JWT_SECRET env var is required — refusing to start with an insecure default.');
}
const SESSION_COOKIE = 'dmd_session';
const SESSION_DURATION = 7 * 24 * 60 * 60;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    const result = await pool.query(
      `SELECT at.id, at.user_id, at.expires_at, at.used_at, u.email
         FROM dmd.auth_tokens at
         JOIN dmd.users u ON u.id = at.user_id
        WHERE at.token = $1
          AND at.purpose = 'magic_link'
        LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired link' });
    }
    const row = result.rows[0];
    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Link expired' });
    }

    // Atomic claim: the SELECT above only reads state, so two concurrent
    // requests for the same token could both pass it before either UPDATE
    // commits. Guarding the UPDATE itself on used_at IS NULL and checking
    // the affected row count makes single-use enforcement race-proof.
    const claim = await pool.query(
      `UPDATE dmd.auth_tokens SET used_at = NOW() WHERE id = $1 AND used_at IS NULL RETURNING id`,
      [row.id]
    );
    if (claim.rows.length === 0) {
      return res.status(401).json({ error: 'Link already used' });
    }

    const userRes = await pool.query(
      `SELECT id, email, dha_license, plan, plan_expires_at, profile_completeness
         FROM dmd.users WHERE id = $1`,
      [row.user_id]
    );
    const user = userRes.rows[0];

    const sessionToken = jwt.sign(
      { uid: user.id, email: user.email, plan: user.plan || 'free' },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );

    res.setHeader('Set-Cookie', [
      `${SESSION_COOKIE}=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION}`,
    ]);

    res.writeHead(302, { Location: '/dashboard' });
    res.end();
  } catch (err) {
    console.error('auth/verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = { api: { bodyParser: false } };
