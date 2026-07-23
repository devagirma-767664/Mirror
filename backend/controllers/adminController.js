const UserModel = require('../models/userModel');
const DayOffModel = require('../models/dayOffModel');
const AppointmentModel = require('../models/appointmentModel');
const BillModel = require('../models/billModel');
const RatingModel = require('../models/ratingModel');
const bcrypt = require('bcrypt');

const AdminController = {
  async addUser(req, res) {
    try {
      const { name, email, role, password } = req.body;
      const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.createUser(
        name,
        email,
        role.toLowerCase(),
        hashedPassword,
        profilePicture
      );

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async removeUser(req, res) {
    try {
      const user = await UserModel.deleteUser(req.params.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Aggregated income report
  async getIncomeReport(req, res) {
    try {
      const result = await BillModel.getIncomeAggregates();
      res.json(result); // { daily, weekly, monthly }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Barber performance report
  async getCustomerFlow(req, res) {
    try {
      const result = await AppointmentModel.getBarberPerformance();
      res.json({ barbers: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAllDayOffRequests(req, res) {
    try {
      const requests = await DayOffModel.getAllRequests();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async handleDayOff(req, res) {
    try {
      const { status } = req.body;
      const updated = await DayOffModel.updateRequestStatus(req.params.id, status);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getBillsReport(req, res) {
    try {
      const result = await BillModel.getBillsReport();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = AdminController;
