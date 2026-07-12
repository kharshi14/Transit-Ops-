const FuelLog = require("../models/FuelLog");
const Expense = require("../models/Expense");
const Vehicle = require("../models/Vehicle");

// Fuel Efficiency
exports.getFuelEfficiency = async (req, res) => {

    try {

        const fuelLogs = await FuelLog.find();

        let totalDistance = 0;
        let totalFuel = 0;

        fuelLogs.forEach(log => {
            totalDistance += log.distance;
            totalFuel += log.liters;
        });

        const efficiency =
            totalFuel === 0 ? 0 : totalDistance / totalFuel;

        res.json({
            fuelEfficiency: efficiency.toFixed(2)
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// Fleet Utilization
exports.getFleetUtilization = async (req, res) => {

    try {

        const totalVehicles = await Vehicle.countDocuments();

        const activeVehicles = await Vehicle.countDocuments({
            status: "On Trip"
        });

        const utilization =
            totalVehicles === 0
                ? 0
                : (activeVehicles / totalVehicles) * 100;

        res.json({
            fleetUtilization: utilization.toFixed(2) + "%"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// Operational Cost
exports.getOperationalCost = async (req, res) => {

    try {

        const fuelLogs = await FuelLog.find();

        const expenses = await Expense.find();

        let fuelCost = 0;
        let expenseCost = 0;

        fuelLogs.forEach(log => fuelCost += log.cost);

        expenses.forEach(exp => expenseCost += exp.amount);

        res.json({
            fuelCost,
            expenseCost,
            totalOperationalCost: fuelCost + expenseCost
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

// Vehicle ROI
exports.getROI = async (req, res) => {

    try {

        const vehicles = await Vehicle.find();

        const result = vehicles.map(vehicle => ({

            vehicle: vehicle.vehicleName,

            acquisitionCost: vehicle.acquisitionCost,

            roi: "Revenue module pending"

        }));

        res.json(result);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};