BEGIN;

-- Branch rows, if any existed before this migration, remain intact as their
-- own shop records. No operational history is deleted.
UPDATE shops
SET parent_shop_id=NULL,
    branch_active=true,
    branch_created_by=NULL
WHERE parent_shop_id IS NOT NULL;

DROP INDEX IF EXISTS shops_parent_branch;
ALTER TABLE shops DROP COLUMN IF EXISTS branch_created_by;
ALTER TABLE shops DROP COLUMN IF EXISTS branch_active;
ALTER TABLE shops DROP COLUMN IF EXISTS parent_shop_id;

UPDATE subscription_plans
SET features=COALESCE(features,'{}'::jsonb)-'multiLocation',
    limits=COALESCE(limits,'{}'::jsonb)-'locations',
    updated_at=NOW();

COMMIT;
