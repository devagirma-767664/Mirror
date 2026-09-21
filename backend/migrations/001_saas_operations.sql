BEGIN;

CREATE TABLE IF NOT EXISTS subscription_plans (
  code varchar(40) PRIMARY KEY,
  name varchar(80) NOT NULL,
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (code, name, monthly_price, description, features, limits)
VALUES
  ('barberbook', 'Mirror Basic', 799, 'Simple daily operations for a single salon or shop.',
   '{"walkInWorkflow":true,"payments":true,"basicInventory":true,"expenseTracking":true,"barberPerformance":true,"publicWebsite":false,"onlineBooking":false,"customerHistory":false,"smsReminders":false,"advancedReports":false,"inventoryAlerts":false,"commissionInsights":false,"dataExport":false,"customBranding":false,"prioritySupport":false}'::jsonb,
   '{"staff":8}'::jsonb),
  ('barberbook_plus', 'Mirror Plus', 1499, 'Growth tools, customer channels, and deeper business control.',
   '{"walkInWorkflow":true,"payments":true,"basicInventory":true,"expenseTracking":true,"barberPerformance":true,"publicWebsite":true,"onlineBooking":true,"customerHistory":true,"smsReminders":true,"advancedReports":true,"inventoryAlerts":true,"commissionInsights":true,"dataExport":true,"customBranding":true,"prioritySupport":true}'::jsonb,
   '{"staff":50}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  active = true;

CREATE TABLE IF NOT EXISTS shops (
  id serial PRIMARY KEY,
  name varchar(140) NOT NULL,
  slug varchar(140) NOT NULL UNIQUE,
  plan_code varchar(40) NOT NULL DEFAULT 'barberbook' REFERENCES subscription_plans(code),
  subscription_status varchar(30) NOT NULL DEFAULT 'trial',
  currency varchar(10) NOT NULL DEFAULT 'ETB',
  timezone varchar(80) NOT NULL DEFAULT 'Africa/Addis_Ababa',
  current_period_end date,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT shops_subscription_status_check CHECK (subscription_status IN ('trial','active','past_due','suspended','cancelled'))
);

INSERT INTO shops (name, slug, plan_code, subscription_status)
SELECT 'Mirror Demo Shop', 'mirror-demo', 'barberbook_plus', 'active'
WHERE NOT EXISTS (SELECT 1 FROM shops);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','barber','receptionist','platform_admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_id integer;
ALTER TABLE services ADD COLUMN IF NOT EXISTS shop_id integer;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shop_id integer;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_started_at timestamp without time zone;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS shop_id integer;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS barber_id integer;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS service_id integer;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS subtotal numeric(10,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax numeric(10,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method varchar(30);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS received_by integer;
ALTER TABLE day_off_requests ADD COLUMN IF NOT EXISTS shop_id integer;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS shop_id integer;

UPDATE users SET shop_id = (SELECT id FROM shops ORDER BY id LIMIT 1) WHERE shop_id IS NULL AND role <> 'platform_admin';
UPDATE services SET shop_id = (SELECT id FROM shops ORDER BY id LIMIT 1) WHERE shop_id IS NULL;
UPDATE appointments a SET shop_id = COALESCE((SELECT u.shop_id FROM users u WHERE u.id = a.barber_id), (SELECT id FROM shops ORDER BY id LIMIT 1)) WHERE a.shop_id IS NULL;
UPDATE bills b SET shop_id = a.shop_id, barber_id = a.barber_id, service_id = a.service_id FROM appointments a WHERE a.id = b.appointment_id AND (b.shop_id IS NULL OR b.barber_id IS NULL OR b.service_id IS NULL);
UPDATE bills SET subtotal = ROUND((total / 1.15)::numeric, 2) WHERE subtotal IS NULL;
UPDATE bills SET tax = total - subtotal WHERE tax IS NULL;
UPDATE day_off_requests d SET shop_id = u.shop_id FROM users u WHERE u.id = d.barber_id AND d.shop_id IS NULL;
UPDATE ratings r SET shop_id = u.shop_id FROM users u WHERE u.id = r.barber_id AND r.shop_id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_shop_id_fkey') THEN ALTER TABLE users ADD CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_shop_id_fkey') THEN ALTER TABLE services ADD CONSTRAINT services_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_shop_id_fkey') THEN ALTER TABLE appointments ADD CONSTRAINT appointments_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_shop_id_fkey') THEN ALTER TABLE bills ADD CONSTRAINT bills_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_barber_id_fkey') THEN ALTER TABLE bills ADD CONSTRAINT bills_barber_id_fkey FOREIGN KEY (barber_id) REFERENCES users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_service_id_fkey') THEN ALTER TABLE bills ADD CONSTRAINT bills_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_received_by_fkey') THEN ALTER TABLE bills ADD CONSTRAINT bills_received_by_fkey FOREIGN KEY (received_by) REFERENCES users(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'day_off_requests_shop_id_fkey') THEN ALTER TABLE day_off_requests ADD CONSTRAINT day_off_requests_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_shop_id_fkey') THEN ALTER TABLE ratings ADD CONSTRAINT ratings_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id); END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_items (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name varchar(140) NOT NULL,
  sku varchar(80),
  category varchar(80) NOT NULL DEFAULT 'Supplies',
  quantity numeric(12,2) NOT NULL DEFAULT 0,
  reorder_level numeric(12,2) NOT NULL DEFAULT 0,
  unit varchar(30) NOT NULL DEFAULT 'items',
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  supplier varchar(140),
  active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (shop_id, name)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  inventory_item_id integer NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_change numeric(12,2) NOT NULL,
  reason varchar(180),
  recorded_by integer REFERENCES users(id),
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  category varchar(80) NOT NULL,
  description varchar(220) NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by integer REFERENCES users(id),
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_shop_role ON users(shop_id, role);
CREATE INDEX IF NOT EXISTS idx_services_shop ON services(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_shop_status ON appointments(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_shop_paid ON bills(shop_id, paid);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory_items(shop_id, active);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON expenses(shop_id, expense_date DESC);

COMMIT;
