-- Keep established plan codes intact so existing subscriptions and audit records remain valid.
UPDATE subscription_plans
SET name=CASE code
  WHEN 'barberbook' THEN 'Mirror Basic'
  WHEN 'barberbook_plus' THEN 'Mirror Plus'
  ELSE name
END,
updated_at=NOW()
WHERE code IN ('barberbook','barberbook_plus');

UPDATE shops
SET name='Mirror Demo Shop',slug='mirror-demo'
WHERE slug='barberbook-demo';
