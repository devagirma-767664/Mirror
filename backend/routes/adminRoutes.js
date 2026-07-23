const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require("../middleware/upload");

// User management
router.post(
  '/users',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('profilePicture'),
  AdminController.addUser
);

router.delete(
  '/users/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.removeUser
);

router.get(
  '/users',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.getAllUsers
);

// Reports
router.get(
  '/reports/income',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.getIncomeReport // ✅ now returns { daily, weekly, monthly }
);

router.get(
  '/reports/customer-flow',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.getCustomerFlow // ✅ now returns { barbers: [...] }
);

router.get(
  '/reports/bills',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.getBillsReport
);

// Day-off requests
router.get(
  '/dayoff',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.getAllDayOffRequests
);

router.put(
  '/dayoff/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  AdminController.handleDayOff
);

module.exports = router;
