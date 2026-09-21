const AppointmentModel = require('../models/appointmentModel');
const DayOffModel = require('../models/dayOffModel');
const RatingModel = require('../models/ratingModel');
const BillModel = require('../models/billModel');
const CompensationModel = require('../models/compensationModel');
const pool = require('../db');

const BarberController = {
  // ✅ Get active appointments for the logged-in barber
  async getAppointments(req, res) {
    try {
      const barberId = req.user.id; // comes from authMiddleware
      const appointments = await AppointmentModel.getActiveAppointments(barberId, req.user.shopId);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Start a session
  async startSession(req, res) {
    try {
      const appointment = await AppointmentModel.startSession(req.params.id, req.user.id, req.user.shopId);
      res.json(appointment); // must include appointment.id
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Close a session
  async closeSession(req, res) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const appointment = await AppointmentModel.closeSession(req.params.id, req.user.id, req.user.shopId, client);
        const bill = await BillModel.generateBill(appointment.id, req.user.shopId, client);
        await client.query('COMMIT');
        res.json({ appointment, bill, message: 'Service completed and bill sent to reception.' });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Request day off
  async requestDayOff(req, res) {
    try {
      const { requestDate } = req.body;
      const request = await DayOffModel.requestDayOff(req.user.id, requestDate, req.user.shopId);
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get ratings for logged-in barber
  async getRatings(req, res) {
    try {
      const barberId = req.user.id; // use auth context
      const ratings = await RatingModel.getBarberRatings(barberId, req.user.shopId);
      res.json(ratings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getEarnings(req, res) {
    try {
      // The owner controls the earnings window; barbers cannot choose another period.
      const earnings = await CompensationModel.earnings(req.user.shopId, req.user.id);
      res.json(earnings);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = BarberController;
