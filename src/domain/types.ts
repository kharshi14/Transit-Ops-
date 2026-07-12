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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date;
  contactNumber: string;
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
}

// --- Vehicle Interfaces ---
export enum VehicleStatus {
  Available = 'Available',
  OnTrip = 'On Trip',
  InMaintenance = 'In Maintenance',
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  makeModel: string;
  status: VehicleStatus;
  maxCargoCapacity: number; // in kg
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleInput {
  licensePlate: string;
  makeModel: string;
  status?: VehicleStatus;
  maxCargoCapacity: number;
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
}
