-- External/link news: open source URL instead of on-site article body.
ALTER TABLE content_news
  ADD COLUMN IF NOT EXISTS external_url TEXT NOT NULL DEFAULT '';
