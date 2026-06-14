/**
 * pages/api/og/[...id].js
 * Dynamic Open Graph image generator for doctor / dentist profiles.
 * 1200x630 PNG, cached 1 year.
 *
 * URL forms (auto-detected from path):
 *   /api/og/doctor/{id}  -> findmydr.ae blue gradient
 *   /api/og/dentist/{id} -> findmydentist.ae cyan gradient
 *   /api/og/{id}         -> doctor by default
 *
 * Uses next/og (satori + resvg-js). Runs in Node runtime (Next 14+).
 */
import { ImageResponse } from 'next/og';
import pool from '../../../lib/db';

export const config = {
  runtime: 'nodejs',
};

const BRAND = {
  doctor:  { site: 'findmydr.ae',      url: 'https://findmydr.ae',      accent: '#0066FF', from: '#0066FF', to: '#00C6FF' },
  dentist: { site: 'findmydentist.ae', url: 'https://findmydentist.ae', accent: '#06B6D4', from: '#06B6D4', to: '#3B82F6' },
};

async function fetchPro(id, type) {
  if (!id || !/^\d+$/.test(id)) return null;
  try {
    if (type === 'dentist') {
      const r = await pool.query(
        `SELECT name, specialty, facility_name FROM public.dentists WHERE id = $1 LIMIT 1`,
        [parseInt(id, 10)]
      );
      return r.rows[0] || null;
    }
    const r = await pool.query(
      `SELECT name, specialty, facility_name FROM public.physicians WHERE id = $1 LIMIT 1`,
      [parseInt(id, 10)]
    );
    return r.rows[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const parts = req.url.split('?')[0].split('/').filter(Boolean);
  let type = 'doctor';
  let id = null;
  if (parts[0] === 'api' && parts[1] === 'og') {
    if (parts[2] === 'doctor' || parts[2] === 'dentist') {
      type = parts[2];
      id = parts[3];
    } else {
      id = parts[2];
    }
  }
  if (!id) {
    const urlObj = new URL(req.url, 'http://x');
    id = urlObj.searchParams.get('id');
  }
  if (!id || !/^\d+$/.test(id)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(400).send(Buffer.from(''));
  }

  const pro = await fetchPro(id, type);
  const b = BRAND[type];
  const name = pro?.name || (type === 'dentist' ? 'Dentiste à Dubai' : 'Médecin à Dubai');
  const specialty = pro?.specialty || (type === 'dentist' ? 'Dentiste' : 'Médecin');
  const facility = pro?.facility_name || 'Dubai, UAE';

  try {
    const png = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 80px',
            background: `linear-gradient(135deg, ${b.from} 0%, ${b.to} 100%)`,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: '40px', right: '60px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '26px', fontWeight: 800 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🩺
            </div>
            <span>{b.site}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)', padding: '14px 28px', borderRadius: '100px', fontSize: '28px', fontWeight: 700, width: 'fit-content' }}>
            ✓ DHA Licensed
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 'auto' }}>
            <div style={{ fontSize: '34px', fontWeight: 600, opacity: 0.9 }}>
              {specialty}
            </div>
            <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', maxWidth: '1000px', display: 'flex' }}>
              {name}
            </div>
            <div style={{ fontSize: '30px', fontWeight: 500, opacity: 0.9 }}>
              📍 {facility}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '40px', right: '60px', fontSize: '24px', fontWeight: 600, opacity: 0.8 }}>
            {b.url.replace('https://', '')}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, immutable, no-transform, max-age=31536000');
    return res.send(Buffer.from(await png.arrayBuffer()));
  } catch (err) {
    console.error('[api/og] error:', err?.message || err);
    res.status(500);
    res.setHeader('Content-Type', 'image/png');
    return res.send(Buffer.from(''));
  }
}
