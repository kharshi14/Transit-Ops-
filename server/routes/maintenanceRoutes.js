const express = require("express");

const router = express.Router();

const maintenanceController = require("../controllers/maintenanceController");

router.post("/", maintenanceController.addMaintenance);

router.get("/", maintenanceController.getMaintenance);

router.get("/:id", maintenanceController.getMaintenanceById);

router.put("/:id", maintenanceController.updateMaintenance);

router.put("/complete/:id", maintenanceController.completeMaintenance);

router.delete("/:id", maintenanceController.deleteMaintenance);

module.exports = router;