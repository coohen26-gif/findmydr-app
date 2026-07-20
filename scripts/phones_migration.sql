-- Migration: add phone columns to dmd.professional
-- 2026-07-20 — Mission scrape phones
-- Backup: /tmp/dmd_pre_phone_scrape.dump (4.4 MB)

BEGIN;

ALTER TABLE dmd.professional
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_source TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_professional_phone
  ON dmd.professional(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_phone_source
  ON dmd.professional(phone_source) WHERE phone_source IS NOT NULL;

COMMIT;
