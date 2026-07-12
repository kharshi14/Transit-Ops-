const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Fuel route is working" });
});

module.exports = router;
