-- ============================================================
-- ShikshaSetu Platform — Production Auth & Lifecycle Schema
-- Migration: 003_auth_lifecycle_schema.sql
-- ============================================================

-- ---------- 1. EXTEND USERS TABLE FOR LIFECYCLE STATUS ----------
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'pending_verification', 'active', 'deactivated'));

-- Sync status with is_active for existing active users
UPDATE users SET status = 'active' WHERE is_active = true AND status IS NULL;
UPDATE users SET status = 'deactivated' WHERE is_active = false AND status IS NULL;

-- ---------- 2. SCHOOLS TABLE ----------
CREATE TABLE IF NOT EXISTS schools (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    code       VARCHAR(50) UNIQUE NOT NULL,
    district   VARCHAR(100) NOT NULL DEFAULT 'Punjab',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);

-- ---------- 3. APPROVED EMAIL DOMAINS TABLE ----------
CREATE TABLE IF NOT EXISTS approved_email_domains (
    id          SERIAL PRIMARY KEY,
    domain      VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approved_domains ON approved_email_domains(domain);

-- ---------- 4. STUDENT REGISTRY TABLE ----------
-- Pre-approved government school student records.
-- Students must match a registry record to successfully register.
CREATE TABLE IF NOT EXISTS student_registry (
    id                 SERIAL PRIMARY KEY,
    school_id          INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    email              VARCHAR(255) UNIQUE NOT NULL,
    full_name          VARCHAR(100) NOT NULL,
    class_id           INTEGER NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    roll_number        VARCHAR(50) NOT NULL,
    section            VARCHAR(10) NOT NULL DEFAULT 'A',
    is_registered      BOOLEAN NOT NULL DEFAULT false,
    registered_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_registry_school_class_roll UNIQUE (school_id, class_id, roll_number)
);

CREATE INDEX IF NOT EXISTS idx_student_registry_email ON student_registry(email);
CREATE INDEX IF NOT EXISTS idx_student_registry_class ON student_registry(class_id);

-- ---------- 5. EMAIL VERIFICATION TOKENS TABLE ----------
-- Stores SHA-256 hashed one-time tokens for email verification & teacher invitations.
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    token_type VARCHAR(30) NOT NULL DEFAULT 'student_verify' 
               CHECK (token_type IN ('student_verify', 'teacher_invite')),
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evt_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);

-- ---------- 6. PASSWORD RESET TOKENS TABLE ----------
-- Stores SHA-256 hashed single-use password reset tokens.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);

-- ---------- 7. AUDIT LOGS TABLE ----------
-- Immutable audit log for security, administrative, and assessment activities.
CREATE TABLE IF NOT EXISTS audit_logs (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id   VARCHAR(50),
    details       JSONB,
    ip_address    VARCHAR(45),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
