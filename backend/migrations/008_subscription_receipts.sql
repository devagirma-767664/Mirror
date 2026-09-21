BEGIN;

-- Subscription transfers are verified from the receipt screenshot. Keep the
-- legacy reference column for old records, but do not require it for new ones.
ALTER TABLE subscription_requests
  ALTER COLUMN transaction_reference DROP NOT NULL;
ALTER TABLE subscription_requests
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_original_name varchar(255),
  ADD COLUMN IF NOT EXISTS receipt_mime_type varchar(100),
  ADD COLUMN IF NOT EXISTS receipt_size integer;

COMMIT;
