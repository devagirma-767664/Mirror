BEGIN;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS tier varchar(10) NOT NULL DEFAULT 'basic' CHECK(tier IN ('basic','plus'));
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_trial_default boolean NOT NULL DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();
UPDATE subscription_plans SET tier='plus' WHERE code='barberbook_plus';
UPDATE subscription_plans SET is_trial_default=true WHERE code='barberbook_plus' AND NOT EXISTS(SELECT 1 FROM subscription_plans WHERE is_trial_default);
CREATE UNIQUE INDEX IF NOT EXISTS one_trial_package ON subscription_plans(is_trial_default) WHERE is_trial_default;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
CREATE TABLE IF NOT EXISTS platform_telegram (
  id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), enabled boolean NOT NULL DEFAULT false,
  token_cipher text NOT NULL, chat_id varchar(80) NOT NULL, workspace_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS platform_events (
  id bigserial PRIMARY KEY, event_key text NOT NULL UNIQUE, kind varchar(40) NOT NULL,
  shop_id integer REFERENCES shops(id) ON DELETE SET NULL,
  title varchar(160) NOT NULL, body text NOT NULL, path text NOT NULL,
  status varchar(20) NOT NULL CHECK(status IN ('queued','sending','sent','failed','uncertain','skipped')),
  attempts integer NOT NULL DEFAULT 0, last_error text, telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW(),
  next_attempt_at timestamptz NOT NULL DEFAULT NOW(), sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS platform_event_queue ON platform_events(status,next_attempt_at);
COMMIT;
