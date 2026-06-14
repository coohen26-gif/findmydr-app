/**
 * lib/db.js
 * Centralized PostgreSQL pool for the entire Next.js app.
 * Single source of truth for DB connections.
 *
 * Phase 1 hardening (2026-06-11):
 * - password from env var (was hardcoded 'changeme' in 8 files)
 * - max 20 conns (was unbounded)
 * - statement_timeout 5s (prevents runaway queries)
 * - 5s connection timeout (fail fast if DB down)
 */
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'findmydr',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'findmydr',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});

pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message);
});

export default pool;
