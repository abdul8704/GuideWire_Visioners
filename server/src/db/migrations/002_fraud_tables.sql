-- IncomeShield — FraudShield tables
-- Adds fraud scoring, ring alerts for BTS-based fraud detection

BEGIN;

-- ============================================================
-- FRAUD SCORES (per-claim BTS)
-- ============================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_tier') THEN
        CREATE TYPE verification_tier AS ENUM ('auto_approved', 'soft_verify', 'held_for_review');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS fraud_scores (
    id              TEXT PRIMARY KEY,
    claim_id        TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bts_score       INTEGER NOT NULL CHECK (bts_score >= 0 AND bts_score <= 100),
    tier            verification_tier NOT NULL,
    signals         JSONB NOT NULL DEFAULT '{}',
    ring_flagged    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RING ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ring_alerts (
    id              TEXT PRIMARY KEY,
    zone_id         TEXT NOT NULL REFERENCES zones(id),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    worker_count    INTEGER NOT NULL,
    claim_ids       TEXT[] NOT NULL DEFAULT '{}',
    alert_type      TEXT NOT NULL CHECK (alert_type IN ('temporal_spike', 'amount_uniformity', 'referral_cluster')),
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at     TIMESTAMPTZ,
    notes           TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_fraud_scores_claim ON fraud_scores(claim_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_user ON fraud_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_ring_alerts_zone ON ring_alerts(zone_id, detected_at);

COMMIT;
