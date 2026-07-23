// routes/services.js
const express = require("express");
const router = express.Router();
const ServiceController = require("../controllers/serviceController");

// GET all services
router.get("/", ServiceController.getAllServices);

// POST new service
router.post("/", ServiceController.createService);

// PUT update service
router.put("/:id", ServiceController.updateService);

// DELETE remove service
router.delete("/:id", ServiceController.deleteService);


module.exports = router;
