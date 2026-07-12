import { DriverStatus, CreateDriverInput, UpdateDriverInput } from './types.js';

export class DriverValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = 'DriverValidationError';
  }
}

export function validateName(name: string): void {
  if (!name || name.trim().length < 2) {
    throw new DriverValidationError('name', 'Name must be at least 2 characters long');
  }
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    throw new DriverValidationError('name', 'Name contains invalid characters');
  }
}

export function validateLicenseNumber(licenseNumber: string): void {
  if (!licenseNumber || licenseNumber.trim().length < 3) {
    throw new DriverValidationError('licenseNumber', 'License number must be at least 3 characters long');
  }
  const licenseRegex = /^[a-zA-Z0-9\-\s]+$/;
  if (!licenseRegex.test(licenseNumber)) {
    throw new DriverValidationError('licenseNumber', 'License number contains invalid characters');
  }
}

export function validateLicenseCategory(licenseCategory: string): void {
  if (!licenseCategory || licenseCategory.trim().length === 0) {
    throw new DriverValidationError('licenseCategory', 'License category is required');
  }
}

export function validateLicenseExpiryDate(expiryDate: Date): void {
  if (!(expiryDate instanceof Date) || isNaN(expiryDate.getTime())) {
    throw new DriverValidationError('licenseExpiryDate', 'Invalid date object');
  }
}

export function validateContactNumber(contactNumber: string): void {
  if (!contactNumber) {
    throw new DriverValidationError('contactNumber', 'Contact number is required');
  }
  const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
  const digitsOnly = contactNumber.replace(/\D/g, '');
  if (!phoneRegex.test(contactNumber) || digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new DriverValidationError('contactNumber', 'Invalid contact number format or length (must contain 7 to 15 digits)');
  }
}

export function validateSafetyScore(score: number): void {
  if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
    throw new DriverValidationError('safetyScore', 'Safety score must be a number between 0 and 100');
  }
}

export function validateDriverStatus(status: DriverStatus): void {
  if (!Object.values(DriverStatus).includes(status)) {
    throw new DriverValidationError('status', `Invalid status. Allowed values: ${Object.values(DriverStatus).join(', ')}`);
  }
}

export function validateCreateDriver(input: CreateDriverInput): void {
  validateName(input.name);
  validateLicenseNumber(input.licenseNumber);
  validateLicenseCategory(input.licenseCategory);
  validateLicenseExpiryDate(input.licenseExpiryDate);
  validateContactNumber(input.contactNumber);
  if (input.safetyScore !== undefined) {
    validateSafetyScore(input.safetyScore);
  }
  if (input.status !== undefined) {
    validateDriverStatus(input.status);
  }
}

export function validateUpdateDriver(input: UpdateDriverInput): void {
  if (input.name !== undefined) validateName(input.name);
  if (input.licenseNumber !== undefined) validateLicenseNumber(input.licenseNumber);
  if (input.licenseCategory !== undefined) validateLicenseCategory(input.licenseCategory);
  if (input.licenseExpiryDate !== undefined) validateLicenseExpiryDate(input.licenseExpiryDate);
  if (input.contactNumber !== undefined) validateContactNumber(input.contactNumber);
  if (input.safetyScore !== undefined) validateSafetyScore(input.safetyScore);
  if (input.status !== undefined) validateDriverStatus(input.status);
}
