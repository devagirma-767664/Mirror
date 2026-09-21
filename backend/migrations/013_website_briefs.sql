BEGIN;

CREATE TABLE IF NOT EXISTS website_briefs (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
  requested_by integer REFERENCES users(id),
  status varchar(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','submitted','in_review','ready')),
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  style varchar(40),
  theme varchar(40),
  palette varchar(40),
  custom_colors varchar(120) NOT NULL DEFAULT '',
  primary_goal varchar(40),
  hero_title varchar(120) NOT NULL DEFAULT '',
  introduction varchar(700) NOT NULL DEFAULT '',
  instagram varchar(120) NOT NULL DEFAULT '',
  tiktok varchar(120) NOT NULL DEFAULT '',
  notes varchar(1800) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS website_briefs_status ON website_briefs(status,requested_at DESC);

CREATE TABLE IF NOT EXISTS website_brief_assets (
  id bigserial PRIMARY KEY,
  brief_id integer NOT NULL REFERENCES website_briefs(id) ON DELETE CASCADE,
  kind varchar(20) NOT NULL CHECK (kind IN ('logo','shop_photo')),
  file_path varchar(300) NOT NULL,
  original_name varchar(255) NOT NULL,
  mime_type varchar(100) NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0 AND file_size <= 5242880),
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS website_brief_assets_brief ON website_brief_assets(brief_id,kind,created_at);

COMMIT;
