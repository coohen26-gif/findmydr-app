-- WS5 - Reviews verified SMS OTP
CREATE TABLE IF NOT EXISTS dmd.reviews (
  id SERIAL PRIMARY KEY,
  pro_dha_id CHAR(8) NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  author_name TEXT,
  author_phone_hash TEXT,
  verified BOOLEAN DEFAULT FALSE,
  visit_date DATE,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_pro ON dmd.reviews(pro_dha_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON dmd.reviews(verified) WHERE verified = TRUE;

CREATE TABLE IF NOT EXISTS dmd.review_verifications (
  id SERIAL PRIMARY KEY,
  review_id INT REFERENCES dmd.reviews(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,
  otp_code VARCHAR(6),
  otp_sent_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_verifications_review ON dmd.review_verifications(review_id);
CREATE INDEX IF NOT EXISTS idx_review_verifications_phone ON dmd.review_verifications(phone_hash);
