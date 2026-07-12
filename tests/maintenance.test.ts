import { test, describe } from 'node:test';
import assert from 'node:assert';
import { InMemoryMaintenanceRepository } from '../src/repository/inMemoryMaintenanceRepository.js';
import { InMemoryVehicleRepository } from '../src/repository/inMemoryVehicleRepository.js';
import { VehicleService } from '../src/service/vehicleService.js';
import { MaintenanceService } from '../src/service/maintenanceService.js';
import { VehicleStatus } from '../src/domain/types.js';

describe('Maintenance Management', () => {
  const vehicleRepo = new InMemoryVehicleRepository();
  const vehicleService = new VehicleService(vehicleRepo);
  const maintenanceRepo = new InMemoryMaintenanceRepository();
  const maintenanceService = new MaintenanceService(maintenanceRepo, vehicleService);

  test('should log active maintenance and switch vehicle status to In Shop', async () => {
    const vehicle = await vehicleService.createVehicle({
      registrationNumber: 'MAINT-001',
      nameModel: 'Ford F-150',
      type: 'Truck',
      maxLoadCapacity: 1500,
      odometer: 10000,
      acquisitionCost: 45000,
      region: 'North',
    });

    const record = await maintenanceService.logMaintenance({
      vehicleId: vehicle.id,
      maintenanceType: 'Oil Change',
      description: 'Scheduled engine oil replacement',
      cost: 150,
      startDate: new Date(),
      status: 'Active',
    });

    assert.strictEqual(record.maintenanceType, 'Oil Change');
    assert.strictEqual(record.status, 'Active');

    const updatedVehicle = await vehicleService.getVehicle(vehicle.id);
    assert.strictEqual(updatedVehicle.status, VehicleStatus.InShop);
  });

  test('should complete maintenance and set vehicle back to Available', async () => {
    const vehicle = await vehicleService.createVehicle({
      registrationNumber: 'MAINT-002',
      nameModel: 'Chevy Silverado',
      type: 'Truck',
      maxLoadCapacity: 1800,
      odometer: 15000,
      acquisitionCost: 50000,
      region: 'North',
    });

    const record = await maintenanceService.logMaintenance({
      vehicleId: vehicle.id,
      maintenanceType: 'Brake Pad Replacement',
      description: 'Replace worn pads',
      cost: 300,
      startDate: new Date(),
      status: 'Active',
    });

    const completed = await maintenanceService.completeMaintenance(record.id, new Date());
    assert.strictEqual(completed.status, 'Completed');
    assert.ok(completed.endDate);

    const updatedVehicle = await vehicleService.getVehicle(vehicle.id);
    assert.strictEqual(updatedVehicle.status, VehicleStatus.Available);
  });
});
