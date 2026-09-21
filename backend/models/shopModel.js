const pool = require('../db');

const shopSelect = `
  SELECT s.id, s.name, s.slug, s.plan_code, s.subscription_status, s.subscription_source, s.currency,
         s.timezone, s.current_period_end::text AS current_period_end, s.created_at,
         s.trial_started_at,s.trial_ends_at,s.onboarding_completed_at,s.website_enabled,s.website_subdomain,s.address,s.phone,s.subscription_revision,
         p.name AS plan_name, p.monthly_price, p.description AS plan_description,
         p.features, p.limits, p.tier
  FROM shops s
  JOIN subscription_plans p ON p.code = s.plan_code`;

const ShopModel = {
  async getById(id) {
    const result = await pool.query(`${shopSelect} WHERE s.id = $1`, [id]);
    return result.rows[0];
  },

  async getDefaultPublic(input={}) {
    const {slug,subdomain}=typeof input==='string'?{slug:input}:input||{};
    if(typeof slug!=='string'&&!subdomain) return null;
    const params = [];
    let where = "WHERE s.website_enabled=true AND p.features->>'publicWebsite'='true' AND s.subscription_status='active' AND p.tier='max'";
    if (slug) {
      params.push(slug);
      where += ` AND s.slug = $${params.length}`;
    }
    if(subdomain){params.push(String(subdomain).toLowerCase());where+=` AND LOWER(s.website_subdomain)=$${params.length}`;}
    const result = await pool.query(`${shopSelect} ${where} ORDER BY s.id LIMIT 1`, params);
    const shop=result.rows[0];
    return shop&&require('./subscriptionModel').access(shop).canRequestWebsite?shop:null;
  },

  async getPlans() {
    const result = await pool.query('SELECT * FROM subscription_plans WHERE active = true ORDER BY monthly_price');
    return result.rows;
  },

  async getAllWithMetrics() {
    const result = await pool.query(`SELECT s.id,s.name,s.slug,s.plan_code,s.subscription_status,s.subscription_source,s.currency,s.created_at,s.cancelled_at,
      s.current_period_end::text AS current_period_end,s.trial_started_at,s.trial_ends_at,s.onboarding_completed_at,s.timezone,
      p.name AS plan_name,p.monthly_price,p.active AS plan_available,p.features,p.limits,p.tier,
      (SELECT COUNT(*)::int FROM users WHERE shop_id=s.id) AS staff_count,
      COALESCE((SELECT json_agg(json_build_object('id',id,'name',name,'email',email,'phone',phone) ORDER BY id) FROM users WHERE shop_id=s.id AND role='admin'),'[]') AS owners,
      (SELECT row_to_json(r) FROM (SELECT id,plan_code,plan_name,amount,requested_at FROM subscription_requests WHERE shop_id=s.id AND status='pending' ORDER BY id DESC LIMIT 1) r) AS pending_payment,
      (SELECT row_to_json(r) FROM (SELECT id,plan_code,plan_name,amount,reviewed_at FROM subscription_requests WHERE shop_id=s.id AND status='approved' ORDER BY reviewed_at DESC,id DESC LIMIT 1) r) AS last_payment
      FROM shops s JOIN subscription_plans p ON p.code=s.plan_code ORDER BY s.created_at DESC,s.id DESC`);
    return result.rows;
  },

  async createShop({ name, slug, planCode, currency, adminName, adminEmail, passwordHash }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const shopResult = await client.query(
        `INSERT INTO shops (name, slug, plan_code, subscription_status, subscription_source, currency,trial_started_at,trial_ends_at)
         VALUES ($1, $2, $3, 'trial', 'trial', $4,NOW(),NOW()+INTERVAL '7 days') RETURNING *`,
        [name, slug, planCode, currency || 'ETB']
      );
      const shop = shopResult.rows[0];
      const userResult = await client.query(
        `INSERT INTO users (name, email, role, password, shop_id)
         VALUES ($1, $2, 'admin', $3, $4)
         RETURNING id, name, email, role, shop_id, created_at`,
        [adminName, adminEmail, passwordHash, shop.id]
      );
      await client.query('COMMIT');
      return { shop, admin: userResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async manageSubscription(id, action) {
    if(action==='cancel') return require('./subscriptionModel').cancel(id);
    throw new Error('Submit your bank transfer or Telebirr payment for platform verification to renew or change packages.');
  },
};

module.exports = ShopModel;
