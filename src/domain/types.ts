export enum DriverStatus {
  Available = 'Available',
  OnTrip = 'On Trip',
  OffDuty = 'Off Duty',
  Suspended = 'Suspended',
}

export interface SafetyLogEntry {
  id: string;
  timestamp: Date;
  eventType: string; // e.g. 'SPEEDING_MINOR', 'SAFE_DRIVING_REWARD', 'INITIAL_SEEDED'
  pointsDelta: number; // e.g. -10, +5
  description: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  safetyScore: number; // 0 to 100
  status: DriverStatus;
  safetyLog: SafetyLogEntry[];
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
  region?: string;
  safetyScore?: number; // 0-100, defaults to 100
  status?: DriverStatus; // defaults to 'Available'
}

export interface UpdateDriverInput {
  name?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiryDate?: Date;
  contactNumber?: string;
  safetyScore?: number;
  status?: DriverStatus;
  region?: string;
}

// --- Vehicle Interfaces ---
export enum VehicleStatus {
  Available = 'Available',
  OnTrip = 'On Trip',
  InShop = 'In Shop',
  Retired = 'Retired',
}

export interface Vehicle {
  id: string;
  registrationNumber: string; // unique
  nameModel: string;
  type: string; // e.g. Truck, Van, Bus
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in USD or local currency
  status: VehicleStatus;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleInput {
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  region?: string;
  status?: VehicleStatus;
}

export interface UpdateVehicleInput {
  registrationNumber?: string;
  nameModel?: string;
  type?: string;
  maxLoadCapacity?: number;
  odometer?: number;
  acquisitionCost?: number;
  status?: VehicleStatus;
  region?: string;
}

// --- Trip Interfaces ---
export enum TripStatus {
  Draft = 'Draft',
  Dispatched = 'Dispatched',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  status: TripStatus;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  region?: string;
  status?: TripStatus; // defaults to 'Draft'
}

export interface UpdateTripInput {
  source?: string;
  destination?: string;
  vehicleId?: string;
  driverId?: string;
  cargoWeight?: number;
  plannedDistance?: number;
  status?: TripStatus;
  region?: string;
}

// --- User & RBAC Interfaces ---
export enum UserRole {
  Admin = 'Admin',
  Dispatcher = 'Dispatcher',
  Maintenance = 'Maintenance',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}
