import { getUserFromCookie } from "../dashboard/middleware";
import pool from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromCookie(req.headers.cookie);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(501).json({
      ok: false,
      message: "Le système de paiement est en cours de configuration.",
    });
  }

  try {
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const params = new URLSearchParams();
      params.append("email", user.email);
      params.append("metadata[user_id]", String(user.id));
      params.append("name", user.full_name_fr || user.full_name_en || user.email);
      const custResp = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const cust = await custResp.json();
      if (!custResp.ok) {
        return res.status(500).json({ error: "Stripe error", details: cust.error?.message });
      }
      customerId = cust.id;
      await pool.query("UPDATE dmd.users SET stripe_customer_id = $1 WHERE id = $2", [customerId, user.id]);
    }

    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "findmydr.ae";
    const returnUrl = `${proto}://${host}/dashboard/billing`;

    const portalParams = new URLSearchParams();
    portalParams.append("customer", customerId);
    portalParams.append("return_url", returnUrl);

    const portalResp = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: portalParams.toString(),
    });

    const portal = await portalResp.json();
    if (!portalResp.ok) {
      return res.status(500).json({ error: "Stripe error", details: portal.error?.message });
    }

    return res.status(200).json({ ok: true, url: portal.url });
  } catch (err) {
    console.error("customer-portal error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

export const config = { api: { bodyParser: true } };
