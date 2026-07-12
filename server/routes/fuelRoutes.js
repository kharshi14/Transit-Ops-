const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Fuel Route Working"
    });
});

router.post("/", (req, res) => {
    res.json({
        message: "Fuel POST Working"
    });
});

module.exports = router;