import { FuelLog, CreateFuelLogInput, ExpenseRecord, CreateExpenseInput } from '../domain/types.js';

export class InMemoryExpenseRepository {
  private fuelLogs: Map<string, FuelLog> = new Map();
  private expenses: Map<string, ExpenseRecord> = new Map();
  private fuelKey = 'transit_ops_fuel_v1';
  private expenseKey = 'transit_ops_expenses_v1';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedFuel = window.localStorage.getItem(this.fuelKey);
        if (storedFuel) {
          const parsed = JSON.parse(storedFuel);
          parsed.forEach((l: any) => {
            l.date = l.date ? new Date(l.date) : new Date();
            l.createdAt = l.createdAt ? new Date(l.createdAt) : new Date();
            this.fuelLogs.set(l.id, l);
          });
        }

        const storedExpenses = window.localStorage.getItem(this.expenseKey);
        if (storedExpenses) {
          const parsed = JSON.parse(storedExpenses);
          parsed.forEach((e: any) => {
            e.date = e.date ? new Date(e.date) : new Date();
            e.createdAt = e.createdAt ? new Date(e.createdAt) : new Date();
            this.expenses.set(e.id, e);
          });
        }
      } catch (err) {
        console.error('Failed to load expenses from localStorage:', err);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const fuelList = Array.from(this.fuelLogs.values());
        window.localStorage.setItem(this.fuelKey, JSON.stringify(fuelList));

        const expenseList = Array.from(this.expenses.values());
        window.localStorage.setItem(this.expenseKey, JSON.stringify(expenseList));
      } catch (err) {
        console.error('Failed to save expenses to localStorage:', err);
      }
    }
  }

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
    this.saveToStorage();
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
    this.saveToStorage();
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
