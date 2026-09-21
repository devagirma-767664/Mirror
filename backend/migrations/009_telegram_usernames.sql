BEGIN;
ALTER TABLE shop_telegram ADD COLUMN IF NOT EXISTS telegram_username varchar(40);
ALTER TABLE platform_telegram ADD COLUMN IF NOT EXISTS telegram_username varchar(40);
COMMIT;
