import { Driver, DriverStatus, CreateDriverInput, UpdateDriverInput } from '../domain/types.js';
import { validateCreateDriver, validateUpdateDriver } from '../domain/driver.js';
import { IDriverRepository } from '../repository/driverRepository.interface.js';

// Cross-platform browser and Node-safe UUID generator
function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class DriverNotFoundError extends Error {
  constructor(id: string) {
    super(`Driver with ID "${id}" was not found.`);
    this.name = 'DriverNotFoundError';
  }
}

export class DriverAlreadyExistsError extends Error {
  constructor(licenseNumber: string) {
    super(`Driver with license number "${licenseNumber}" already exists.`);
    this.name = 'DriverAlreadyExistsError';
  }
}

export class DriverBusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriverBusinessRuleError';
  }
}

export class DriverService {
  constructor(private driverRepository: IDriverRepository) {}

  /**
   * Registers a new driver profile.
   */
  async createDriver(input: CreateDriverInput): Promise<Driver> {
    // 1. Perform domain validations
    validateCreateDriver(input);

    // 2. Check for duplicate license number
    const existing = await this.driverRepository.findByLicenseNumber(input.licenseNumber);
    if (existing) {
      throw new DriverAlreadyExistsError(input.licenseNumber);
    }

    // 3. Prevent registering a driver with an already expired license in an active status
    const isExpired = input.licenseExpiryDate.getTime() < Date.now();
    const initialStatus = input.status ?? DriverStatus.Available;
    if (isExpired && (initialStatus === DriverStatus.Available || initialStatus === DriverStatus.OnTrip)) {
      throw new DriverBusinessRuleError(
        `Cannot register driver with an expired license in state "${initialStatus}".`
      );
    }

    // 4. Construct Driver Entity
    const now = new Date();
    const initialScore = input.safetyScore ?? 100;
    const initialLog = {
      id: generateUUID(),
      timestamp: now,
      eventType: 'INITIAL_REGISTRATION',
      pointsDelta: initialScore,
      description: 'Driver profile registered with initial safety score.',
    };

    const driver: Driver = {
      id: generateUUID(),
      name: input.name.trim(),
      licenseNumber: input.licenseNumber.trim(),
      licenseCategory: input.licenseCategory.trim(),
      licenseExpiryDate: input.licenseExpiryDate,
      contactNumber: input.contactNumber.trim(),
      safetyScore: initialScore,
      status: initialStatus,
      safetyLog: [initialLog],
      createdAt: now,
      updatedAt: now,
    };

    return this.driverRepository.save(driver);
  }

  /**
   * Retrieves a driver profile by ID.
   */
  async getDriver(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new DriverNotFoundError(id);
    }
    return driver;
  }

  /**
   * Updates a driver's details.
   */
  async updateDriver(id: string, input: UpdateDriverInput): Promise<Driver> {
    const existing = await this.getDriver(id);

    // 1. Domain validation
    validateUpdateDriver(input);

    // 2. Check duplicate license number if license is being updated
    if (input.licenseNumber && input.licenseNumber !== existing.licenseNumber) {
      const duplicate = await this.driverRepository.findByLicenseNumber(input.licenseNumber);
      if (duplicate) {
        throw new DriverAlreadyExistsError(input.licenseNumber);
      }
    }

    // 3. Compile updated driver fields
    const updatedExpiry = input.licenseExpiryDate ?? existing.licenseExpiryDate;
    const isExpired = updatedExpiry.getTime() < Date.now();
    const updatedStatus = input.status ?? existing.status;

    // Business Rule: Expired license cannot be Available or On Trip
    if (isExpired && (updatedStatus === DriverStatus.Available || updatedStatus === DriverStatus.OnTrip)) {
      throw new DriverBusinessRuleError(
        `Cannot update status to "${updatedStatus}" or retain status while driver's license is expired.`
      );
    }

    // Business Rule: Auto-suspension if safety score falls below 50
    let finalStatus = updatedStatus;
    const updatedSafetyScore = input.safetyScore ?? existing.safetyScore;
    if (updatedSafetyScore < 50 && finalStatus !== DriverStatus.Suspended) {
      finalStatus = DriverStatus.Suspended;
    }

    // Append to Safety Log if score changed
    const scoreDelta = updatedSafetyScore - existing.safetyScore;
    const updatedLog = [...existing.safetyLog];
    if (scoreDelta !== 0) {
      updatedLog.push({
        id: generateUUID(),
        timestamp: new Date(),
        eventType: 'SCORE_ADJUSTMENT',
        pointsDelta: scoreDelta,
        description: 'Safety score updated manually through profile edit.',
      });
    }

    const updatedDriver: Driver = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      licenseNumber: input.licenseNumber?.trim() ?? existing.licenseNumber,
      licenseCategory: input.licenseCategory?.trim() ?? existing.licenseCategory,
      licenseExpiryDate: updatedExpiry,
      contactNumber: input.contactNumber?.trim() ?? existing.contactNumber,
      safetyScore: updatedSafetyScore,
      status: finalStatus,
      safetyLog: updatedLog,
      updatedAt: new Date(),
    };

    return this.driverRepository.save(updatedDriver);
  }

  /**
   * Directly updates a driver's status with rule enforcement.
   */
  async updateDriverStatus(id: string, newStatus: DriverStatus): Promise<Driver> {
    return this.updateDriver(id, { status: newStatus });
  }

  /**
   * Directly updates a driver's safety score (with threshold auto-suspension and log entry details).
   */
  async updateSafetyScore(
    id: string,
    newSafetyScore: number,
    eventType: string = 'SCORE_ADJUSTMENT',
    description: string = 'Safety score was updated.'
  ): Promise<Driver> {
    const existing = await this.getDriver(id);
    const scoreDelta = newSafetyScore - existing.safetyScore;
    const updatedLog = [...existing.safetyLog];
    
    if (scoreDelta !== 0) {
      updatedLog.push({
        id: generateUUID(),
        timestamp: new Date(),
        eventType,
        pointsDelta: scoreDelta,
        description,
      });
    }

    // Call updateDriver and override the safetyLog array
    const updated = await this.updateDriver(id, { safetyScore: newSafetyScore });
    updated.safetyLog = updatedLog;
    return this.driverRepository.save(updated);
  }

  /**
   * Retrieves drivers filtered by status.
   */
  async getDriversByStatus(status: DriverStatus): Promise<Driver[]> {
    const all = await this.driverRepository.findAll();
    return all.filter((driver) => driver.status === status);
  }

  /**
   * Retrieves all drivers.
   */
  async getAllDrivers(): Promise<Driver[]> {
    return this.driverRepository.findAll();
  }

  /**
   * Deletes a driver profile.
   */
  async deleteDriver(id: string): Promise<boolean> {
    await this.getDriver(id); // ensure exists, throws if not
    return this.driverRepository.delete(id);
  }

  /**
   * Audit licenses to find expired or expiring profiles.
   * @param thresholdDays Days window to consider "expiring soon"
   */
  async getDriversLicenseStatusReport(thresholdDays: number = 30): Promise<{
    expired: Driver[];
    expiringSoon: Driver[];
    valid: Driver[];
  }> {
    const all = await this.driverRepository.findAll();
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + thresholdDays);

    const report = {
      expired: [] as Driver[],
      expiringSoon: [] as Driver[],
      valid: [] as Driver[],
    };

    for (const driver of all) {
      const expiry = driver.licenseExpiryDate.getTime();
      if (expiry < now.getTime()) {
        report.expired.push(driver);
      } else if (expiry <= thresholdDate.getTime()) {
        report.expiringSoon.push(driver);
      } else {
        report.valid.push(driver);
      }
    }

    return report;
  }
}
