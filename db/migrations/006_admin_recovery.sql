-- One-time email MFA codes for admin password recovery (hashed, short TTL).

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS recovery_mfa_hash TEXT,
  ADD COLUMN IF NOT EXISTS recovery_mfa_expires_at TIMESTAMPTZ;
