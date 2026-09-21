const RatingModel = require('../models/ratingModel');

const RatingController = {
  async addRating(req, res) {
    try {
      const { appointmentId, barberId, rating, comment } = req.body;
      const newRating = await RatingModel.addRating(appointmentId, barberId, rating, comment, req.user.shopId);
      res.json(newRating);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getBarberAverage(req, res) {
    try {
      const avg = await RatingModel.getBarberAverage(req.params.id, req.user.shopId);
      res.json(avg);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = RatingController;
