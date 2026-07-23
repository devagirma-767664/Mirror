const express = require("express");
const router = express.Router();
const AppointmentModel = require("../models/appointmentModel");
const BillModel = require("../models/billModel");

// Book appointment
router.post("/book", async (req, res) => {
  const { customerName, customerPhone, barberId, serviceId, startTime } = req.body;
  try {
    const appointment = await AppointmentModel.createAppointment(
      customerName,
      customerPhone,
      barberId,
      serviceId,
      startTime
    );
    res.status(201).json(appointment);
  } catch (err) {
    if (err.message.includes("already booked") || err.code === "23505") {
      return res.status(400).json({ error: "This time is already booked for the selected barber." });
    }
    console.error("Error creating appointment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await AppointmentModel.getAllAppointments();
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch appointments for a barber
router.get("/barber/:barberId", async (req, res) => {
  try {
    const { barberId } = req.params;
    const appointments = await AppointmentModel.getAppointmentsByBarberId(barberId);
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Check-in booked customer (auto bill)
router.put("/:id/checkin", async (req, res) => {
  try {
    const appointment = await AppointmentModel.checkInAppointment(req.params.id);

    if (!appointment.service_id || !appointment.barber_id) {
      throw new Error("Appointment missing service or barber — cannot generate bill");
    }

    const bill = await BillModel.generateBill(req.params.id);

    res.json({ 
      message: "Customer checked in and bill generated", 
      appointment, 
      bill 
    });
  } catch (err) {
    console.error("Error checking in appointment:", err);
    res.status(500).json({ error: err.message });
  }
});

// Register walk-in
router.post("/walkin", async (req, res) => {
  try {
    const { customerName, barberId, serviceId } = req.body;
    const appointment = await AppointmentModel.assignWalkIn(customerName, serviceId, barberId);
    res.status(201).json(appointment);
  } catch (err) {
    console.error("Error registering walk-in:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start a barber session
router.put("/:id/start", async (req, res) => {
  try {
    const appointment = await AppointmentModel.startSession(req.params.id);
    res.json(appointment);
  } catch (err) {
    console.error("Error starting session:", err);
    res.status(500).json({ error: err.message });
  }
});

// Close a barber session
router.put("/:id/close", async (req, res) => {
  try {
    const appointment = await AppointmentModel.closeSession(req.params.id);
    res.json(appointment);
  } catch (err) {
    console.error("Error closing session:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
