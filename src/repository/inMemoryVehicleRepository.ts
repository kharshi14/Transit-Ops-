import { Vehicle } from '../domain/types.js';
import { IVehicleRepository } from './vehicleRepository.interface.js';

export class InMemoryVehicleRepository implements IVehicleRepository {
  private vehicles: Map<string, Vehicle> = new Map();

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const cloned = structuredClone(vehicle);
    this.vehicles.set(vehicle.id, cloned);
    return structuredClone(cloned);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return null;
    return structuredClone(vehicle);
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null> {
    const normalized = registrationNumber.trim().toLowerCase();
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.registrationNumber.trim().toLowerCase() === normalized) {
        return structuredClone(vehicle);
      }
    }
    return null;
  }

  async findAll(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).map((v) => structuredClone(v));
  }

  async delete(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }
}
