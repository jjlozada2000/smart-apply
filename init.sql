-- Smart Apply — schema v2 (Google OAuth auth)
-- psql -U postgres -c "CREATE DATABASE smart_apply;"
-- psql -U postgres -d smart_apply -f init.sql

CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    email             VARCHAR(255) UNIQUE NOT NULL,
    name              VARCHAR(255),
    google_id         VARCHAR(255) UNIQUE NOT NULL,
    avatar_url        TEXT,
    gmail_credentials TEXT,      -- JSON: OAuth tokens
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company      VARCHAR(255) NOT NULL,
    role         VARCHAR(255) NOT NULL,
    job_link     TEXT,
    status       VARCHAR(50) NOT NULL DEFAULT 'applied'
                     CHECK (status IN ('applied','interview','rejected','offer')),
    date_applied DATE NOT NULL DEFAULT CURRENT_DATE,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    data       JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_content (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER NOT NULL,
    application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    type           VARCHAR(50) NOT NULL CHECK (type IN ('resume','cover_letter')),
    content        TEXT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id     ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_user_id    ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id      ON users(google_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_updated_at ON applications;
CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
