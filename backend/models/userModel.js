const pool = require('../db');

const UserModel = {
  async createUser(name, email, phone, role, password, profilePicture, shopId, hasWorkspace = true, staffType = null, monthlySalary = 0) {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, role, password, profile_picture, shop_id, has_workspace, staff_type, monthly_salary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id,name,email,phone,role,profile_picture,shop_id,has_workspace,staff_type,monthly_salary,active,created_at`,
      [name, email || null, phone || null, role, password || null, profilePicture, shopId, hasWorkspace, staffType, monthlySalary]
    );
    return result.rows[0];
  },

  async getAllUsers(shopId) {
    const result = await pool.query(
      `SELECT id,name,email,phone,role,profile_picture,shop_id,has_workspace,staff_type,monthly_salary,active,created_at
       FROM users WHERE shop_id=$1 AND role <> 'platform_admin' ORDER BY created_at DESC`,
      [shopId]
    );
    return result.rows;
  },

  async findByLogin(identifier) {
    const result = await pool.query(
      `SELECT u.id,u.name,u.email,u.phone,u.role,u.password,u.profile_picture,u.shop_id,u.has_workspace,u.staff_type,u.active,
              s.name AS shop_name,s.slug AS shop_slug,s.plan_code,s.subscription_status,
              s.currency,s.timezone,p.name AS plan_name,p.features,p.limits
       FROM users u
       LEFT JOIN shops s ON s.id=u.shop_id
       LEFT JOIN subscription_plans p ON p.code=s.plan_code
       WHERE LOWER(u.email)=LOWER($1) OR u.phone=$1`,
      [identifier]
    );
    return result.rows[0];
  },

  async deleteUser(id, shopId) {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 AND shop_id=$2 AND role <> 'platform_admin'
       RETURNING id,name,email,phone,role,profile_picture,shop_id,has_workspace,staff_type,monthly_salary,active,created_at`,
      [id, shopId]
    );
    return result.rows[0];
  },

  async getBarbers(shopId) {
    const result = await pool.query(
      `SELECT id,name,email,phone,role,profile_picture,shop_id,has_workspace,staff_type,monthly_salary FROM users
       WHERE role='barber' AND shop_id=$1 ORDER BY name`,
      [shopId]
    );
    return result.rows;
  },
};

module.exports = UserModel;
