const express = require('express');
const router = express.Router();
const ReceptionistController = require('../controllers/receptionistController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ✅ Fetch all appointments
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.getAllAppointments
);

// ✅ Book appointment
router.post(
  '/book',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.bookAppointment
);

// ✅ Check-in booked customer (also generates bill)
router.put(
  '/:id/checkin',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.checkIn
);

// ✅ Register walk-in
router.post(
  '/walkin',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.registerWalkIn
);

// ❌ Removed old generateBill route (no longer exists in controller)

// ✅ Mark bill paid
router.put(
  '/bills/:id/pay',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.markBillPaid
);

// ✅ Fetch bills (Receptionist/Admin view)
router.get(
  '/bills',
  authMiddleware,
  roleMiddleware(['receptionist']),
  ReceptionistController.getBills
);

module.exports = router;
