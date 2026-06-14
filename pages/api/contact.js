/**
 * pages/api/contact.js
 * POST { name, email, subject, message }
 * Forwards the message to contact@findmydr.ae via Brevo.
 * Public endpoint, no auth.
 */
import { sendContactEmail } from '../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
  }

  const result = await sendContactEmail({ name, email, subject: subject || 'general', message });
  return res.status(200).json({ ok: true, ...result });
}

export const config = { api: { bodyParser: true } };
