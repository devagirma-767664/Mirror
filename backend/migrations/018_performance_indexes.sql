-- These indexes match the tenant-scoped board, reporting, payment and history
-- queries. CONCURRENTLY keeps a growing production shop usable while indexes
-- are added. This migration intentionally contains no transaction block.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_shop_active_schedule
  ON appointments(shop_id,status,start_time)
  WHERE status IN ('Booked','Arrived','InProgress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_shop_barber_active_schedule
  ON appointments(shop_id,barber_id,status,start_time)
  WHERE status IN ('Booked','Arrived','InProgress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_shop_operation_day
  ON appointments(shop_id,((COALESCE(end_time,start_time))::date));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_shop_appointment_history
  ON bills(shop_id,appointment_id,generated_at DESC,id DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_paid_reference_lookup
  ON bills(shop_id,payment_account_id,transaction_reference)
  WHERE paid=true AND transaction_reference IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_closings_shop_closed
  ON daily_closings(shop_id,closed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_shop_barber_created
  ON ratings(shop_id,barber_id,created_at DESC);
