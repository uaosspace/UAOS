-- Cabinet provisioning from applications + event participation mode (Zoom vs other formats).

ALTER TABLE member_users
  ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES applications(id) ON DELETE SET NULL;

ALTER TABLE member_users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS member_users_application_idx ON member_users (application_id);

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS participation_mode TEXT NOT NULL DEFAULT 'offline';

-- Existing Zoom meetings → participation_mode zoom.
UPDATE content_events e
SET participation_mode = 'zoom'
WHERE participation_mode = 'offline'
  AND EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.event_id = e.id AND m.status <> 'cancelled'
  );

-- Legacy online events with manual URL → online_link.
UPDATE content_events
SET participation_mode = 'online_link'
WHERE participation_mode = 'offline'
  AND online_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.event_id = content_events.id AND m.status <> 'cancelled'
  );
