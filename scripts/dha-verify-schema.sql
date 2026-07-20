-- WS7 - DHA dynamic license verification
ALTER TABLE dmd.professional
  ADD COLUMN IF NOT EXISTS dha_verified_status TEXT,
  ADD COLUMN IF NOT EXISTS dha_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dha_expiry_date DATE;

CREATE INDEX IF NOT EXISTS idx_professional_dha_status
  ON dmd.professional(dha_verified_status)
  WHERE dha_verified_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_professional_dha_expiry
  ON dmd.professional(dha_expiry_date)
  WHERE dha_expiry_date IS NOT NULL;
