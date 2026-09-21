// routes/services.js
const express = require("express");
const router = express.Router();
const ServiceController = require("../controllers/serviceController");
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// GET all services
router.get("/", optionalAuthMiddleware, ServiceController.getAllServices);

// POST new service
router.post("/", authMiddleware, roleMiddleware(['admin']), ServiceController.createService);

// PUT update service
router.put("/:id", authMiddleware, roleMiddleware(['admin']), ServiceController.updateService);

// DELETE remove service
router.delete("/:id", authMiddleware, roleMiddleware(['admin']), ServiceController.deleteService);


module.exports = router;
