const Vehicle = require("../models/Vehicle");

// GET all vehicles
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.status(200).json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST new vehicle
exports.addVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);

        await vehicle.save();

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};