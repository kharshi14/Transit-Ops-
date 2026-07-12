import { test, describe } from 'node:test';
import assert from 'node:assert';
import { VehicleStatus } from '../src/domain/types.js';
import { VehicleValidationError } from '../src/domain/vehicle.js';
import { InMemoryVehicleRepository } from '../src/repository/inMemoryVehicleRepository.js';
import { VehicleService, VehicleAlreadyExistsError, VehicleBusinessRuleError } from '../src/service/vehicleService.js';

describe('Vehicle Registry', () => {
  describe('Validation Rules', () => {
    const repo = new InMemoryVehicleRepository();
    const service = new VehicleService(repo);

    test('should reject invalid registration numbers', async () => {
      // Empty
      await assert.rejects(
        service.createVehicle({
          registrationNumber: '',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'registrationNumber'
      );

      // Too short
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'registrationNumber'
      );

      // Special characters
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX_123#',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'registrationNumber'
      );
    });

    test('should reject invalid names and types', async () => {
      // Model too short
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Vo',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'nameModel'
      );

      // Type too short
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Volvo Truck',
          type: 'H',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'type'
      );
    });

    test('should reject invalid numeric bounds', async () => {
      // Negative capacity
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: -50,
          odometer: 150,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'maxLoadCapacity'
      );

      // Negative odometer
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: -5,
          acquisitionCost: 85000,
        }),
        (err: VehicleValidationError) => err.field === 'odometer'
      );

      // Negative cost
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: -1000,
        }),
        (err: VehicleValidationError) => err.field === 'acquisitionCost'
      );
    });

    test('should reject invalid regions', async () => {
      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'TX-101',
          nameModel: 'Volvo Truck',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 150,
          acquisitionCost: 85000,
          region: 'X', // too short
        }),
        (err: any) => err instanceof VehicleValidationError && err.field === 'region'
      );
    });
  });

  describe('Vehicle Operations & Constraints', () => {
    test('should register a vehicle successfully with default available status', async () => {
      const repo = new InMemoryVehicleRepository();
      const service = new VehicleService(repo);

      const vehicle = await service.createVehicle({
        registrationNumber: 'TX-9921',
        nameModel: 'Freightliner M2',
        type: 'Medium Truck',
        maxLoadCapacity: 6000,
        odometer: 1200,
        acquisitionCost: 45000,
      });

      assert.ok(vehicle.id);
      assert.strictEqual(vehicle.registrationNumber, 'TX-9921');
      assert.strictEqual(vehicle.nameModel, 'Freightliner M2');
      assert.strictEqual(vehicle.status, VehicleStatus.Available);
      assert.strictEqual(vehicle.odometer, 1200);
      assert.strictEqual(vehicle.acquisitionCost, 45000);
    });

    test('should prevent duplicate registration numbers', async () => {
      const repo = new InMemoryVehicleRepository();
      const service = new VehicleService(repo);

      await service.createVehicle({
        registrationNumber: 'DUP-PLATE',
        nameModel: 'Peterbilt 389',
        type: 'Heavy Truck',
        maxLoadCapacity: 12000,
        odometer: 0,
        acquisitionCost: 120000,
      });

      await assert.rejects(
        service.createVehicle({
          registrationNumber: 'DUP-PLATE',
          nameModel: 'Volvo VNL',
          type: 'Heavy Truck',
          maxLoadCapacity: 10000,
          odometer: 50,
          acquisitionCost: 95000,
        }),
        VehicleAlreadyExistsError
      );
    });

    test('should enforce odometer integrity (cannot decrease)', async () => {
      const repo = new InMemoryVehicleRepository();
      const service = new VehicleService(repo);

      const vehicle = await service.createVehicle({
        registrationNumber: 'TX-ODO',
        nameModel: 'Peterbilt 389',
        type: 'Heavy Truck',
        maxLoadCapacity: 12000,
        odometer: 10000,
        acquisitionCost: 120000,
      });

      // Increase - OK
      let updated = await service.updateOdometer(vehicle.id, 10500);
      assert.strictEqual(updated.odometer, 10500);

      // Decrease - Reject
      await assert.rejects(
        service.updateOdometer(vehicle.id, 9900),
        VehicleBusinessRuleError
      );
    });

    test('should enforce status lock (On Trip cannot change status directly)', async () => {
      const repo = new InMemoryVehicleRepository();
      const service = new VehicleService(repo);

      const vehicle = await service.createVehicle({
        registrationNumber: 'TX-ON-TRIP',
        nameModel: 'Peterbilt 389',
        type: 'Heavy Truck',
        maxLoadCapacity: 12000,
        odometer: 100,
        acquisitionCost: 120000,
        status: VehicleStatus.OnTrip,
      });

      await assert.rejects(
        service.updateVehicleStatus(vehicle.id, VehicleStatus.InShop),
        VehicleBusinessRuleError
      );

      await assert.rejects(
        service.updateVehicleStatus(vehicle.id, VehicleStatus.Retired),
        VehicleBusinessRuleError
      );
    });
  });
});
