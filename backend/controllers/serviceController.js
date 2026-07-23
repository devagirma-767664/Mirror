// controllers/ServiceController.js
const ServiceModel = require("../models/ServiceModel");

exports.getAllServices = async (req, res) => {
  try {
    const services = await ServiceModel.getAllServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, price, duration } = req.body;
    const newService = await ServiceModel.createService(name, price, duration);
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration } = req.body;
    const updated = await ServiceModel.updateService(id, name, price, duration);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ServiceModel.deleteService(id);
    if (!deleted) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
};