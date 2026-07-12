import { Vehicle } from '../domain/types.js';

export interface IVehicleRepository {
  save(vehicle: Vehicle): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  delete(id: string): Promise<boolean>;
}
