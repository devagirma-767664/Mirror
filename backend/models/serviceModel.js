const pool = require('../db');

const ServiceModel = {
  async createService(name, price, duration) {
    const result = await pool.query(
      `INSERT INTO services (name, price, duration) VALUES ($1, $2, $3) RETURNING *`,
      [name, price, duration]
    );
    return result.rows[0];
  },

  async getAllServices() {
    const result = await pool.query('SELECT * FROM services');
    return result.rows;
  },

  async updateService(id, name, price, duration) {
    const result = await pool.query(
      `UPDATE services SET name=$2, price=$3, duration=$4 WHERE id=$1 RETURNING *`,
      [id, name, price, duration]
    );
    return result.rows[0];
  }, 

  async deleteService(id) {
  const result = await pool.query(
    `DELETE FROM services WHERE id=$1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}
};

module.exports = ServiceModel;
