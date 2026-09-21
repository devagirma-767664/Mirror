const AppointmentModel = require('../models/appointmentModel');
const BillModel = require('../models/billModel');
const OperationsModel = require('../models/operationsModel');
const Desk = require('../models/receptionDeskModel');
const Finance = require('../models/deskFinanceModel');

const ReceptionistController = {
  async bookAppointment(req, res) {
    try {
      const { customerName, customerPhone, barberId, serviceId, startTime } = req.body;
      const appointment = await AppointmentModel.createAppointment(customerName, customerPhone, barberId, serviceId, startTime, req.user.shopId);
      res.status(201).json(appointment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllAppointments(req, res) {
    try {
      res.json(await AppointmentModel.getAllActiveAppointments(req.user.shopId));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async checkIn(req, res) {
    try {
      const appointment = await AppointmentModel.checkInAppointment(req.params.id, req.user.shopId);
      res.json({ message: 'Customer checked in and assigned to the barber.', appointment });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async registerWalkIn(req, res) {
    try {
      const { customerName, barberId, serviceId } = req.body;
      const appointment = await Desk.create(req.user.shopId, req.user.id, {barberId, nickname:customerName, serviceIds:req.body.serviceIds || (serviceId ? [serviceId] : [])});
      res.status(201).json({ message: 'Walk-in added to the barber’s queue.', appointment });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getBills(req, res) {
    try {
      res.json(await BillModel.getBillsReport(req.user.shopId));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async markBillPaid(req, res) {
    try {
      const bill = await BillModel.markPaid(req.params.id, req.user.shopId, req.user.id, req.body);
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getInventory(req, res) {
    try { res.json(await OperationsModel.getInventory(req.user.shopId)); }
    catch (error) { res.status(500).json({ error: error.message }); }
  },
  async createInventory(req, res) {
    try { res.status(201).json(await OperationsModel.createInventoryItem(req.user.shopId, req.body)); }
    catch (error) { res.status(400).json({ error: error.message }); }
  },
  async updateInventory(req, res) {
    try { res.json(await OperationsModel.updateInventoryItem(req.user.shopId, req.params.id, req.body)); }
    catch (error) { res.status(400).json({ error: error.message }); }
  },
  async adjustInventory(req, res) {
    try { res.json(await OperationsModel.adjustInventory(req.user.shopId, req.params.id, req.body.quantityChange, req.body.reason, req.user.id)); }
    catch (error) { res.status(400).json({ error: error.message }); }
  },
  async getExpenses(req, res) {
    try { res.json(await OperationsModel.getExpenses(req.user.shopId)); }
    catch (error) { res.status(500).json({ error: error.message }); }
  },
  async createExpense(req, res) {
    try { res.status(201).json(await Finance.expense(req.user.shopId, req.user.id, req.body)); }
    catch (error) { res.status(400).json({ error: error.message }); }
  },
};

module.exports = ReceptionistController;
