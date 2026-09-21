BEGIN;

CREATE TABLE IF NOT EXISTS barber_compensation (
  barber_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shop_id integer NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  mode varchar(20) NOT NULL DEFAULT 'salary' CHECK (mode IN ('commission','salary','hybrid')),
  commission_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate BETWEEN 0 AND 100),
  salary_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (salary_amount >= 0),
  show_salary_to_barber boolean NOT NULL DEFAULT false,
  period_type varchar(20) NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('weekly','biweekly','monthly','custom')),
  period_anchor date NOT NULL DEFAULT CURRENT_DATE,
  custom_start date,
  custom_end date,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  updated_by integer REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT barber_compensation_custom_range CHECK (
    (period_type = 'custom' AND custom_start IS NOT NULL AND custom_end IS NOT NULL AND custom_end >= custom_start)
    OR (period_type <> 'custom')
  )
);

INSERT INTO barber_compensation (barber_id,shop_id,mode,commission_rate,salary_amount,period_type)
SELECT id,shop_id,'salary',0,0,'monthly' FROM users
WHERE role='barber' AND shop_id IS NOT NULL
ON CONFLICT (barber_id) DO NOTHING;

ALTER TABLE bills ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS commission_base numeric(12,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS commission_amount numeric(12,2);

CREATE INDEX IF NOT EXISTS idx_compensation_shop ON barber_compensation(shop_id);
CREATE INDEX IF NOT EXISTS idx_bills_barber_paid ON bills(shop_id,barber_id,paid,payment_day);

COMMIT;
