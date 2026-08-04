-- Join applications, consents, distributed rate limits, audit trail
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  company_name TEXT NOT NULL,
  website TEXT NOT NULL DEFAULT '',
  activity_field TEXT NOT NULL,
  edrpou TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  applicant_kind TEXT NOT NULL DEFAULT '',
  sectors TEXT[] NOT NULL DEFAULT '{}',
  product_categories TEXT[] NOT NULL DEFAULT '{}',
  competencies TEXT[] NOT NULL DEFAULT '{}',
  consent_ip TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL,
  dedupe_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS applications_dedupe_key_uidx ON applications (dedupe_key);
CREATE INDEX IF NOT EXISTS applications_status_submitted_idx ON applications (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS applications_applicant_kind_idx ON applications (applicant_kind);
CREATE INDEX IF NOT EXISTS applications_sectors_gin_idx ON applications USING GIN (sectors);

CREATE TABLE IF NOT EXISTS consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  purpose_code TEXT NOT NULL,
  legal_basis TEXT NOT NULL DEFAULT 'consent',
  policy_version TEXT NOT NULL,
  notice_language TEXT NOT NULL DEFAULT 'uk',
  accepted_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'join_form',
  ip TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consents_application_idx ON consents (application_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_action_idx ON audit_events (action);
