/**
 * lib/email.js
 * Email sending wrapper. Uses Brevo API if BREVO_API_KEY is set, else prints to server logs (dev mode).
 *
 * Setup:
 *   1. Get Brevo API key: https://app.brevo.com/settings/keys/api
 *   2. Verify sender at https://app.brevo.com/settings/senders
 *   3. Set env var on myclaude: BREVO_API_KEY=xkeysib-...
 *   4. Optional: BREVO_FROM_EMAIL, BREVO_FROM_NAME
 */
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@findmydr.ae';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'FindMyDoctor.ae';

function magicLinkTemplate(magicUrl, brand) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your sign-in link — ${brand}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
        <tr><td style="background:linear-gradient(135deg,#0066FF 0%,#00C6FF 100%);padding:32px;text-align:center">
          <div style="font-size:36px;margin-bottom:8px">🩺</div>
          <h1 style="margin:0;color:white;font-size:24px;font-weight:800;letter-spacing:-0.02em">${brand}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">L'annuaire #1 des praticiens DHA à Dubai</p>
        </td></tr>
        <tr><td style="padding:40px 32px">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0F172A">Bonjour Docteur 👋</h2>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">
            Cliquez sur le bouton ci-dessous pour vous connecter à votre tableau de bord.
            Ce lien est valide pendant <strong>24 heures</strong> et ne peut être utilisé qu'une seule fois.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px">
              <a href="${magicUrl}" style="display:inline-block;padding:14px 32px;background:#0066FF;color:white;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(0,102,255,0.3)">
                Se connecter à mon tableau de bord →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#94A3B8">Ou copiez-collez ce lien dans votre navigateur :</p>
          <p style="margin:0;padding:12px;background:#F1F5F9;border-radius:8px;word-break:break-all;font-family:monospace;font-size:12px;color:#475569">${magicUrl}</p>
          <hr style="margin:32px 0;border:none;border-top:1px solid #E2E8F0">
          <p style="margin:0 0 8px;font-size:13px;color:#94A3B8">
            <strong style="color:#475569">Vous n'avez pas demandé cet email ?</strong><br>
            Vous pouvez l'ignorer en toute sécurité. Si vous recevez plusieurs emails non sollicités, contactez <a href="mailto:security@findmydr.ae" style="color:#0066FF">security@findmydr.ae</a>.
          </p>
        </td></tr>
        <tr><td style="background:#F8FAFC;padding:24px 32px;text-align:center;border-top:1px solid #E2E8F0">
          <p style="margin:0 0 4px;font-size:13px;color:#64748B">
            <strong>${brand}</strong> — Annuaire des praticiens DHA à Dubai
          </p>
          <p style="margin:0;font-size:12px;color:#94A3B8">
            <a href="https://findmydr.ae/legal" style="color:#94A3B8;text-decoration:underline">Confidentialité</a> ·
            <a href="https://findmydr.ae/legal" style="color:#94A3B8;text-decoration:underline">CGU</a> ·
            <a href="mailto:contact@findmydr.ae" style="color:#94A3B8;text-decoration:underline">Contact</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMagicLinkEmail(toEmail, magicUrl, isDentist = false) {
  const brand = isDentist ? 'FindMyDentist.ae' : 'FindMyDoctor.ae';
  const subject = `Your ${brand} sign-in link`;

  if (!BREVO_API_KEY) {
    console.log(`\n========== DEV MODE: Magic Link ==========`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Link: ${magicUrl}`);
    console.log(`==========================================\n`);
    return { sent: false, magicUrl, devMode: true };
  }

  const html = magicLinkTemplate(magicUrl, brand);
  const text = `Sign in to your ${brand} dashboard (valid 24h): ${magicUrl}`;

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
        textContent: text,
        tags: ['magic-link'],
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Brevo send failed:', resp.status, errText);
      return { sent: false, error: `Brevo ${resp.status}`, magicUrl };
    }
    return { sent: true };
  } catch (err) {
    console.error('Brevo error:', err);
    return { sent: false, error: err.message, magicUrl };
  }
}

export async function sendContactEmail({ name, email, subject, message }) {
  const to = 'contact@findmydr.ae';
  const subjectMap = {
    general: 'Question générale',
    partnership: 'Partenariat clinique',
    press: 'Presse / Média',
    support: 'Support technique',
    billing: 'Facturation',
  };
  const html = `
    <h2>Nouveau message de contact</h2>
    <p><strong>De :</strong> ${name} (${email})</p>
    <p><strong>Sujet :</strong> ${subjectMap[subject] || subject}</p>
    <p><strong>Message :</strong></p>
    <blockquote style="border-left:4px solid #0066FF;padding-left:16px;color:#475569">${message.replace(/\n/g, '<br>')}</blockquote>
  `;

  if (!BREVO_API_KEY) {
    console.log('[contact] dev mode:', { name, email, subject, message });
    return { sent: false, devMode: true };
  }

  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: to }],
        replyTo: { email, name },
        subject: `[${subjectMap[subject] || subject}] ${name}`,
        htmlContent: html,
        textContent: `From: ${name} (${email})\nSubject: ${subject}\n\n${message}`,
        tags: ['contact-form'],
      }),
    });
    return { sent: resp.ok };
  } catch (err) {
    console.error('contact email error:', err);
    return { sent: false, error: err.message };
  }
}
