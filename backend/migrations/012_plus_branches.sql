BEGIN;

-- A branch reuses the existing shop-scoped operational tables. The primary
-- shop is the subscription owner; its children are independently operated
-- locations with their own staff, cash, stock, daily closings and reports.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS parent_shop_id integer REFERENCES shops(id) ON DELETE CASCADE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS branch_active boolean NOT NULL DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS branch_created_by integer REFERENCES users(id);
CREATE INDEX IF NOT EXISTS shops_parent_branch ON shops(parent_shop_id,branch_active,id);

UPDATE subscription_plans
SET features=COALESCE(features,'{}'::jsonb)||jsonb_build_object('multiLocation',tier='plus'),
    limits=COALESCE(limits,'{}'::jsonb)||jsonb_build_object('locations',CASE WHEN tier='plus' THEN 3 ELSE 1 END);

COMMIT;
