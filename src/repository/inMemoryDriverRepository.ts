import { Driver } from '../domain/types.js';
import { IDriverRepository } from './driverRepository.interface.js';

export class InMemoryDriverRepository implements IDriverRepository {
  private drivers: Map<string, Driver> = new Map();

  async save(driver: Driver): Promise<Driver> {
    const cloned = structuredClone(driver);
    this.drivers.set(driver.id, cloned);
    return structuredClone(cloned);
  }

  async findById(id: string): Promise<Driver | null> {
    const driver = this.drivers.get(id);
    if (!driver) return null;
    return structuredClone(driver);
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    const normalized = licenseNumber.trim().toLowerCase();
    for (const driver of this.drivers.values()) {
      if (driver.licenseNumber.trim().toLowerCase() === normalized) {
        return structuredClone(driver);
      }
    }
    return null;
  }

  async findAll(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).map(d => structuredClone(d));
  }

  async delete(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }
}
