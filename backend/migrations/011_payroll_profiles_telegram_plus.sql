BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS expense_id integer REFERENCES expenses(id);
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS payment_account_id integer REFERENCES payment_accounts(id);
ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS payment_account_name varchar(100);

-- Trial shops can try the daily digest. After the trial, it is a Plus-only
-- capability. Existing Plus packages receive it automatically.
UPDATE subscription_plans
SET features=COALESCE(features,'{}'::jsonb)||jsonb_build_object('telegramDigest',tier='plus');

ALTER TABLE owner_daily_messages DROP CONSTRAINT IF EXISTS owner_daily_messages_status_check;
ALTER TABLE owner_daily_messages ADD CONSTRAINT owner_daily_messages_status_check
  CHECK(status IN ('queued','sending','sent','failed','uncertain','skipped'));

COMMIT;
