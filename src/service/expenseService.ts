import { InMemoryExpenseRepository } from '../repository/inMemoryExpenseRepository.js';
import { VehicleService } from './vehicleService.js';
import { CreateFuelLogInput, FuelLog, CreateExpenseInput, ExpenseRecord } from '../domain/types.js';

export class ExpenseService {
  constructor(
    private expenseRepo: InMemoryExpenseRepository,
    private vehicleService: VehicleService
  ) {}

  async logFuel(input: CreateFuelLogInput): Promise<FuelLog> {
    if (input.liters <= 0) {
      throw new Error('Fuel liters must be a positive number.');
    }
    if (input.cost <= 0) {
      throw new Error('Fuel cost must be a positive number.');
    }
    if (input.distance < 0) {
      throw new Error('Fuel distance cannot be negative.');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleService.getVehicle(input.vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle with ID "${input.vehicleId}" does not exist.`);
    }

    return this.expenseRepo.createFuelLog(input);
  }

  async listFuelLogs(): Promise<FuelLog[]> {
    return this.expenseRepo.listFuelLogs();
  }

  async listFuelLogsByVehicle(vehicleId: string): Promise<FuelLog[]> {
    return this.expenseRepo.listFuelLogsByVehicle(vehicleId);
  }

  async logExpense(input: CreateExpenseInput): Promise<ExpenseRecord> {
    if (input.amount <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleService.getVehicle(input.vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle with ID "${input.vehicleId}" does not exist.`);
    }

    return this.expenseRepo.createExpense(input);
  }

  async listExpenses(): Promise<ExpenseRecord[]> {
    return this.expenseRepo.listExpenses();
  }

  async listExpensesByVehicle(vehicleId: string): Promise<ExpenseRecord[]> {
    return this.expenseRepo.listExpensesByVehicle(vehicleId);
  }
}
