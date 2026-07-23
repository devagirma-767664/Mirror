const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

// Ratings (customers submit ratings after session)
router.post('/', authMiddleware, RatingController.addRating);
router.get('/barber/:id', authMiddleware, RatingController.getBarberAverage);

module.exports = router;
