import { CreateVehicleInput, UpdateVehicleInput, VehicleStatus } from './types.js';

export class VehicleValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = 'VehicleValidationError';
  }
}

/**
 * Validates a registration number (alphanumeric, 3-15 chars, allowing hyphens/spaces).
 */
export function validateRegistrationNumber(regNum: string): void {
  if (!regNum || typeof regNum !== 'string') {
    throw new VehicleValidationError('registrationNumber', 'Registration number must be a non-empty string.');
  }
  const cleaned = regNum.trim();
  if (cleaned.length < 3 || cleaned.length > 15) {
    throw new VehicleValidationError('registrationNumber', 'Registration number must be between 3 and 15 characters.');
  }
  // Alphanumeric, spaces, hyphens
  const regex = /^[A-Za-z0-9\s-]+$/;
  if (!regex.test(cleaned)) {
    throw new VehicleValidationError(
      'registrationNumber',
      'Registration number can only contain letters, numbers, spaces, and hyphens.'
    );
  }
}

/**
 * Validates vehicle model/name.
 */
export function validateNameModel(name: string): void {
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    throw new VehicleValidationError('nameModel', 'Model name must be at least 3 characters.');
  }
}

/**
 * Validates vehicle type.
 */
export function validateVehicleType(type: string): void {
  if (!type || typeof type !== 'string' || type.trim().length < 2) {
    throw new VehicleValidationError('type', 'Vehicle type must be at least 2 characters.');
  }
}

/**
 * Validates load capacity (positive number).
 */
export function validateMaxLoadCapacity(cap: number): void {
  if (cap === undefined || typeof cap !== 'number' || isNaN(cap) || cap <= 0) {
    throw new VehicleValidationError('maxLoadCapacity', 'Maximum load capacity must be a positive number.');
  }
}

/**
 * Validates odometer reading (non-negative number).
 */
export function validateOdometer(odometer: number): void {
  if (odometer === undefined || typeof odometer !== 'number' || isNaN(odometer) || odometer < 0) {
    throw new VehicleValidationError('odometer', 'Odometer reading must be a non-negative number.');
  }
}

/**
 * Validates acquisition cost (positive number).
 */
export function validateAcquisitionCost(cost: number): void {
  if (cost === undefined || typeof cost !== 'number' || isNaN(cost) || cost <= 0) {
    throw new VehicleValidationError('acquisitionCost', 'Acquisition cost must be a positive number.');
  }
}

/**
 * Validates vehicle status.
 */
export function validateVehicleStatus(status: any): void {
  if (!Object.values(VehicleStatus).includes(status)) {
    throw new VehicleValidationError('status', `Invalid vehicle status: "${status}".`);
  }
}

export function validateRegion(region: string): void {
  if (!region || typeof region !== 'string' || region.trim().length < 2) {
    throw new VehicleValidationError('region', 'Region must be a non-empty string of at least 2 characters.');
  }
}

/**
 * Validates full creation inputs.
 */
export function validateCreateVehicle(input: CreateVehicleInput): void {
  validateRegistrationNumber(input.registrationNumber);
  validateNameModel(input.nameModel);
  validateVehicleType(input.type);
  validateMaxLoadCapacity(input.maxLoadCapacity);
  validateOdometer(input.odometer);
  validateAcquisitionCost(input.acquisitionCost);
  if (input.region !== undefined) {
    validateRegion(input.region);
  }
  if (input.status !== undefined) {
    validateVehicleStatus(input.status);
  }
}

/**
 * Validates partial update inputs.
 */
export function validateUpdateVehicle(input: UpdateVehicleInput): void {
  if (input.registrationNumber !== undefined) validateRegistrationNumber(input.registrationNumber);
  if (input.nameModel !== undefined) validateNameModel(input.nameModel);
  if (input.type !== undefined) validateVehicleType(input.type);
  if (input.maxLoadCapacity !== undefined) validateMaxLoadCapacity(input.maxLoadCapacity);
  if (input.odometer !== undefined) validateOdometer(input.odometer);
  if (input.acquisitionCost !== undefined) validateAcquisitionCost(input.acquisitionCost);
  if (input.status !== undefined) validateVehicleStatus(input.status);
  if (input.region !== undefined) validateRegion(input.region);
}
