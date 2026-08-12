-- Meetings domain (provider-neutral) + member multi-roles + webhook inbox.
-- provider is TEXT; allowed values enforced in MeetingProviderRegistry (not DB enum).

CREATE TABLE IF NOT EXISTS member_user_roles (
  member_user_id UUID NOT NULL REFERENCES member_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_user_id, role)
);

CREATE INDEX IF NOT EXISTS member_user_roles_role_idx ON member_user_roles (role);

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'restricted'));

ALTER TABLE content_events
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES content_events(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL DEFAULT '',
  external_uuid TEXT NOT NULL DEFAULT '',
  join_url TEXT NOT NULL DEFAULT '',
  start_url_encrypted TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'ready', 'live', 'ended', 'sync_error', 'cancelled', 'awaiting_artifacts'
    )),
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  last_sync_error TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_event_id_idx ON meetings (event_id);
CREATE INDEX IF NOT EXISTS meetings_provider_external_id_idx ON meetings (provider, external_id);
CREATE INDEX IF NOT EXISTS meetings_external_uuid_idx ON meetings (external_uuid);

CREATE TABLE IF NOT EXISTS meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL DEFAULT '',
  file_type TEXT NOT NULL DEFAULT '',
  recording_type TEXT NOT NULL DEFAULT '',
  external_download_url TEXT NOT NULL DEFAULT '',
  blob_pathname TEXT NOT NULL DEFAULT '',
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'available',
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_recordings_meeting_id_idx ON meeting_recordings (meeting_id);

CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'vtt',
  content_text TEXT NOT NULL DEFAULT '',
  external_download_url TEXT NOT NULL DEFAULT '',
  blob_pathname TEXT NOT NULL DEFAULT '',
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_transcripts_meeting_id_idx ON meeting_transcripts (meeting_id);

CREATE TABLE IF NOT EXISTS meeting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_provider_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  edited_summary TEXT,
  edited_topics JSONB,
  edited_decisions JSONB,
  edited_action_items JSONB,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_reports_meeting_id_uidx ON meeting_reports (meeting_id);
CREATE INDEX IF NOT EXISTS meeting_reports_status_idx ON meeting_reports (status);

CREATE TABLE IF NOT EXISTS meeting_provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_event_type TEXT NOT NULL DEFAULT '',
  external_meeting_id TEXT NOT NULL DEFAULT '',
  external_occurrence_id TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'ignored')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_provider_events_idempotency_uidx
  ON meeting_provider_events (idempotency_key);
CREATE INDEX IF NOT EXISTS meeting_provider_events_status_received_idx
  ON meeting_provider_events (status, received_at);
