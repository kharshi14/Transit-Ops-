import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DriverStatus, VehicleStatus, TripStatus } from '../src/domain/types.js';
import { TripValidationError } from '../src/domain/trip.js';
import { InMemoryDriverRepository } from '../src/repository/inMemoryDriverRepository.js';
import { InMemoryVehicleRepository } from '../src/repository/inMemoryVehicleRepository.js';
import { InMemoryTripRepository } from '../src/repository/inMemoryTripRepository.js';
import { DriverService } from '../src/service/driverService.js';
import { TripService } from '../src/service/tripService.js';
import { DriverBusinessRuleError } from '../src/service/driverService.js';

describe('Trip Management', () => {
  const futureExpiry = new Date();
  futureExpiry.setFullYear(futureExpiry.getFullYear() + 2);

  // Helper setup
  async function setupServices() {
    const driverRepo = new InMemoryDriverRepository();
    const vehicleRepo = new InMemoryVehicleRepository();
    const tripRepo = new InMemoryTripRepository();

    const driverService = new DriverService(driverRepo);
    const tripService = new TripService(tripRepo, driverRepo, vehicleRepo);

    // Seed 1 available driver
    const driver = await driverService.createDriver({
      name: 'John Driver',
      licenseNumber: 'LIC-100',
      licenseCategory: 'Class A',
      licenseExpiryDate: futureExpiry,
      contactNumber: '555-0100',
    });

    // Seed 1 available vehicle
    const vehicle = await vehicleRepo.save({
      id: 'v-1',
      registrationNumber: 'PLT-100',
      nameModel: 'Ford Transit',
      type: 'Cargo Van',
      status: VehicleStatus.Available,
      maxLoadCapacity: 3000,
      odometer: 100,
      acquisitionCost: 28000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { driverRepo, vehicleRepo, tripRepo, driverService, tripService, driver, vehicle };
  }

  describe('Validation Rules', () => {
    test('should reject invalid cargo weights', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      const invalidInput = {
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: -10, // negative weight
        plannedDistance: 120,
      };

      await assert.rejects(
        tripService.createTrip(invalidInput),
        (err: any) => err instanceof TripValidationError && err.field === 'cargoWeight'
      );
    });

    test('should reject identical source and destination', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      const invalidInput = {
        source: 'Warehouse A',
        destination: 'Warehouse A', // same location
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1000,
        plannedDistance: 120,
      };

      await assert.rejects(
        tripService.createTrip(invalidInput),
        (err: any) => err instanceof TripValidationError && err.field === 'destination'
      );
    });

    test('should reject invalid regions', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      await assert.rejects(
        tripService.createTrip({
          source: 'Warehouse A',
          destination: 'Client B',
          driverId: driver.id,
          vehicleId: vehicle.id,
          cargoWeight: 1000,
          plannedDistance: 120,
          region: 'X', // too short
        }),
        (err: any) => err instanceof TripValidationError && err.field === 'region'
      );
    });
  });

  describe('Trip Creation Constraints', () => {
    test('should prevent creation if cargo exceeds vehicle capacity', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      await assert.rejects(
        tripService.createTrip({
          source: 'Warehouse A',
          destination: 'Client B',
          driverId: driver.id,
          vehicleId: vehicle.id,
          cargoWeight: 4000, // exceeds maxCargoCapacity of 3000
          plannedDistance: 150,
        }),
        (err: any) => err instanceof DriverBusinessRuleError && err.message.includes('exceeds vehicle\'s maximum cargo capacity')
      );
    });

    test('should prevent creation if driver is not available', async () => {
      const { tripService, driverRepo, driver, vehicle } = await setupServices();

      // Make driver suspended
      driver.status = DriverStatus.Suspended;
      await driverRepo.save(driver);

      await assert.rejects(
        tripService.createTrip({
          source: 'Warehouse A',
          destination: 'Client B',
          driverId: driver.id,
          vehicleId: vehicle.id,
          cargoWeight: 1000,
          plannedDistance: 150,
        }),
        (err: any) => err instanceof DriverBusinessRuleError && err.message.includes('is not available')
      );
    });

    test('should prevent creation if vehicle is not available', async () => {
      const { tripService, vehicleRepo, driver, vehicle } = await setupServices();

      // Make vehicle in maintenance
      vehicle.status = VehicleStatus.InMaintenance;
      await vehicleRepo.save(vehicle);

      await assert.rejects(
        tripService.createTrip({
          source: 'Warehouse A',
          destination: 'Client B',
          driverId: driver.id,
          vehicleId: vehicle.id,
          cargoWeight: 1000,
          plannedDistance: 150,
        }),
        (err: any) => err instanceof DriverBusinessRuleError && err.message.includes('is not available')
      );
    });

    test('should create trip in Draft state successfully', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      const trip = await tripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1500,
        plannedDistance: 80,
      });

      assert.ok(trip.id);
      assert.strictEqual(trip.status, TripStatus.Draft);
      assert.strictEqual(trip.source, 'Warehouse A');
      assert.strictEqual(trip.destination, 'Client B');
    });
  });

  describe('Trip Lifecycles', () => {
    test('should lock driver and vehicle on dispatch', async () => {
      const { tripService, driverRepo, vehicleRepo, driver, vehicle } = await setupServices();

      const trip = await tripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1500,
        plannedDistance: 80,
      });

      // Dispatch
      const dispatchedTrip = await tripService.dispatchTrip(trip.id);
      assert.strictEqual(dispatchedTrip.status, TripStatus.Dispatched);

      // Verify Driver & Vehicle status updated to On Trip
      const updatedDriver = await driverRepo.findById(driver.id);
      assert.strictEqual(updatedDriver?.status, DriverStatus.OnTrip);

      const updatedVehicle = await vehicleRepo.findById(vehicle.id);
      assert.strictEqual(updatedVehicle?.status, VehicleStatus.OnTrip);
    });

    test('should release driver and vehicle on complete', async () => {
      const { tripService, driverRepo, vehicleRepo, driver, vehicle } = await setupServices();

      const trip = await tripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1500,
        plannedDistance: 80,
      });

      // Dispatch ➔ Complete
      await tripService.dispatchTrip(trip.id);
      const completedTrip = await tripService.completeTrip(trip.id);
      assert.strictEqual(completedTrip.status, TripStatus.Completed);

      // Verify Driver & Vehicle released back to Available
      const updatedDriver = await driverRepo.findById(driver.id);
      assert.strictEqual(updatedDriver?.status, DriverStatus.Available);

      const updatedVehicle = await vehicleRepo.findById(vehicle.id);
      assert.strictEqual(updatedVehicle?.status, VehicleStatus.Available);
    });

    test('should release driver and vehicle on cancel if dispatched', async () => {
      const { tripService, driverRepo, vehicleRepo, driver, vehicle } = await setupServices();

      const trip = await tripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1500,
        plannedDistance: 80,
      });

      // Dispatch ➔ Cancel
      await tripService.dispatchTrip(trip.id);
      const cancelledTrip = await tripService.cancelTrip(trip.id);
      assert.strictEqual(cancelledTrip.status, TripStatus.Cancelled);

      // Verify Driver & Vehicle released back to Available
      const updatedDriver = await driverRepo.findById(driver.id);
      assert.strictEqual(updatedDriver?.status, DriverStatus.Available);

      const updatedVehicle = await vehicleRepo.findById(vehicle.id);
      assert.strictEqual(updatedVehicle?.status, VehicleStatus.Available);
    });

    test('should prevent invalid transitions', async () => {
      const { tripService, driver, vehicle } = await setupServices();

      const trip = await tripService.createTrip({
        source: 'Warehouse A',
        destination: 'Client B',
        driverId: driver.id,
        vehicleId: vehicle.id,
        cargoWeight: 1500,
        plannedDistance: 80,
      });

      // Cannot complete a Draft trip directly
      await assert.rejects(
        tripService.completeTrip(trip.id),
        DriverBusinessRuleError
      );

      // Dispatch trip
      await tripService.dispatchTrip(trip.id);

      // Cannot dispatch an already Dispatched trip
      await assert.rejects(
        tripService.dispatchTrip(trip.id),
        DriverBusinessRuleError
      );

      // Complete trip
      await tripService.completeTrip(trip.id);

      // Cannot cancel a Completed trip
      await assert.rejects(
        tripService.cancelTrip(trip.id),
        DriverBusinessRuleError
      );
    });
  });
});
