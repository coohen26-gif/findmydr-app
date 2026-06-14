/**
 * pages/api/stripe/create-checkout.js
 * POST { plan: 'premium' | 'pro', cycle: 'monthly' | 'yearly' }
 * Creates a Stripe Checkout session and returns the URL.
 *
 * Setup (TODO M.):
 *   1. Create Stripe UAE account: https://dashboard.stripe.com/register
 *   2. Add API keys to .env: STRIPE_SECRET_KEY=sk_...
 *   3. Create 2 products in Stripe dashboard: Premium 200 AED/mo, Pro 500 AED/mo
 *   4. Copy price IDs to .env: STRIPE_PRICE_PREMIUM_MONTHLY=price_..., STRIPE_PRICE_PRO_MONTHLY=price_..., etc.
 *   5. Set webhook secret: STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * Current state: stub. Returns 501 with a friendly message. UI gracefully shows "Paiement bientôt disponible".
 */
import { getUserFromCookie } from '../dashboard/middleware';
import pool from '../../../lib/db';

const PLAN_TO_PRICE = {
  premium: { monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY, yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY },
  pro:     { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,     yearly: process.env.STRIPE_PRICE_PRO_YEARLY },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { plan, cycle = 'monthly' } = req.body || {};
  if (!['premium', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  if (!['monthly', 'yearly'].includes(cycle)) {
    return res.status(400).json({ error: 'Invalid cycle' });
  }

  const priceId = PLAN_TO_PRICE[plan][cycle];
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY || !priceId) {
    return res.status(501).json({
      ok: false,
      message: 'Le système de paiement est en cours de configuration. Réessayez bientôt ou contactez contact@findmydr.ae.',
      setup_required: true,
    });
  }

  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'findmydr.ae';
    const successUrl = `${proto}://${host}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${proto}://${host}/dashboard/upgrade?cancelled=true`;

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('client_reference_id', String(user.id));
    params.append('customer_email', user.email);
    params.append('metadata[user_id]', String(user.id));
    params.append('metadata[plan]', plan);
    params.append('metadata[cycle]', cycle);
    params.append('allow_promotion_codes', 'true');

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Stripe error:', data);
      return res.status(500).json({ error: 'Stripe error', details: data.error?.message });
    }

    try {
      await pool.query(
        `INSERT INTO dmd.payment_events(user_id, event_type, plan, cycle, stripe_session_id, created_at)
         VALUES ($1, 'checkout_created', $2, $3, $4, NOW())`,
        [user.id, plan, cycle, data.id]
      );
    } catch {}

    return res.status(200).json({ ok: true, url: data.url, sessionId: data.id });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}

export const config = { api: { bodyParser: true } };
