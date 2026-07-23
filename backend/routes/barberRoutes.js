const express = require('express');
const router = express.Router();
const BarberController = require('../controllers/barberController');
const UserModel = require('../models/userModel');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// 🔹 Public endpoint: list all barbers
router.get('/barbers', async (req, res) => {
  try {
    const barbers = await UserModel.getBarbers();
    res.json(barbers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Barber-only endpoints
router.get(
  '/appointments',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.getAppointments // ✅ now uses getActiveAppointments internally
);

router.put(
  '/appointments/:id/start',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.startSession
);

router.put(
  '/appointments/:id/close',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.closeSession
);

router.post(
  '/dayoff',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.requestDayOff
);

router.get(
  '/ratings',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.getRatings
);

module.exports = router;
