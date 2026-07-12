import { Trip, TripStatus, CreateTripInput, Vehicle, VehicleStatus, Driver, DriverStatus } from '../domain/types.js';
import { validateCreateTrip } from '../domain/trip.js';
import { ITripRepository } from '../repository/tripRepository.interface.js';
import { IVehicleRepository } from '../repository/vehicleRepository.interface.js';
import { IDriverRepository } from '../repository/driverRepository.interface.js';
import { DriverBusinessRuleError, DriverNotFoundError } from './driverService.js';

export class TripNotFoundError extends Error {
  constructor(id: string) {
    super(`Trip with ID "${id}" was not found.`);
    this.name = 'TripNotFoundError';
  }
}

export class VehicleNotFoundError extends Error {
  constructor(id: string) {
    super(`Vehicle with ID "${id}" was not found.`);
    this.name = 'VehicleNotFoundError';
  }
}

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

export class TripService {
  constructor(
    private tripRepository: ITripRepository,
    private driverRepository: IDriverRepository,
    private vehicleRepository: IVehicleRepository
  ) {}

  /**
   * Creates a new Trip in 'Draft' state.
   */
  async createTrip(input: CreateTripInput): Promise<Trip> {
    // 1. Domain validations
    validateCreateTrip(input);

    // 2. Fetch & Validate Driver availability
    const driver = await this.driverRepository.findById(input.driverId);
    if (!driver) {
      throw new DriverNotFoundError(input.driverId);
    }
    if (driver.status !== DriverStatus.Available) {
      throw new DriverBusinessRuleError(`Driver "${driver.name}" is not available. Status: ${driver.status}`);
    }

    // 3. Fetch & Validate Vehicle availability
    const vehicle = await this.vehicleRepository.findById(input.vehicleId);
    if (!vehicle) {
      throw new VehicleNotFoundError(input.vehicleId);
    }
    if (vehicle.status !== VehicleStatus.Available) {
      throw new DriverBusinessRuleError(`Vehicle with registration number "${vehicle.registrationNumber}" is not available. Status: ${vehicle.status}`);
    }

    // 4. Validate cargo weight capacity
    if (input.cargoWeight > vehicle.maxLoadCapacity) {
      throw new DriverBusinessRuleError(
        `Cargo weight (${input.cargoWeight} kg) exceeds vehicle's maximum cargo capacity (${vehicle.maxLoadCapacity} kg).`
      );
    }

    // 5. Construct Trip Entity
    const now = new Date();
    const trip: Trip = {
      id: generateUUID(),
      source: input.source.trim(),
      destination: input.destination.trim(),
      driverId: input.driverId,
      vehicleId: input.vehicleId,
      cargoWeight: input.cargoWeight,
      plannedDistance: input.plannedDistance,
      status: input.status ?? TripStatus.Draft,
      createdAt: now,
      updatedAt: now,
    };

    return this.tripRepository.save(trip);
  }

  /**
   * Retrieves a Trip profile by ID.
   */
  async getTrip(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findById(id);
    if (!trip) {
      throw new TripNotFoundError(id);
    }
    return trip;
  }

  /**
   * Retrieves all Trips.
   */
  async getAllTrips(): Promise<Trip[]> {
    return this.tripRepository.findAll();
  }

  /**
   * Transitions a trip status from Draft to Dispatched, locking the Driver and Vehicle on-trip.
   */
  async dispatchTrip(id: string): Promise<Trip> {
    const trip = await this.getTrip(id);

    // Transition Guard: Only Draft -> Dispatched
    if (trip.status !== TripStatus.Draft) {
      throw new DriverBusinessRuleError(`Cannot dispatch a trip that is in "${trip.status}" state.`);
    }

    // Fetch and double-check Driver is still Available
    const driver = await this.driverRepository.findById(trip.driverId);
    if (!driver) {
      throw new DriverNotFoundError(trip.driverId);
    }
    if (driver.status !== DriverStatus.Available) {
      throw new DriverBusinessRuleError(`Driver "${driver.name}" is no longer available. Status: ${driver.status}`);
    }

    // Fetch and double-check Vehicle is still Available
    const vehicle = await this.vehicleRepository.findById(trip.vehicleId);
    if (!vehicle) {
      throw new VehicleNotFoundError(trip.vehicleId);
    }
    if (vehicle.status !== VehicleStatus.Available) {
      throw new DriverBusinessRuleError(`Vehicle with registration number "${vehicle.registrationNumber}" is no longer available. Status: ${vehicle.status}`);
    }

    // Update Driver & Vehicle to On Trip
    driver.status = DriverStatus.OnTrip;
    driver.updatedAt = new Date();
    await this.driverRepository.save(driver);

    vehicle.status = VehicleStatus.OnTrip;
    vehicle.updatedAt = new Date();
    await this.vehicleRepository.save(vehicle);

    // Update Trip
    trip.status = TripStatus.Dispatched;
    trip.updatedAt = new Date();
    return this.tripRepository.save(trip);
  }

  /**
   * Transitions a trip status from Dispatched to Completed, releasing the Driver and Vehicle back to Available.
   */
  async completeTrip(id: string): Promise<Trip> {
    const trip = await this.getTrip(id);

    // Transition Guard: Only Dispatched -> Completed
    if (trip.status !== TripStatus.Dispatched) {
      throw new DriverBusinessRuleError(`Cannot complete a trip that is in "${trip.status}" state.`);
    }

    // Fetch Driver and release them
    const driver = await this.driverRepository.findById(trip.driverId);
    if (driver) {
      driver.status = DriverStatus.Available;
      driver.updatedAt = new Date();
      await this.driverRepository.save(driver);
    }

    // Fetch Vehicle and release it
    const vehicle = await this.vehicleRepository.findById(trip.vehicleId);
    if (vehicle) {
      vehicle.status = VehicleStatus.Available;
      vehicle.updatedAt = new Date();
      await this.vehicleRepository.save(vehicle);
    }

    // Update Trip
    trip.status = TripStatus.Completed;
    trip.updatedAt = new Date();
    return this.tripRepository.save(trip);
  }

  /**
   * Cancels a trip. Releases Driver and Vehicle if it was already Dispatched.
   */
  async cancelTrip(id: string): Promise<Trip> {
    const trip = await this.getTrip(id);

    // Transition Guard: Can only cancel Draft or Dispatched trips
    if (trip.status !== TripStatus.Draft && trip.status !== TripStatus.Dispatched) {
      throw new DriverBusinessRuleError(`Cannot cancel a trip that is in "${trip.status}" state.`);
    }

    const originalStatus = trip.status;

    // Update Trip status to Cancelled
    trip.status = TripStatus.Cancelled;
    trip.updatedAt = new Date();
    const savedTrip = await this.tripRepository.save(trip);

    // If it was already dispatched, release driver and vehicle
    if (originalStatus === TripStatus.Dispatched) {
      const driver = await this.driverRepository.findById(trip.driverId);
      if (driver && driver.status === DriverStatus.OnTrip) {
        driver.status = DriverStatus.Available;
        driver.updatedAt = new Date();
        await this.driverRepository.save(driver);
      }

      const vehicle = await this.vehicleRepository.findById(trip.vehicleId);
      if (vehicle && vehicle.status === VehicleStatus.OnTrip) {
        vehicle.status = VehicleStatus.Available;
        vehicle.updatedAt = new Date();
        await this.vehicleRepository.save(vehicle);
      }
    }

    return savedTrip;
  }
}
