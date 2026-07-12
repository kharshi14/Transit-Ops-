import { FuelLog, CreateFuelLogInput, ExpenseRecord, CreateExpenseInput } from '../domain/types.js';

export class InMemoryExpenseRepository {
  private fuelLogs: Map<string, FuelLog> = new Map();
  private expenses: Map<string, ExpenseRecord> = new Map();

  async createFuelLog(input: CreateFuelLogInput): Promise<FuelLog> {
    const id = Math.random().toString(36).substring(2, 9);
    const log: FuelLog = {
      id,
      vehicleId: input.vehicleId,
      liters: input.liters,
      cost: input.cost,
      distance: input.distance,
      date: new Date(input.date),
      createdAt: new Date(),
    };
    this.fuelLogs.set(id, log);
    return structuredClone(log);
  }

  async listFuelLogs(): Promise<FuelLog[]> {
    return Array.from(this.fuelLogs.values()).map(l => structuredClone(l));
  }

  async listFuelLogsByVehicle(vehicleId: string): Promise<FuelLog[]> {
    return Array.from(this.fuelLogs.values())
      .filter(l => l.vehicleId === vehicleId)
      .map(l => structuredClone(l));
  }

  async createExpense(input: CreateExpenseInput): Promise<ExpenseRecord> {
    const id = Math.random().toString(36).substring(2, 9);
    const expense: ExpenseRecord = {
      id,
      vehicleId: input.vehicleId,
      expenseType: input.expenseType,
      amount: input.amount,
      date: new Date(input.date),
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return structuredClone(expense);
  }

  async listExpenses(): Promise<ExpenseRecord[]> {
    return Array.from(this.expenses.values()).map(e => structuredClone(e));
  }

  async listExpensesByVehicle(vehicleId: string): Promise<ExpenseRecord[]> {
    return Array.from(this.expenses.values())
      .filter(e => e.vehicleId === vehicleId)
      .map(e => structuredClone(e));
  }
}
