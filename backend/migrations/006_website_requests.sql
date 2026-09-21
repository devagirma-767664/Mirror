BEGIN;
CREATE TABLE IF NOT EXISTS website_requests (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL UNIQUE REFERENCES shops(id),
  requested_by integer NOT NULL REFERENCES users(id),
  phone varchar(40) NOT NULL,
  address varchar(240) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','contacted','ready')),
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  reviewed_by integer REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_website_request_status ON website_requests(status,requested_at);
-- A free trial never publishes a shop website or accepts online bookings.
UPDATE shops SET website_enabled=false WHERE subscription_status='trial';
COMMIT;
