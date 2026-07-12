const FuelLog=require("../models/FuelLog");

// Add Fuel Log
exports.addFuel=async(req,res)=>{
    try{

        const fuel=new FuelLog(req.body);

        await fuel.save();

        res.status(201).json({
            message:"Fuel Log Added Successfully",
            fuel
        });

    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }
};


// Get All Fuel Logs

exports.getFuelLogs=async(req,res)=>{

    try{

        const fuelLogs=await FuelLog.find().populate("vehicle");

        res.json(fuelLogs);

    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};


// Update Fuel Log

exports.updateFuel=async(req,res)=>{

    try{

        const fuel=await FuelLog.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true}
        );

        res.json({
            message:"Fuel Log Updated",
            fuel
        });

    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};


// Delete Fuel Log

exports.deleteFuel=async(req,res)=>{

    try{

        await FuelLog.findByIdAndDelete(req.params.id);

        res.json({
            message:"Fuel Log Deleted"
        });

    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};
console.log(module.exports);