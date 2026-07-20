-- WS6 - Cost calculator (consultation fees)
ALTER TABLE dmd.professional
  ADD COLUMN IF NOT EXISTS consultation_fee_aed INT,
  ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS fee_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_professional_fee
  ON dmd.professional(consultation_fee_aed)
  WHERE consultation_fee_aed IS NOT NULL;

-- DMD cookie consent table (WS11 privacy)
CREATE TABLE IF NOT EXISTS dmd.cookie_consent (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  ip_hash TEXT,
  accepted BOOLEAN NOT NULL,
  categories JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cookie_consent_session
  ON dmd.cookie_consent(session_id);

CREATE INDEX IF NOT EXISTS idx_cookie_consent_user
  ON dmd.cookie_consent(user_id)
  WHERE user_id IS NOT NULL;
