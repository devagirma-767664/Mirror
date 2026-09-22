BEGIN;

CREATE TABLE IF NOT EXISTS subscription_expiry_alerts (
  id bigserial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  alert_key varchar(180) NOT NULL UNIQUE,
  title varchar(160) NOT NULL,
  body varchar(1000) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','uncertain','skipped')),
  attempts integer NOT NULL DEFAULT 0,
  last_error varchar(500),
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  next_attempt_at timestamptz NOT NULL DEFAULT NOW(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS subscription_expiry_alert_delivery
  ON subscription_expiry_alerts(status,next_attempt_at);

COMMIT;
