BEGIN;

-- The Max package sits above the existing Basic and Plus prices.
UPDATE subscription_plans
SET monthly_price=8000,
    updated_at=NOW()
WHERE code='mirror_max';

COMMIT;
