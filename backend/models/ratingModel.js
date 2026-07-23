const pool = require('../db');

const RatingModel = {
  async addRating(appointmentId, barberId, rating, comment) {
    const result = await pool.query(
      `INSERT INTO ratings (appointment_id, barber_id, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [appointmentId, barberId, rating, comment]
    );
    return result.rows[0];
  },

  async getBarberAverage(barberId) {
    const result = await pool.query(
      `SELECT AVG(rating) AS average_rating FROM ratings WHERE barber_id = $1`,
      [barberId]
    );
    return result.rows[0];
  },

  async getBarberRatings(barberId) {
    const result = await pool.query(
      `SELECT * FROM ratings WHERE barber_id = $1 ORDER BY created_at DESC`,
      [barberId]
    );
    return result.rows;
  }
};

module.exports = RatingModel;
