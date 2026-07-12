import { Driver } from '../domain/types.js';

export interface IDriverRepository {
  save(driver: Driver): Promise<Driver>;
  findById(id: string): Promise<Driver | null>;
  findByLicenseNumber(licenseNumber: string): Promise<Driver | null>;
  findAll(): Promise<Driver[]>;
  delete(id: string): Promise<boolean>;
}
