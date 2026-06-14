/**
 * /api/auth/logout
 * POST — clears the session cookie
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', [
    'dmd_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
  ]);
  return res.status(200).json({ ok: true, message: 'Logged out' });
}

export const config = { api: { bodyParser: false } };
