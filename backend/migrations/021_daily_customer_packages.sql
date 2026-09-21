BEGIN;

ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_tier_check;
ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_tier_check CHECK(tier IN ('basic','plus','max'));

UPDATE subscription_plans
SET name='Mirror Basic',
    description='For small shops with up to 20 customers each day.',
    features=COALESCE(features,'{}'::jsonb)||'{"telegramDigest":false}'::jsonb,
    limits='{ "staff": 5, "dailyCustomers": 20 }'::jsonb,
    highlights='[]'::jsonb,
    updated_at=NOW()
WHERE code='barberbook';

UPDATE subscription_plans
SET name='Mirror Plus',
    description='For growing shops with up to 50 customers each day.',
    features=COALESCE(features,'{}'::jsonb)||'{"telegramDigest":true}'::jsonb,
    limits='{ "staff": 15, "dailyCustomers": 50 }'::jsonb,
    highlights='[]'::jsonb,
    updated_at=NOW()
WHERE code='barberbook_plus';

INSERT INTO subscription_plans(code,name,monthly_price,description,tier,features,limits,highlights,active,is_trial_default)
VALUES('mirror_max','Mirror Max',8000,'For busy shops with no daily customer limit.','max',
  '{"publicWebsite":true,"onlineBooking":true,"inventoryAlerts":true,"telegramDigest":true}'::jsonb,
  '{ "staff": 30, "dailyCustomers": 0 }'::jsonb,'[]'::jsonb,true,false)
ON CONFLICT(code) DO UPDATE SET
  name=EXCLUDED.name,description=EXCLUDED.description,tier=EXCLUDED.tier,
  features=EXCLUDED.features,limits=EXCLUDED.limits,highlights=EXCLUDED.highlights,active=true,updated_at=NOW();

COMMIT;
