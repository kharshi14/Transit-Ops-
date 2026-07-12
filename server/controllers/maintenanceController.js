const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");

// Create Maintenance
exports.addMaintenance = async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);

    await maintenance.save();

    await Vehicle.findByIdAndUpdate(req.body.vehicle, {
      status: "In Shop",
    });

    res.status(201).json({
      success: true,
      message: "Maintenance Added Successfully",
      maintenance,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Get All Maintenance
exports.getMaintenance = async (req, res) => {

  try {

    const maintenance = await Maintenance.find().populate("vehicle");

    res.status(200).json(maintenance);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Get Maintenance By ID
exports.getMaintenanceById = async (req, res) => {

  try {

    const maintenance = await Maintenance.findById(req.params.id).populate("vehicle");

    if (!maintenance) {

      return res.status(404).json({
        success: false,
        message: "Maintenance Record Not Found",
      });

    }

    res.status(200).json(maintenance);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Update Maintenance
exports.updateMaintenance = async (req, res) => {

  try {

    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Maintenance Updated Successfully",
      maintenance,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Complete Maintenance
exports.completeMaintenance = async (req, res) => {

  try {

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {

      return res.status(404).json({
        success: false,
        message: "Maintenance Record Not Found",
      });

    }

    maintenance.status = "Completed";
    maintenance.endDate = new Date();

    await maintenance.save();

    await Vehicle.findByIdAndUpdate(
      maintenance.vehicle,
      {
        status: "Available",
      }
    );

    res.status(200).json({
      success: true,
      message: "Maintenance Completed Successfully",
      maintenance,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// Delete Maintenance
exports.deleteMaintenance = async (req, res) => {

  try {

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {

      return res.status(404).json({
        success: false,
        message: "Maintenance Record Not Found",
      });

    }

    await Vehicle.findByIdAndUpdate(
      maintenance.vehicle,
      {
        status: "Available",
      }
    );

    await Maintenance.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Maintenance Deleted Successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};