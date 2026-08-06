-- Localized content fields move from *_uk/*_en column pairs to one JSONB object per field
-- ({"uk": "...", "en": "...", "de": "..."}), following the existing services/certificates JSONB
-- precedent in content_members. Additive and reversible: legacy columns stay in place and the
-- repository keeps writing them, so rolling the code back keeps working.
-- Applied by scripts/migrate.mjs, which splits on ";\n" — keep one statement per terminator.

ALTER TABLE content_members ADD COLUMN IF NOT EXISTS name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_members ADD COLUMN IF NOT EXISTS short_name_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_members ADD COLUMN IF NOT EXISTS category_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_members ADD COLUMN IF NOT EXISTS short_description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_members ADD COLUMN IF NOT EXISTS full_description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_members ADD COLUMN IF NOT EXISTS competencies_i18n JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE content_news ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_news ADD COLUMN IF NOT EXISTS excerpt_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_news ADD COLUMN IF NOT EXISTS body_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE content_events ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_events ADD COLUMN IF NOT EXISTS short_description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_events ADD COLUMN IF NOT EXISTS full_description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_events ADD COLUMN IF NOT EXISTS location_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_events ADD COLUMN IF NOT EXISTS organizer_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE content_documents ADD COLUMN IF NOT EXISTS title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE content_documents ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS brand_tagline_i18n JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: empty legacy text becomes an absent key, so a locale is either filled or missing.

UPDATE content_members SET
  name_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(name_uk, ''), 'en', NULLIF(name_en, ''))),
  short_name_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(short_name_uk, ''), 'en', NULLIF(short_name_en, ''))),
  category_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(category_uk, ''), 'en', NULLIF(category_en, ''))),
  short_description_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(short_description_uk, ''), 'en', NULLIF(short_description_en, ''))),
  full_description_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(full_description_uk, ''), 'en', NULLIF(full_description_en, '')))
WHERE name_i18n = '{}'::jsonb
  AND short_name_i18n = '{}'::jsonb
  AND category_i18n = '{}'::jsonb
  AND short_description_i18n = '{}'::jsonb
  AND full_description_i18n = '{}'::jsonb;

-- competencies stays a uk-only TEXT[]; mirror it as [{uk,en}] so non-uk locales become editable.
UPDATE content_members SET
  competencies_i18n = COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object('uk', item, 'en', item))
      FROM unnest(competencies) AS item
      WHERE item <> ''
    ),
    '[]'::jsonb
  )
WHERE competencies_i18n = '[]'::jsonb;

UPDATE content_news SET
  title_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(title_uk, ''), 'en', NULLIF(title_en, ''))),
  excerpt_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(excerpt_uk, ''), 'en', NULLIF(excerpt_en, ''))),
  body_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(body_uk, ''), 'en', NULLIF(body_en, '')))
WHERE title_i18n = '{}'::jsonb
  AND excerpt_i18n = '{}'::jsonb
  AND body_i18n = '{}'::jsonb;

-- location/organizer were single TEXT columns while the client already read them as LocalizedText;
-- both locales get the original value so uk and en keep rendering exactly what they render today.
UPDATE content_events SET
  title_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(title_uk, ''), 'en', NULLIF(title_en, ''))),
  short_description_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(short_description_uk, ''), 'en', NULLIF(short_description_en, ''))),
  full_description_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(full_description_uk, ''), 'en', NULLIF(full_description_en, ''))),
  location_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(location, ''), 'en', NULLIF(location, ''))),
  organizer_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(organizer, ''), 'en', NULLIF(organizer, '')))
WHERE title_i18n = '{}'::jsonb
  AND short_description_i18n = '{}'::jsonb
  AND full_description_i18n = '{}'::jsonb
  AND location_i18n = '{}'::jsonb
  AND organizer_i18n = '{}'::jsonb;

UPDATE content_documents SET
  title_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(title_uk, ''), 'en', NULLIF(title_en, ''))),
  description_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(description_uk, ''), 'en', NULLIF(description_en, '')))
WHERE title_i18n = '{}'::jsonb
  AND description_i18n = '{}'::jsonb;

UPDATE site_settings SET
  address_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(address_uk, ''), 'en', NULLIF(address_en, ''))),
  brand_tagline_i18n = jsonb_strip_nulls(jsonb_build_object('uk', NULLIF(brand_tagline_uk, ''), 'en', NULLIF(brand_tagline_en, '')))
WHERE address_i18n = '{}'::jsonb
  AND brand_tagline_i18n = '{}'::jsonb;
