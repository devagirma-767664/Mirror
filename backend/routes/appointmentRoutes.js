const express = require('express');
const AppointmentModel = require('../models/appointmentModel');
const ShopModel = require('../models/shopModel');
const pool = require('../db');

const router = express.Router();

async function maxShop(req, res) {
  const shop = await ShopModel.getDefaultPublic(req.query.shop);
  if (!shop) {
    res.status(404).json({ error: 'Shop not found.' });
    return null;
  }
  if (shop.tier!=='max'||!shop.features?.onlineBooking) {
    res.status(403).json({ error: 'Online booking is available with Mirror Max only.' });
    return null;
  }
  return shop;
}

router.post('/book', async (req, res) => {
  try {
    const shop = await maxShop(req, res);
    if (!shop) return;
    const { customerName, customerPhone, barberId, serviceId, startTime } = req.body;
    const appointment = await AppointmentModel.createAppointment(customerName, customerPhone, barberId, serviceId, startTime, shop.id);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/barber/:barberId', async (req, res) => {
  try {
    const shop = await maxShop(req, res);
    if (!shop) return;
    const result = await pool.query(
      `SELECT start_time,status FROM appointments
       WHERE shop_id=$1 AND barber_id=$2 AND status IN ('Booked','Arrived','InProgress') ORDER BY start_time`,
      [shop.id, req.params.barberId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
