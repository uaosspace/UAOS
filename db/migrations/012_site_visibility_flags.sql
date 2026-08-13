-- Toggle public visibility of About goals cards and Knowledge library section.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS about_goals_show_on_site BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS knowledge_show_on_site BOOLEAN NOT NULL DEFAULT false;
