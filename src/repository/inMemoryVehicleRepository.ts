import { Vehicle } from '../domain/types.js';
import { IVehicleRepository } from './vehicleRepository.interface.js';

export class InMemoryVehicleRepository implements IVehicleRepository {
  private vehicles: Map<string, Vehicle> = new Map();
  private storageKey = 'transit_ops_vehicles_v1';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.forEach((v: any) => {
            v.createdAt = v.createdAt ? new Date(v.createdAt) : new Date();
            v.updatedAt = v.updatedAt ? new Date(v.updatedAt) : new Date();
            this.vehicles.set(v.id, v);
          });
        }
      } catch (err) {
        console.error('Failed to load vehicles from localStorage:', err);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.vehicles.values());
        window.localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save vehicles to localStorage:', err);
      }
    }
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const cloned = structuredClone(vehicle);
    this.vehicles.set(vehicle.id, cloned);
    this.saveToStorage();
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
    const deleted = this.vehicles.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }
}
