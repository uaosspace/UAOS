-- Member portal accounts (separate from admin_users) and sessions.
-- Accounts are provisioned by ops/admin; optional link to content_members.

CREATE TABLE IF NOT EXISTS member_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  member_id UUID REFERENCES content_members(id) ON DELETE SET NULL,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS member_users_email_uidx ON member_users (lower(email));
CREATE INDEX IF NOT EXISTS member_users_member_idx ON member_users (member_id);

CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS member_sessions_token_hash_uidx ON member_sessions (token_hash);
CREATE INDEX IF NOT EXISTS member_sessions_user_idx ON member_sessions (user_id);
CREATE INDEX IF NOT EXISTS member_sessions_expires_idx ON member_sessions (expires_at);
