BEGIN;
CREATE TABLE IF NOT EXISTS shop_telegram (
  shop_id integer PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  token_cipher text NOT NULL,
  chat_id varchar(80) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS owner_daily_messages (
  id serial PRIMARY KEY,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  closing_id integer NOT NULL REFERENCES daily_closings(id),
  body text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sending','sent','failed','uncertain')),
  attempts integer NOT NULL DEFAULT 0,
  revision integer NOT NULL DEFAULT 1,
  telegram_message_id bigint,
  delivered_chat_id varchar(80),
  delivered_bot_id varchar(40),
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  sent_at timestamptz,
  UNIQUE(shop_id,business_date)
);
CREATE INDEX IF NOT EXISTS idx_owner_message_queue ON owner_daily_messages(status,next_attempt_at);
COMMIT;
