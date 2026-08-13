-- Explicit meeting invite / protocol recipients per event (cabinet users).
-- Existing events stay empty until an admin saves selections.

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS notify_picker_mode TEXT NOT NULL DEFAULT 'by_role';

ALTER TABLE content_events
  DROP CONSTRAINT IF EXISTS content_events_notify_picker_mode_check;

ALTER TABLE content_events
  ADD CONSTRAINT content_events_notify_picker_mode_check
  CHECK (notify_picker_mode IN ('by_role', 'by_members'));

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS notify_filter_role TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS event_notify_recipients (
  event_id UUID NOT NULL REFERENCES content_events(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  notify_meeting BOOLEAN NOT NULL DEFAULT false,
  notify_protocol BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (event_id, member_user_id),
  CONSTRAINT event_notify_recipients_flag_check
    CHECK (notify_meeting OR notify_protocol)
);

CREATE INDEX IF NOT EXISTS event_notify_recipients_user_idx
  ON event_notify_recipients (member_user_id);
