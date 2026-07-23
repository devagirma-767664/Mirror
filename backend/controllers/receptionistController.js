const AppointmentModel = require('../models/appointmentModel');
const BillModel = require('../models/billModel');

const ReceptionistController = {
  // Book Appointment
  async bookAppointment(req, res) {
    try {

      const { customerName, customerPhone, barberId, serviceId, startTime } = req.body;

      // ✅ Validate required IDs
      if (!barberId || !serviceId) {
        throw new Error("Service and barber must be selected for appointment.");
      }

      const appointment = await AppointmentModel.createAppointment(
        customerName,
        customerPhone,
        barberId,
        serviceId,
        startTime
      );
      res.status(201).json(appointment);
    } catch (err) {
      console.error("❌ Error booking appointment:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Fetch only active appointments
  async getAllAppointments(req, res) {
    try {
      const appointments = await AppointmentModel.getActiveAppointments();
      res.json(appointments);
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Check-In Booked Customer → also generate bill
  async checkIn(req, res) {
    try {

      // Mark appointment as Arrived
      const appointment = await AppointmentModel.checkInAppointment(req.params.id);
    
      // ✅ Ensure appointment has service & barber IDs
      if (!appointment.service_id || !appointment.barber_id) {
        throw new Error("Appointment missing service or barber — cannot generate bill");
      }

      // Generate bill immediately
      const bill = await BillModel.generateBill(req.params.id);

      res.json({ message: "Customer checked in and bill generated", appointment, bill });
    } catch (err) {
      console.error("❌ Error in check-in:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Register Walk-In
  // Register Walk-In → also generate bill
async registerWalkIn(req, res) {
  try {
    const { customerName, barberId, serviceId } = req.body;

    if (!barberId || !serviceId) {
      throw new Error("Service and barber must be selected for walk-in.");
    }

    // Create appointment
    const appointment = await AppointmentModel.assignWalkIn(
      customerName,
      serviceId,
      barberId
    );

    // ✅ Ensure appointment has service & barber IDs
    if (!appointment.service_id || !appointment.barber_id) {
      throw new Error("Appointment missing service or barber — cannot generate bill");
    }

    // Generate bill immediately
    const bill = await BillModel.generateBill(appointment.id);

    res.status(201).json({ message: "Walk-in registered and bill generated", appointment, bill });
  } catch (err) {
    console.error("❌ Error registering walk-in:", err);
    res.status(500).json({ error: err.message });
  }
}
,

  // ✅ Fetch all bills (Receptionist/Admin view)
  async getBills(req, res) {
    try {
      const bills = await BillModel.getBillsReport();
      res.json(bills);
    } catch (err) {
      console.error("❌ Error fetching bills:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // Mark Bill Paid → deletes appointment
  async markBillPaid(req, res) {
    try {
      const bill = await BillModel.markPaid(req.params.id);
      
      res.json(bill);
    } catch (err) {
      console.error("❌ Error marking bill paid:", err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = ReceptionistController;
