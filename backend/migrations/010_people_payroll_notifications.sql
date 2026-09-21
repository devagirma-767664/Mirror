BEGIN;

-- A team record can exist without signing into a workspace. Workspace users use
-- phone + password, while shop and platform owners keep their email sign-in.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_workspace boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_type varchar(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_salary numeric(12,2) NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0);
UPDATE users SET has_workspace=true WHERE role IN ('admin','barber','receptionist','platform_admin');
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','barber','receptionist','support','platform_admin'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_staff_type_check;
ALTER TABLE users ADD CONSTRAINT users_staff_type_check CHECK (staff_type IS NULL OR staff_type IN ('cleaner','washer','other'));
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone) WHERE phone IS NOT NULL;

ALTER TABLE barber_compensation ADD COLUMN IF NOT EXISTS pay_day integer NOT NULL DEFAULT 30 CHECK (pay_day BETWEEN 1 AND 30);

-- This makes the next calendar day an explicit operating day. The server starts
-- it automatically; reception never has to reopen yesterday's closing.
CREATE TABLE IF NOT EXISTS business_days (
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  started_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id,business_date)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  ethiopian_year integer NOT NULL CHECK (ethiopian_year BETWEEN 2000 AND 2200),
  ethiopian_month integer NOT NULL CHECK (ethiopian_month BETWEEN 1 AND 13),
  period_start date NOT NULL,
  period_end date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  created_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  finalized_at timestamptz,
  finalized_by integer REFERENCES users(id),
  UNIQUE(shop_id,ethiopian_year,ethiopian_month)
);
CREATE TABLE IF NOT EXISTS payroll_items (
  id serial PRIMARY KEY,
  payroll_run_id integer NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id),
  employee_name varchar(100) NOT NULL,
  role varchar(30) NOT NULL,
  staff_type varchar(30),
  base_salary numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  adjustment numeric(12,2) NOT NULL DEFAULT 0,
  gross_amount numeric(12,2) NOT NULL DEFAULT 0,
  ethiopian_pay_day integer NOT NULL DEFAULT 30 CHECK (ethiopian_pay_day BETWEEN 1 AND 30),
  pay_due_date date NOT NULL,
  note varchar(500) NOT NULL DEFAULT '',
  paid_at timestamptz,
  UNIQUE(payroll_run_id,user_id)
);
CREATE INDEX IF NOT EXISTS payroll_runs_shop_period ON payroll_runs(shop_id,ethiopian_year DESC, ethiopian_month DESC);

CREATE TABLE IF NOT EXISTS shop_notifications (
  id bigserial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  kind varchar(40) NOT NULL DEFAULT 'platform_message',
  title varchar(160) NOT NULL,
  body varchar(1000) NOT NULL,
  path varchar(240) NOT NULL DEFAULT '/admin',
  created_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS shop_notifications_feed ON shop_notifications(shop_id,read_at,created_at DESC);

COMMIT;
