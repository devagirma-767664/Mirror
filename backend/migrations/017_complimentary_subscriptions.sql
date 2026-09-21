BEGIN;

-- Tracks whether active access came from a customer payment or an intentional
-- complimentary grant, so platform reporting does not count gifts as revenue.
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS subscription_source varchar(20) NOT NULL DEFAULT 'paid';

ALTER TABLE shops
  DROP CONSTRAINT IF EXISTS shops_subscription_source_check;
ALTER TABLE shops
  ADD CONSTRAINT shops_subscription_source_check
  CHECK (subscription_source IN ('trial','paid','free_grant'));

UPDATE shops
SET subscription_source=CASE WHEN subscription_status='trial' THEN 'trial' ELSE 'paid' END
WHERE subscription_source='paid' AND subscription_status='trial';

CREATE TABLE IF NOT EXISTS subscription_grants (
  id bigserial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  granted_by integer NOT NULL REFERENCES users(id),
  plan_code varchar(40) NOT NULL REFERENCES subscription_plans(code),
  plan_name varchar(100) NOT NULL,
  duration_months integer NOT NULL CHECK (duration_months IN (1,3,6,12)),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  note varchar(500) NOT NULL DEFAULT '',
  granted_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_grants_shop_granted
  ON subscription_grants(shop_id,granted_at DESC);

COMMIT;
