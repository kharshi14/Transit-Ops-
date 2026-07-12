import { MaintenanceRecord, CreateMaintenanceInput } from '../domain/types.js';

export class InMemoryMaintenanceRepository {
  private records: Map<string, MaintenanceRecord> = new Map();

  async create(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    const id = Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const record: MaintenanceRecord = {
      id,
      vehicleId: input.vehicleId,
      maintenanceType: input.maintenanceType,
      description: input.description,
      cost: input.cost,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: input.status || 'Active',
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, record);
    return structuredClone(record);
  }

  async get(id: string): Promise<MaintenanceRecord | null> {
    const record = this.records.get(id);
    return record ? structuredClone(record) : null;
  }

  async list(): Promise<MaintenanceRecord[]> {
    return Array.from(this.records.values()).map(r => structuredClone(r));
  }

  async listByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return Array.from(this.records.values())
      .filter(r => r.vehicleId === vehicleId)
      .map(r => structuredClone(r));
  }

  async update(id: string, updates: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> {
    const record = this.records.get(id);
    if (!record) {
      throw new Error(`Maintenance record with id "${id}" not found.`);
    }
    const updated: MaintenanceRecord = {
      ...record,
      ...updates,
      updatedAt: new Date(),
    };
    this.records.set(id, updated);
    return structuredClone(updated);
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }
}
