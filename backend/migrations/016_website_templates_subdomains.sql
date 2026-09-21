BEGIN;

ALTER TABLE website_briefs
  ADD COLUMN IF NOT EXISTS template_code varchar(40) NOT NULL DEFAULT 'studio';

UPDATE website_briefs
SET template_code=CASE style
  WHEN 'warm' THEN 'ritual'
  WHEN 'luxury' THEN 'editorial'
  WHEN 'bold' THEN 'editorial'
  ELSE 'studio'
END
WHERE template_code='studio' AND style IS NOT NULL;

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS website_subdomain varchar(63);

CREATE UNIQUE INDEX IF NOT EXISTS shops_website_subdomain_unique
  ON shops (LOWER(website_subdomain))
  WHERE website_subdomain IS NOT NULL;
COMMIT;
