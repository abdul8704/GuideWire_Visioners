-- IncomeShield — Initial schema
-- Maps all in-memory types from mvp.store.ts to PostgreSQL tables

BEGIN;

-- ============================================================
-- ZONES (seeded reference data)
-- ============================================================
CREATE TABLE IF NOT EXISTS zones (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO zones (id, name) VALUES
    ('zone_blr_north', 'Bengaluru North'),
    ('zone_blr_south', 'Bengaluru South'),
    ('zone_hyd_west',  'Hyderabad West')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PLANS (seeded reference data)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
    id                TEXT PRIMARY KEY,
    code              TEXT NOT NULL CHECK (code IN ('BASIC', 'STANDARD', 'PRO')),
    weekly_premium    NUMERIC(10,2) NOT NULL,
    max_weekly_payout NUMERIC(10,2) NOT NULL
);

INSERT INTO plans (id, code, weekly_premium, max_weekly_payout) VALUES
    ('plan_basic',    'BASIC',    39,  600),
    ('plan_standard', 'STANDARD', 69,  1500),
    ('plan_pro',      'PRO',      119, 2500)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    zone_id       TEXT NOT NULL REFERENCES zones(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- POLICIES
-- ============================================================
CREATE TABLE IF NOT EXISTS policies (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_id           TEXT NOT NULL REFERENCES zones(id),
    plan_id           TEXT NOT NULL REFERENCES plans(id),
    premium_paid      NUMERIC(10,2) NOT NULL,
    max_weekly_payout NUMERIC(10,2) NOT NULL,
    start_at          TIMESTAMPTZ NOT NULL,
    end_at            TIMESTAMPTZ NOT NULL,
    consumed_payout   NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- WEATHER TIME SERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_time_series (
    id                TEXT PRIMARY KEY,
    zone_id           TEXT NOT NULL REFERENCES zones(id),
    observed_at       TIMESTAMPTZ NOT NULL,
    rainfall_mm_per_hr NUMERIC(8,2) NOT NULL DEFAULT 0,
    temp_c            NUMERIC(5,2) NOT NULL DEFAULT 0,
    source_hash       TEXT NOT NULL
);

-- ============================================================
-- TRIGGER EVENTS
-- ============================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hazard_type') THEN
        CREATE TYPE hazard_type AS ENUM ('rainfall', 'heatwave');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE event_status AS ENUM ('open', 'closed');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS trigger_events (
    id               TEXT PRIMARY KEY,
    zone_id          TEXT NOT NULL REFERENCES zones(id),
    hazard_type      hazard_type NOT NULL,
    event_start_at   TIMESTAMPTZ NOT NULL,
    event_end_at     TIMESTAMPTZ,
    duration_minutes INTEGER,
    peak_intensity   NUMERIC(8,2) NOT NULL,
    event_status     event_status NOT NULL DEFAULT 'open',
    last_breach_at   TIMESTAMPTZ NOT NULL
);

-- ============================================================
-- CLAIMS
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
    id                        TEXT PRIMARY KEY,
    user_id                   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id                 TEXT NOT NULL REFERENCES policies(id),
    event_id                  TEXT NOT NULL REFERENCES trigger_events(id),
    hazard_type               hazard_type NOT NULL,
    intensity_factor_used     NUMERIC(4,2) NOT NULL,
    duration_factor_used      NUMERIC(4,2) NOT NULL,
    max_weekly_payout_snapshot NUMERIC(10,2) NOT NULL,
    calculated_payout         NUMERIC(10,2) NOT NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYOUT LEDGER
-- ============================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM ('calculated', 'finalized');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS payout_ledger (
    id         TEXT PRIMARY KEY,
    claim_id   TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    policy_id  TEXT NOT NULL REFERENCES policies(id),
    amount     NUMERIC(10,2) NOT NULL,
    status     payout_status NOT NULL DEFAULT 'calculated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_active  ON policies(user_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_weather_zone     ON weather_time_series(zone_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_trigger_zone     ON trigger_events(zone_id, hazard_type, event_status);
CREATE INDEX IF NOT EXISTS idx_claims_user      ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_claim     ON payout_ledger(claim_id);

COMMIT;
