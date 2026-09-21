BEGIN;

ALTER TABLE shops ADD COLUMN IF NOT EXISTS vat_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2) NOT NULL DEFAULT 15 CHECK (vat_rate BETWEEN 0 AND 100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS desk_status varchar(20) NOT NULL DEFAULT 'available' CHECK (desk_status IN ('available','break','away'));
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_by integer REFERENCES users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancellation_reason varchar(220);

CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id integer NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES services(id),
  name varchar(180) NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (appointment_id, service_id)
);
INSERT INTO appointment_services (appointment_id,service_id,name,price)
SELECT a.id,s.id,s.name,s.price FROM appointments a JOIN services s ON s.id=a.service_id AND s.shop_id=a.shop_id
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS payment_accounts (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id),
  name varchar(100) NOT NULL,
  method varchar(30) NOT NULL CHECK (method IN ('cash','bank_transfer','telebirr')),
  reference varchar(100) NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_by integer REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id,name)
);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS items jsonb;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_account_id integer REFERENCES payment_accounts(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_account_name varchar(100);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_account_reference varchar(100);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS transaction_reference varchar(100);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS cash_received numeric(12,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_day date;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_recorded_at timestamptz;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_account_id integer REFERENCES payment_accounts(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_account_name varchar(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method varchar(30);

CREATE TABLE IF NOT EXISTS daily_opening_cash (
  shop_id integer NOT NULL REFERENCES shops(id),
  business_date date NOT NULL,
  account_id integer NOT NULL REFERENCES payment_accounts(id),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  recorded_by integer REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id,business_date,account_id)
);
CREATE TABLE IF NOT EXISTS daily_closings (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id),
  business_date date NOT NULL,
  snapshot jsonb NOT NULL,
  notes varchar(1000) NOT NULL DEFAULT '',
  closed_by integer REFERENCES users(id),
  closed_at timestamptz NOT NULL DEFAULT NOW(),
  reopened_by integer REFERENCES users(id),
  reopened_at timestamptz,
  reopen_reason varchar(500)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_closing_active ON daily_closings(shop_id,business_date) WHERE reopened_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bills_payment_day ON bills(shop_id,payment_day);
CREATE INDEX IF NOT EXISTS idx_accounts_shop ON payment_accounts(shop_id,active);

COMMIT;
