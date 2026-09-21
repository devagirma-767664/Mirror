const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require("../middleware/upload");
const CompensationModel = require('../models/compensationModel');
const Payroll=require('../models/payrollModel');

// User management
router.get('/shop', authMiddleware, roleMiddleware(['admin']), AdminController.getShop);
router.put('/shop/subscription', authMiddleware, roleMiddleware(['admin']), AdminController.manageSubscription);

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
router.put('/users/:id/monthly-salary',authMiddleware,roleMiddleware(['admin']),AdminController.updateMonthlySalary);
router.put('/users/:id/credentials',authMiddleware,roleMiddleware(['admin']),AdminController.updateCredentials);
router.put('/users/:id/active',authMiddleware,roleMiddleware(['admin']),AdminController.setUserActive);

router.get('/compensation', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    res.json(await CompensationModel.list(req.user.shopId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/compensation/:barberId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    res.json(await CompensationModel.save(req.user.shopId, req.user.id, req.params.barberId, req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const payrollRun=fn=>async(req,res)=>{try{res.json(await fn(req));}catch(error){res.status(400).json({error:error.message});}};
router.get('/payroll',authMiddleware,roleMiddleware(['admin']),payrollRun(r=>Payroll.get(r.user.shopId,r.query)));
router.post('/payroll',authMiddleware,roleMiddleware(['admin']),payrollRun(r=>Payroll.prepare(r.user.shopId,r.user.id,r.body)));
router.put('/payroll/items/:id',authMiddleware,roleMiddleware(['admin']),payrollRun(r=>Payroll.updateItem(r.user.shopId,r.user.id,r.params.id,r.body)));
router.post('/payroll/:id/finalize',authMiddleware,roleMiddleware(['admin']),payrollRun(r=>Payroll.finalize(r.user.shopId,r.user.id,r.params.id)));
router.post('/payroll/items/:id/paid',authMiddleware,roleMiddleware(['admin']),payrollRun(r=>Payroll.markPaid(r.user.shopId,r.user.id,r.params.id,r.body)));

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
