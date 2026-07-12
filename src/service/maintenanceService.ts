import { InMemoryMaintenanceRepository } from '../repository/inMemoryMaintenanceRepository.js';
import { VehicleService } from './vehicleService.js';
import { CreateMaintenanceInput, MaintenanceRecord, VehicleStatus } from '../domain/types.js';

export class MaintenanceService {
  constructor(
    private maintenanceRepo: InMemoryMaintenanceRepository,
    private vehicleService: VehicleService
  ) {}

  async logMaintenance(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
    if (input.cost < 0) {
      throw new Error('Maintenance cost cannot be negative.');
    }
    if (!input.maintenanceType.trim()) {
      throw new Error('Maintenance type is required.');
    }

    // Verify vehicle exists
    const vehicle = await this.vehicleService.getVehicle(input.vehicleId);
    if (!vehicle) {
      throw new Error(`Vehicle with ID "${input.vehicleId}" does not exist.`);
    }

    const record = await this.maintenanceRepo.create(input);

    // If status is Active, set vehicle status to "In Shop"
    if (record.status === 'Active') {
      await this.vehicleService.updateVehicleStatus(record.vehicleId, VehicleStatus.InShop);
    }

    return record;
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | null> {
    return this.maintenanceRepo.get(id);
  }

  async listMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return this.maintenanceRepo.list();
  }

  async listMaintenanceByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.maintenanceRepo.listByVehicle(vehicleId);
  }

  async completeMaintenance(id: string, endDate: Date): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepo.get(id);
    if (!record) {
      throw new Error(`Maintenance record "${id}" not found.`);
    }
    if (record.status === 'Completed') {
      throw new Error('Maintenance record is already completed.');
    }

    const updated = await this.maintenanceRepo.update(id, {
      status: 'Completed',
      endDate: new Date(endDate),
    });

    // Automatically transition vehicle status to "Available"
    await this.vehicleService.updateVehicleStatus(record.vehicleId, VehicleStatus.Available);

    return updated;
  }
}
