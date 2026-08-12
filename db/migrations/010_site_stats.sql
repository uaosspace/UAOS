-- Homepage showcase stats (marketing strip), editable in site settings.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS stats_show_on_site BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS stats_members_value TEXT NOT NULL DEFAULT '';

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS stats_producers_value TEXT NOT NULL DEFAULT '';

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS stats_projects_value TEXT NOT NULL DEFAULT '';

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS stats_years_value TEXT NOT NULL DEFAULT '';

-- Seed demo-like defaults only where still empty (soft launch keeps show_on_site = false).
UPDATE site_settings
SET
  stats_members_value = CASE WHEN stats_members_value = '' THEN '125' ELSE stats_members_value END,
  stats_producers_value = CASE WHEN stats_producers_value = '' THEN '68' ELSE stats_producers_value END,
  stats_projects_value = CASE WHEN stats_projects_value = '' THEN '320+' ELSE stats_projects_value END,
  stats_years_value = CASE WHEN stats_years_value = '' THEN '12' ELSE stats_years_value END
WHERE id = 'siteSettings';
