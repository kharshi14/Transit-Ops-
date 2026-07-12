import { Vehicle, VehicleStatus, CreateVehicleInput, UpdateVehicleInput } from '../domain/types.js';
import { validateCreateVehicle, validateUpdateVehicle } from '../domain/vehicle.js';
import { IVehicleRepository } from '../repository/vehicleRepository.interface.js';

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

export class VehicleNotFoundError extends Error {
  constructor(id: string) {
    super(`Vehicle with ID "${id}" was not found.`);
    this.name = 'VehicleNotFoundError';
  }
}

export class VehicleAlreadyExistsError extends Error {
  constructor(regNum: string) {
    super(`Vehicle with registration number "${regNum}" already exists.`);
    this.name = 'VehicleAlreadyExistsError';
  }
}

export class VehicleBusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VehicleBusinessRuleError';
  }
}

export class VehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    validateCreateVehicle(input);

    const existing = await this.vehicleRepository.findByRegistrationNumber(input.registrationNumber);
    if (existing) {
      throw new VehicleAlreadyExistsError(input.registrationNumber);
    }

    const now = new Date();
    const vehicle: Vehicle = {
      id: generateUUID(),
      registrationNumber: input.registrationNumber.trim(),
      nameModel: input.nameModel.trim(),
      type: input.type.trim(),
      maxLoadCapacity: input.maxLoadCapacity,
      odometer: input.odometer,
      acquisitionCost: input.acquisitionCost,
      status: input.status ?? VehicleStatus.Available,
      createdAt: now,
      updatedAt: now,
    };

    return this.vehicleRepository.save(vehicle);
  }

  async getVehicle(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }
    return vehicle;
  }

  async updateVehicle(id: string, input: UpdateVehicleInput): Promise<Vehicle> {
    const existing = await this.getVehicle(id);

    validateUpdateVehicle(input);

    if (input.registrationNumber && input.registrationNumber !== existing.registrationNumber) {
      const duplicate = await this.vehicleRepository.findByRegistrationNumber(input.registrationNumber);
      if (duplicate) {
        throw new VehicleAlreadyExistsError(input.registrationNumber);
      }
    }

    // Odometer integrity: mileage cannot be decreased
    if (input.odometer !== undefined && input.odometer < existing.odometer) {
      throw new VehicleBusinessRuleError(
        `Odometer reading cannot be decreased from ${existing.odometer} km to ${input.odometer} km.`
      );
    }

    // Status locks: On Trip vehicles cannot transition to In Shop or Retired directly
    if (existing.status === VehicleStatus.OnTrip && input.status !== undefined && input.status !== VehicleStatus.OnTrip) {
      throw new VehicleBusinessRuleError(
        `Vehicle ${existing.registrationNumber} is currently On Trip and its status cannot be changed directly.`
      );
    }

    const updatedVehicle: Vehicle = {
      ...existing,
      registrationNumber: input.registrationNumber?.trim() ?? existing.registrationNumber,
      nameModel: input.nameModel?.trim() ?? existing.nameModel,
      type: input.type?.trim() ?? existing.type,
      maxLoadCapacity: input.maxLoadCapacity ?? existing.maxLoadCapacity,
      odometer: input.odometer ?? existing.odometer,
      acquisitionCost: input.acquisitionCost ?? existing.acquisitionCost,
      status: input.status ?? existing.status,
      updatedAt: new Date(),
    };

    return this.vehicleRepository.save(updatedVehicle);
  }

  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return this.updateVehicle(id, { status });
  }

  async updateOdometer(id: string, newOdometer: number): Promise<Vehicle> {
    return this.updateVehicle(id, { odometer: newOdometer });
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll();
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const vehicle = await this.getVehicle(id);
    if (vehicle.status === VehicleStatus.OnTrip) {
      throw new VehicleBusinessRuleError(
        `Cannot delete vehicle "${vehicle.registrationNumber}" while it is currently On Trip.`
      );
    }
    return this.vehicleRepository.delete(id);
  }
}
