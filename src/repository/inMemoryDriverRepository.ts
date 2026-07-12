import { Driver } from '../domain/types.js';
import { IDriverRepository } from './driverRepository.interface.js';

export class InMemoryDriverRepository implements IDriverRepository {
  private drivers: Map<string, Driver> = new Map();
  private storageKey = 'transit_ops_drivers_v1';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((d: any) => {
              try {
                d.licenseExpiryDate = d.licenseExpiryDate ? new Date(d.licenseExpiryDate) : undefined;
                d.createdAt = d.createdAt ? new Date(d.createdAt) : new Date();
                d.updatedAt = d.updatedAt ? new Date(d.updatedAt) : new Date();
                if (d.safetyLogs && Array.isArray(d.safetyLogs)) {
                  d.safetyLogs.forEach((log: any) => {
                    log.date = new Date(log.date);
                  });
                }
                this.drivers.set(d.id, d);
              } catch (e) {
                console.error('Error parsing individual driver record:', e, d);
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load drivers from localStorage:', err);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.drivers.values());
        window.localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save drivers to localStorage:', err);
      }
    }
  }

  async save(driver: Driver): Promise<Driver> {
    const cloned = structuredClone(driver);
    this.drivers.set(driver.id, cloned);
    this.saveToStorage();
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
    const deleted = this.drivers.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }
}
