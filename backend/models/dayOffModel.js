const pool = require('../db');

const DayOffModel = {
  async requestDayOff(barberId, requestDate) {
    const result = await pool.query(
      `INSERT INTO day_off_requests (barber_id, request_date) VALUES ($1, $2) RETURNING *`,
      [barberId, requestDate]
    );
    return result.rows[0];
  },

  async getAllRequests() {
    const result = await pool.query('SELECT * FROM day_off_requests');
    return result.rows;
  },

  async updateRequestStatus(id, status) {
    const result = await pool.query(
      `UPDATE day_off_requests SET status=$2 WHERE id=$1 RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  }
};

module.exports = DayOffModel;
