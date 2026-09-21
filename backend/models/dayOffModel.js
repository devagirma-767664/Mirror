const pool = require('../db');

const DayOffModel = {
  async requestDayOff(barberId, requestDate, shopId) {
    const result = await pool.query(
      `INSERT INTO day_off_requests (barber_id,request_date,shop_id) VALUES ($1,$2,$3) RETURNING *`,
      [barberId, requestDate, shopId]
    );
    return result.rows[0];
  },

  async getAllRequests(shopId) {
    const result = await pool.query(`
      SELECT d.*, u.name AS barber_name
      FROM day_off_requests d
      LEFT JOIN users u ON u.id = d.barber_id
      WHERE d.shop_id = $1
      ORDER BY d.request_date ASC, d.created_at ASC
    `, [shopId]);
    return result.rows;
  },

  async updateRequestStatus(id, status, shopId) {
    const result = await pool.query(
      `UPDATE day_off_requests SET status=$2 WHERE id=$1 AND shop_id=$3 RETURNING *`,
      [id, status, shopId]
    );
    return result.rows[0];
  }
};

module.exports = DayOffModel;
