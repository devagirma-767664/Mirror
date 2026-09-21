// controllers/ServiceController.js
const ServiceModel = require("../models/serviceModel");
const ShopModel = require("../models/shopModel");

exports.getAllServices = async (req, res) => {
  try {
    const shop = req.query.shop ? await ShopModel.getDefaultPublic(req.query.shop) : req.user?.shopId ? { id: req.user.shopId } : await ShopModel.getDefaultPublic();
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    const services = await ServiceModel.getAllServices(shop.id);
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

exports.createService = async (req, res) => {
  try {
    const { name, price, duration } = req.body;
    const newService = await ServiceModel.createService(name, price, duration, req.user.shopId);
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration } = req.body;
    const updated = await ServiceModel.updateService(id, name, price, duration, req.user.shopId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ServiceModel.deleteService(id, req.user.shopId);
    if (!deleted) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json({ message: "Service deleted", id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
};
