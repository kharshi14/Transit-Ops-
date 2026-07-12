const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
{
    vehicle:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Vehicle",
        required:true
    },

    expenseType:{
        type:String,
        enum:["Toll","Maintenance","Insurance","Other"],
        required:true
    },

    amount:{
        type:Number,
        required:true
    },

    date:{
        type:Date,
        default:Date.now
    }

},
{
    timestamps:true
});

module.exports = mongoose.model("Expense", expenseSchema);