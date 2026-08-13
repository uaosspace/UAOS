-- Toggle public social network links (contacts page + footer). Hidden until real URLs exist.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS socials_show_on_site BOOLEAN NOT NULL DEFAULT false;
