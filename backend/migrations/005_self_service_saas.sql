BEGIN;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_revision integer NOT NULL DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS website_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS address varchar(240) NOT NULL DEFAULT '';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone varchar(40) NOT NULL DEFAULT '';
-- Existing shops keep their setup and public-page choice. New shops opt in during setup.
UPDATE shops SET onboarding_completed_at=NOW(),website_enabled=(plan_code='barberbook_plus') WHERE onboarding_completed_at IS NULL;
UPDATE shops SET trial_started_at=created_at AT TIME ZONE timezone,
  trial_ends_at=(created_at AT TIME ZONE timezone)+INTERVAL '7 days'
  WHERE subscription_status='trial' AND trial_ends_at IS NULL;
UPDATE subscription_plans SET name='Mirror Basic' WHERE code='barberbook';

CREATE TABLE IF NOT EXISTS platform_payment_accounts (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  method varchar(30) NOT NULL CHECK(method IN ('bank_transfer','telebirr')),
  reference varchar(100) NOT NULL,
  account_holder varchar(140) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(method,reference)
);
CREATE TABLE IF NOT EXISTS subscription_requests (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id),
  requested_by integer NOT NULL REFERENCES users(id),
  request_key uuid NOT NULL,
  action varchar(20) NOT NULL CHECK(action IN ('renew','change')),
  plan_code varchar(40) NOT NULL REFERENCES subscription_plans(code),
  plan_name varchar(80) NOT NULL,
  amount numeric(10,2) NOT NULL CHECK(amount>0),
  currency varchar(10) NOT NULL DEFAULT 'ETB',
  payment_account_id integer NOT NULL REFERENCES platform_payment_accounts(id),
  payment_account_name varchar(100) NOT NULL,
  payment_method varchar(30) NOT NULL,
  payment_destination varchar(100) NOT NULL,
  transaction_reference varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
  subscription_revision integer NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  reviewed_at timestamptz,
  reviewed_by integer REFERENCES users(id),
  review_note varchar(500),
  period_end date,
  UNIQUE(shop_id,request_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_one_pending ON subscription_requests(shop_id) WHERE status='pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payment_reference ON subscription_requests(payment_account_id,LOWER(transaction_reference)) WHERE status IN ('pending','approved');
CREATE INDEX IF NOT EXISTS idx_subscription_request_history ON subscription_requests(shop_id,requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_owner_email_lower ON users(LOWER(email));
COMMIT;
