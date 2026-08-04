-- Public CMS content + media metadata (Blob stores bytes)

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  mime_type TEXT NOT NULL DEFAULT '',
  byte_size INTEGER NOT NULL DEFAULT 0,
  original_name TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS media_assets_storage_key_uidx ON media_assets (storage_key);

CREATE TABLE IF NOT EXISTS content_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  profile_level TEXT NOT NULL DEFAULT 'basic',
  name_uk TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  short_name_uk TEXT NOT NULL DEFAULT '',
  short_name_en TEXT NOT NULL DEFAULT '',
  category_uk TEXT NOT NULL DEFAULT '',
  category_en TEXT NOT NULL DEFAULT '',
  short_description_uk TEXT NOT NULL DEFAULT '',
  short_description_en TEXT NOT NULL DEFAULT '',
  full_description_uk TEXT NOT NULL DEFAULT '',
  full_description_en TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  public_email TEXT NOT NULL DEFAULT '',
  public_phone TEXT NOT NULL DEFAULT '',
  participant_types TEXT[] NOT NULL DEFAULT '{}',
  sectors TEXT[] NOT NULL DEFAULT '{}',
  product_categories TEXT[] NOT NULL DEFAULT '{}',
  competencies TEXT[] NOT NULL DEFAULT '{}',
  region TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
  cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_members_slug_uidx ON content_members (slug);
CREATE INDEX IF NOT EXISTS content_members_status_order_idx ON content_members (status, sort_order);

CREATE TABLE IF NOT EXISTS content_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  title_uk TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  excerpt_uk TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  body_uk TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_news_slug_uidx ON content_news (slug);
CREATE INDEX IF NOT EXISTS content_news_status_published_idx ON content_news (status, published_at DESC);

CREATE TABLE IF NOT EXISTS content_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  title_uk TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  short_description_uk TEXT NOT NULL DEFAULT '',
  short_description_en TEXT NOT NULL DEFAULT '',
  full_description_uk TEXT NOT NULL DEFAULT '',
  full_description_en TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'meeting',
  event_format TEXT NOT NULL DEFAULT 'online',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  time_zone TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  location TEXT NOT NULL DEFAULT '',
  online_url TEXT NOT NULL DEFAULT '',
  registration_url TEXT NOT NULL DEFAULT '',
  organizer TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS content_events_slug_uidx ON content_events (slug);
CREATE INDEX IF NOT EXISTS content_events_status_start_idx ON content_events (status, start_at);

CREATE TABLE IF NOT EXISTS content_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  title_uk TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_uk TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT 'pdf',
  language TEXT NOT NULL DEFAULT 'UA',
  access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'member', 'internal')),
  size_label TEXT NOT NULL DEFAULT '',
  date_updated DATE,
  external_url TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_documents_status_updated_idx ON content_documents (status, date_updated DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'siteSettings',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address_uk TEXT NOT NULL DEFAULT '',
  address_en TEXT NOT NULL DEFAULT '',
  brand_tagline_uk TEXT NOT NULL DEFAULT '',
  brand_tagline_en TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
