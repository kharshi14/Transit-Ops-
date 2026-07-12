import { CreateTripInput, UpdateTripInput, TripStatus } from './types.js';

export class TripValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = 'TripValidationError';
  }
}

export function validateSourceAndDestination(source: string, destination: string): void {
  if (!source || source.trim().length === 0) {
    throw new TripValidationError('source', 'Source location is required');
  }
  if (!destination || destination.trim().length === 0) {
    throw new TripValidationError('destination', 'Destination location is required');
  }
  if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
    throw new TripValidationError('destination', 'Source and Destination cannot be the same location');
  }
}

export function validateCargoWeight(cargoWeight: number): void {
  if (typeof cargoWeight !== 'number' || isNaN(cargoWeight) || cargoWeight <= 0) {
    throw new TripValidationError('cargoWeight', 'Cargo weight must be a positive number');
  }
}

export function validatePlannedDistance(plannedDistance: number): void {
  if (typeof plannedDistance !== 'number' || isNaN(plannedDistance) || plannedDistance <= 0) {
    throw new TripValidationError('plannedDistance', 'Planned distance must be a positive number');
  }
}

export function validateDriverId(driverId: string): void {
  if (!driverId || driverId.trim().length === 0) {
    throw new TripValidationError('driverId', 'Driver selection is required');
  }
}

export function validateVehicleId(vehicleId: string): void {
  if (!vehicleId || vehicleId.trim().length === 0) {
    throw new TripValidationError('vehicleId', 'Vehicle selection is required');
  }
}

export function validateTripStatus(status: TripStatus): void {
  if (!Object.values(TripStatus).includes(status)) {
    throw new TripValidationError('status', `Invalid status. Allowed values: ${Object.values(TripStatus).join(', ')}`);
  }
}

export function validateRegion(region: string): void {
  if (!region || typeof region !== 'string' || region.trim().length < 2) {
    throw new TripValidationError('region', 'Region must be a non-empty string of at least 2 characters.');
  }
}

export function validateCreateTrip(input: CreateTripInput): void {
  validateSourceAndDestination(input.source, input.destination);
  validateCargoWeight(input.cargoWeight);
  validatePlannedDistance(input.plannedDistance);
  validateDriverId(input.driverId);
  validateVehicleId(input.vehicleId);
  if (input.region !== undefined) {
    validateRegion(input.region);
  }
  if (input.status !== undefined) {
    validateTripStatus(input.status);
  }
}

export function validateUpdateTrip(input: UpdateTripInput): void {
  if (input.source !== undefined || input.destination !== undefined) {
    if (input.source !== undefined && input.destination !== undefined) {
      validateSourceAndDestination(input.source, input.destination);
    } else {
      if (input.source !== undefined && input.source.trim().length === 0) {
        throw new TripValidationError('source', 'Source location cannot be empty');
      }
      if (input.destination !== undefined && input.destination.trim().length === 0) {
        throw new TripValidationError('destination', 'Destination location cannot be empty');
      }
    }
  }

  if (input.cargoWeight !== undefined) validateCargoWeight(input.cargoWeight);
  if (input.plannedDistance !== undefined) validatePlannedDistance(input.plannedDistance);
  if (input.driverId !== undefined) validateDriverId(input.driverId);
  if (input.vehicleId !== undefined) validateVehicleId(input.vehicleId);
  if (input.status !== undefined) validateTripStatus(input.status);
  if (input.region !== undefined) validateRegion(input.region);
}
