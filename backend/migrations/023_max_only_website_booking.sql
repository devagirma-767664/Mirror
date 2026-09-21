BEGIN;

-- Website and online booking are Mirror Max services. Keep any stored website
-- assets, but take public pages offline for Basic and Plus shops.
UPDATE subscription_plans
SET features=COALESCE(features,'{}'::jsonb)||'{"publicWebsite":false,"onlineBooking":false}'::jsonb,
    updated_at=NOW()
WHERE tier IN ('basic','plus');

UPDATE shops AS s
SET website_enabled=false
FROM subscription_plans AS p
WHERE p.code=s.plan_code
  AND p.tier IN ('basic','plus')
  AND s.website_enabled=true;

COMMIT;
