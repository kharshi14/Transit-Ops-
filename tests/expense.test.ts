import { test, describe } from 'node:test';
import assert from 'node:assert';
import { InMemoryExpenseRepository } from '../src/repository/inMemoryExpenseRepository.js';
import { InMemoryVehicleRepository } from '../src/repository/inMemoryVehicleRepository.js';
import { VehicleService } from '../src/service/vehicleService.js';
import { ExpenseService } from '../src/service/expenseService.js';

describe('Expense & Fuel Management', () => {
  const vehicleRepo = new InMemoryVehicleRepository();
  const vehicleService = new VehicleService(vehicleRepo);
  const expenseRepo = new InMemoryExpenseRepository();
  const expenseService = new ExpenseService(expenseRepo, vehicleService);

  test('should successfully log fuel fill-ups and retrieve operational efficiency metrics', async () => {
    const vehicle = await vehicleService.createVehicle({
      registrationNumber: 'EXP-001',
      nameModel: 'Hino 268',
      type: 'Heavy Truck',
      maxLoadCapacity: 10000,
      odometer: 50000,
      acquisitionCost: 85000,
      region: 'East',
    });

    const fuelLog = await expenseService.logFuel({
      vehicleId: vehicle.id,
      liters: 120,
      cost: 180,
      distance: 960,
      date: new Date(),
    });

    assert.strictEqual(fuelLog.liters, 120);
    assert.strictEqual(fuelLog.cost, 180);
    assert.strictEqual(fuelLog.distance, 960);

    const logs = await expenseService.listFuelLogsByVehicle(vehicle.id);
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].id, fuelLog.id);
  });

  test('should log general operational expenses', async () => {
    const vehicle = await vehicleService.createVehicle({
      registrationNumber: 'EXP-002',
      nameModel: 'Freightliner M2',
      type: 'Heavy Truck',
      maxLoadCapacity: 12000,
      odometer: 45000,
      acquisitionCost: 95000,
      region: 'East',
    });

    const expense = await expenseService.logExpense({
      vehicleId: vehicle.id,
      expenseType: 'Toll',
      amount: 45,
      date: new Date(),
    });

    assert.strictEqual(expense.expenseType, 'Toll');
    assert.strictEqual(expense.amount, 45);

    const expenses = await expenseService.listExpensesByVehicle(vehicle.id);
    assert.strictEqual(expenses.length, 1);
    assert.strictEqual(expenses[0].id, expense.id);
  });
});
