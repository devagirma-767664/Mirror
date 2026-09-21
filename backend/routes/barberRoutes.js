const express = require('express');
const router = express.Router();
const BarberController = require('../controllers/barberController');
const UserModel = require('../models/userModel');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const ShopModel = require('../models/shopModel');

// 🔹 Public endpoint: list all barbers
router.get('/barbers', optionalAuthMiddleware, async (req, res) => {
  try {
    const shop = req.query.shop ? await ShopModel.getDefaultPublic(req.query.shop) : req.user?.shopId ? { id: req.user.shopId } : await ShopModel.getDefaultPublic();
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const barbers = await UserModel.getBarbers(shop.id);
    res.json(req.query.shop||!req.user?barbers.map(({id,name,profile_picture})=>({id,name,profile_picture})):barbers);
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
  (req,res)=>res.status(403).json({error:'Reception now manages service start and finish. Your board is for viewing.'})
);

router.put(
  '/appointments/:id/close',
  authMiddleware,
  roleMiddleware(['barber']),
  (req,res)=>res.status(403).json({error:'Reception now manages service start and finish. Your board is for viewing.'})
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

router.get(
  '/earnings',
  authMiddleware,
  roleMiddleware(['barber']),
  BarberController.getEarnings
);

module.exports = router;
