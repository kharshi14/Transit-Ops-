const express = require("express");

const router = express.Router();

const reportController = require("../controllers/reportController");

router.get("/fuel-efficiency", reportController.getFuelEfficiency);

router.get("/fleet-utilization", reportController.getFleetUtilization);

router.get("/operational-cost", reportController.getOperationalCost);

router.get("/roi", reportController.getROI);

module.exports = router;