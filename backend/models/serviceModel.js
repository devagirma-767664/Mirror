const pool = require('../db');

const ServiceModel = {
  async createService(name, price, duration, shopId) {
    const result = await pool.query(
      `INSERT INTO services (name, price, duration, shop_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, price, duration, shopId]
    );
    return result.rows[0];
  },

  async getAllServices(shopId) {
    const result = await pool.query('SELECT * FROM services WHERE shop_id=$1 ORDER BY name', [shopId]);
    return result.rows;
  },

  async updateService(id, name, price, duration, shopId) {
    const result = await pool.query(
      `UPDATE services SET name=$2,price=$3,duration=$4 WHERE id=$1 AND shop_id=$5 RETURNING *`,
      [id, name, price, duration, shopId]
    );
    return result.rows[0];
  }, 

  async deleteService(id, shopId) {
  const result = await pool.query(
    `DELETE FROM services WHERE id=$1 AND shop_id=$2 RETURNING *`,
    [id, shopId]
  );
  return result.rows[0];
}
};

module.exports = ServiceModel;
