BEGIN;

CREATE TABLE IF NOT EXISTS platform_event_reads (
  event_id bigint NOT NULL REFERENCES platform_events(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY(event_id,user_id)
);

CREATE INDEX IF NOT EXISTS platform_event_reads_user ON platform_event_reads(user_id,read_at DESC);
COMMIT;
