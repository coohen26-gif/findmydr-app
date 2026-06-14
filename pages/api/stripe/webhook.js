import pool from '../../../lib/db';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const config = { api: { bodyParser: false } };

async function syncRank(userId, plan) {
  const rank = plan === 'pro' ? 20 : (plan === 'premium' ? 10 : 0);
  const u = await pool.query('SELECT dha_license FROM dmd.users WHERE id = $1', [userId]);
  if (u.rows[0]?.dha_license) {
    await pool.query(
      'UPDATE dmd.professional SET search_rank = $1 WHERE dha_unique_id = $2',
      [rank, u.rows[0].dha_license.trim()]
    );
  }
}

async function setPlan(userId, plan, stripeSubId = null) {
  await pool.query(
    `UPDATE dmd.users
     SET plan = $1,
         stripe_subscription_id = COALESCE($2, stripe_subscription_id),
         updated_at = NOW()
     WHERE id = $3`,
    [plan, stripeSubId, userId]
  );
  await syncRank(userId, plan);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const buf = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(Buffer.from(data)));
      req.on('error', reject);
    });
    event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await setPlan(userId, plan, session.subscription);
          await pool.query(
            `INSERT INTO dmd.payment_events(user_id, event_type, plan, cycle, stripe_session_id, created_at)
             VALUES ($1, 'checkout_completed', $2, $3, $4, NOW())
             ON CONFLICT DO NOTHING`,
            [userId, plan, session.metadata?.cycle || 'monthly', session.id]
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const u = await pool.query(
          'SELECT id FROM dmd.users WHERE stripe_subscription_id = $1', [sub.id]
        );
        if (u.rows[0]) {
          const plan = sub.status === 'active' ? (sub.metadata?.plan || 'premium') : 'free';
          await setPlan(u.rows[0].id, plan);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const u = await pool.query(
          'SELECT id FROM dmd.users WHERE stripe_subscription_id = $1', [sub.id]
        );
        if (u.rows[0]) await setPlan(u.rows[0].id, 'free');
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Handler error' });
  }

  res.json({ received: true });
}
