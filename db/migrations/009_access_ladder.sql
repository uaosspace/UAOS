-- Access ladder (single level) + meeting notifications + ops settings.
-- Replaces member_user_roles multi-role and content_events.access_roles[].

ALTER TABLE member_users
  ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'member';

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS access_min_role TEXT NOT NULL DEFAULT '';

-- Backfill member access_level = max rank from legacy roles (other → partner).
UPDATE member_users mu
SET access_level = COALESCE((
  SELECT CASE
    WHEN bool_or(r.role = 'board') THEN 'board'
    WHEN bool_or(r.role = 'staff') THEN 'staff'
    WHEN bool_or(r.role = 'member') THEN 'member'
    WHEN bool_or(r.role IN ('partner', 'other')) THEN 'partner'
    ELSE 'member'
  END
  FROM member_user_roles r
  WHERE r.member_user_id = mu.id
), mu.access_level);

-- Backfill event threshold = lowest rank among legacy access_roles (empty stays empty).
UPDATE content_events e
SET access_min_role = COALESCE((
  SELECT CASE
    WHEN cardinality(e.access_roles) = 0 THEN ''
    WHEN 'partner' = ANY (e.access_roles) OR 'other' = ANY (e.access_roles) THEN 'partner'
    WHEN 'member' = ANY (e.access_roles) THEN 'member'
    WHEN 'staff' = ANY (e.access_roles) THEN 'staff'
    WHEN 'board' = ANY (e.access_roles) THEN 'board'
    ELSE ''
  END
), '');

ALTER TABLE member_users
  DROP CONSTRAINT IF EXISTS member_users_access_level_check;

ALTER TABLE member_users
  ADD CONSTRAINT member_users_access_level_check
  CHECK (access_level IN ('partner', 'member', 'staff', 'board'));

CREATE TABLE IF NOT EXISTS meeting_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('created', 'reminder')),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, kind, recipient_email)
);

CREATE INDEX IF NOT EXISTS meeting_notifications_meeting_idx
  ON meeting_notifications (meeting_id);

CREATE TABLE IF NOT EXISTS meeting_ops_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  protocol_notify_emails TEXT[] NOT NULL DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO meeting_ops_settings (id, protocol_notify_emails)
VALUES ('default', '{}'::text[])
ON CONFLICT (id) DO NOTHING;

DROP TABLE IF EXISTS member_user_roles;

ALTER TABLE content_events DROP COLUMN IF EXISTS access_roles;
