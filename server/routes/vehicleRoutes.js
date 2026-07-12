const express = require("express");

const router = express.Router();

const { test } = require("../controllers/vehicleController");

router.get("/", test);

module.exports = router;