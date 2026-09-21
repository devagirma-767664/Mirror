BEGIN;

ALTER TABLE shop_notifications
  ADD COLUMN IF NOT EXISTS audience varchar(20) NOT NULL DEFAULT 'admin';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shop_notifications_audience_check'
  ) THEN
    ALTER TABLE shop_notifications
      ADD CONSTRAINT shop_notifications_audience_check
      CHECK (audience IN ('admin','staff','all'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS shop_notification_reads (
  notification_id bigint NOT NULL REFERENCES shop_notifications(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY(notification_id,user_id)
);

-- Preserve the owner read state recorded before notifications became personal.
INSERT INTO shop_notification_reads(notification_id,user_id,read_at)
SELECT n.id,u.id,n.read_at
FROM shop_notifications n
JOIN users u ON u.shop_id=n.shop_id AND u.role='admin'
WHERE n.read_at IS NOT NULL
ON CONFLICT(notification_id,user_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS shop_notification_reads_user ON shop_notification_reads(user_id,read_at DESC);
COMMIT;
