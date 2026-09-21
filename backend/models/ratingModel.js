const pool = require('../db');

const RatingModel = {
  async addRating(appointmentId, barberId, rating, comment, shopId) {
    const result = await pool.query(
      `INSERT INTO ratings (appointment_id,barber_id,rating,comment,shop_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [appointmentId, barberId, rating, comment, shopId]
    );
    return result.rows[0];
  },

  async getBarberAverage(barberId, shopId) {
    const result = await pool.query(
      `SELECT AVG(rating) AS average_rating FROM ratings WHERE barber_id=$1 AND shop_id=$2`,
      [barberId, shopId]
    );
    return result.rows[0];
  },

  async getBarberRatings(barberId, shopId) {
    const result = await pool.query(
      `SELECT * FROM ratings WHERE barber_id=$1 AND shop_id=$2 ORDER BY created_at DESC`,
      [barberId, shopId]
    );
    return result.rows;
  }
};

module.exports = RatingModel;
