-- UER schema. Runs on every start (spring.sql.init.mode=always), so every
-- statement is idempotent.

-- Incidents table shared by the UER Reporter and Responder frontends.
-- `images` is a JSON array of base64 data-URLs (max 4). `status` defaults to
-- the initial 'Reported' state when omitted.
CREATE TABLE IF NOT EXISTS incidents (
    id            text PRIMARY KEY,
    type          text,
    location      text,
    location_text text,
    time          text,
    status        text NOT NULL DEFAULT 'Reported',
    tagged        text,
    severity      text,
    text          text,
    images        jsonb DEFAULT '[]'
);

-- Accounts: students (REPORTER), staff (RESPONDER) and admins.
CREATE TABLE IF NOT EXISTS users (
    id                  text PRIMARY KEY,
    login_id            text NOT NULL,
    display_name        text NOT NULL,
    password_hash       text NOT NULL,
    role                text NOT NULL CHECK (role IN ('REPORTER', 'RESPONDER', 'ADMIN')),
    department          text,
    gender              text CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    academic_department text,
    academic_level      int,
    verification_status text NOT NULL DEFAULT 'UNVERIFIED'
                        CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'REJECTED')),
    verification_source text,
    external_student_ref text,
    verified_at         timestamptz,
    verified_by         text REFERENCES users (id),
    enabled             boolean NOT NULL DEFAULT true,
    failed_attempts     int NOT NULL DEFAULT 0,
    locked_until        timestamptz,
    token_version       int NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    last_login_at       timestamptz,
    CONSTRAINT users_department_ck CHECK (
        (role = 'RESPONDER' AND department IS NOT NULL)
        OR (role IN ('REPORTER', 'ADMIN') AND department IS NULL)
    ),
    CONSTRAINT users_student_profile_ck CHECK (
        role <> 'REPORTER'
        OR (gender IS NOT NULL AND academic_department IS NOT NULL AND academic_level IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_lower_idx ON users (lower(login_id));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- Refresh tokens: only the SHA-256 hash is stored. Rotation + family tracking
-- allows stolen-token detection.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          text PRIMARY KEY,
    user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  text NOT NULL UNIQUE,
    family_id   text NOT NULL,
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    replaced_by text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_family_idx ON refresh_tokens (family_id);

-- Link incidents to the reporter who filed them (null = legacy/anonymous).
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reporter_id text REFERENCES users (id);
CREATE INDEX IF NOT EXISTS incidents_reporter_idx ON incidents (reporter_id);
