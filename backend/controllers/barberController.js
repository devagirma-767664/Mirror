const AppointmentModel = require('../models/appointmentModel');
const DayOffModel = require('../models/dayOffModel');
const RatingModel = require('../models/ratingModel');

const BarberController = {
  // ✅ Get active appointments for the logged-in barber
  async getAppointments(req, res) {
    try {
      const barberId = req.user.id; // comes from authMiddleware
      const appointments = await AppointmentModel.getActiveAppointments(barberId);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Start a session
  async startSession(req, res) {
    try {
      const appointment = await AppointmentModel.startSession(req.params.id);
      res.json(appointment); // must include appointment.id
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Close a session
  async closeSession(req, res) {
    try {
      const appointment = await AppointmentModel.closeSession(req.params.id);
      res.json(appointment); // must include appointment.id
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Request day off
  async requestDayOff(req, res) {
    try {
      const { barberId, requestDate } = req.body;
      const request = await DayOffModel.requestDayOff(barberId, requestDate);
      res.json(request);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Get ratings for logged-in barber
  async getRatings(req, res) {
    try {
      const barberId = req.user.id; // use auth context
      const ratings = await RatingModel.getBarberRatings(barberId);
      res.json(ratings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = BarberController;
