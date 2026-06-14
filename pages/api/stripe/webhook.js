import pool from '../../../lib/db';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const config = { api: { bodyParser: false } };
async function syncRank(userId, plan) {
  const rank = plan === 'pro' ? 20 : (plan === 'premium' ? 10 : 0);
  const u = await pool.query('SELECT dha_license FROM dmd.users WHERE id = ', [userId]);
  if (u.rows[0]?.dha_license) {
    await pool.query('UPDATE dmd.professional SET search_rank =  WHERE dha_unique_id = ', [rank, u.rows[0].dha_license]);
  }
}
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const buf = await new Promise((resolve) => { let data = ''; req.on('data', chunk => data += chunk); req.on('end', () => resolve(Buffer.from(data))); });
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
  } catch (err) { return res.status(400).send('Webhook Error'); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;
    const plan = session.metadata.plan;
    await pool.query('UPDATE dmd.users SET plan =  WHERE id = ', [plan, userId]);
    await syncRank(userId, plan);
  }
  res.json({ received: true });
}
