#!/usr/bin/env node
/**
 * WS6 seed: randomize consultation fees for 200 pros.
 * Updates dmd.professional.consultation_fee_aed with 200-600 AED.
 * Picks 200 pros that have bio_fr (real profiles).
 */
const { Pool } = require('pg');

// lib/db.js already fixed this exact 'changeme' hardcode in 8 other files
// (see its header comment) — this script was missed. No insecure fallback:
// refuse to run rather than silently connecting with a default password.
const PGUSER = process.env.PGUSER || 'findmydr';
const PGPASSWORD = process.env.PGPASSWORD;
const PGHOST = process.env.PGHOST || '127.0.0.1';
const PGPORT = parseInt(process.env.PGPORT || '5432', 10);
const PGDATABASE = process.env.PGDATABASE || 'findmydr';

if (!PGPASSWORD) {
  console.error('[seed_fees] PGPASSWORD env var is required — refusing to run with an insecure default.');
  process.exit(1);
}

const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE,
});

async function main() {
  try {
    const sql = `
      UPDATE dmd.professional
         SET consultation_fee_aed = 200 + floor(random() * 401)::int,
             fee_currency = 'AED',
             fee_updated_at = NOW()
       WHERE dha_unique_id IN (
         SELECT dha_unique_id FROM dmd.professional
          WHERE specialty IS NOT NULL
          ORDER BY random()
          LIMIT 200
       )
      RETURNING dha_unique_id, consultation_fee_aed
    `;
    const r = await pool.query(sql);
    console.log(`[seed_fees] Updated ${r.rowCount} pros with consultation fees 200-600 AED`);
    if (r.rows.length > 0) {
      console.log('[seed_fees] Sample:', r.rows.slice(0, 5));
    }
  } catch (e) {
    console.error('[seed_fees] error:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
