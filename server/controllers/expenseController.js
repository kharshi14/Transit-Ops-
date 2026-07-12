const Expense = require("../models/Expense");

// Add Expense
exports.addExpense = async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();

        res.status(201).json({
            message: "Expense Added Successfully",
            expense
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// Get All Expenses
exports.getExpenses = async (req, res) => {
    try {

        const expenses = await Expense.find().populate("vehicle");

        res.json(expenses);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {

    try {

        await Expense.findByIdAndDelete(req.params.id);

        res.json({
            message: "Expense Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};