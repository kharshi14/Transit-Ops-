import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DriverStatus } from '../src/domain/types.js';
import { DriverValidationError } from '../src/domain/driver.js';
import { InMemoryDriverRepository } from '../src/repository/inMemoryDriverRepository.js';
import { DriverService, DriverBusinessRuleError, DriverAlreadyExistsError, DriverNotFoundError } from '../src/service/driverService.js';

describe('Driver Management', () => {
  describe('Validation Rules', () => {
    const repository = new InMemoryDriverRepository();
    const service = new DriverService(repository);

    test('should reject invalid names', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const invalidInput = {
        name: 'A', // too short
        licenseNumber: 'LIC123',
        licenseCategory: 'Class A',
        licenseExpiryDate: futureDate,
        contactNumber: '+1234567890',
      };

      await assert.rejects(
        service.createDriver(invalidInput),
        (err: any) => err instanceof DriverValidationError && err.field === 'name'
      );

      await assert.rejects(
        service.createDriver({ ...invalidInput, name: 'John123' }), // invalid characters
        (err: any) => err instanceof DriverValidationError && err.field === 'name'
      );
    });

    test('should reject invalid contact numbers', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const invalidInput = {
        name: 'John Doe',
        licenseNumber: 'LIC123',
        licenseCategory: 'Class A',
        licenseExpiryDate: futureDate,
        contactNumber: 'abc', // non-numeric characters only
      };

      await assert.rejects(
        service.createDriver(invalidInput),
        (err: any) => err instanceof DriverValidationError && err.field === 'contactNumber'
      );

      await assert.rejects(
        service.createDriver({ ...invalidInput, contactNumber: '123' }), // too short
        (err: any) => err instanceof DriverValidationError && err.field === 'contactNumber'
      );
    });

    test('should reject invalid safety scores', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const invalidInput = {
        name: 'John Doe',
        licenseNumber: 'LIC123',
        licenseCategory: 'Class A',
        licenseExpiryDate: futureDate,
        contactNumber: '+1234567890',
        safetyScore: 101, // > 100
      };

      await assert.rejects(
        service.createDriver(invalidInput),
        (err: any) => err instanceof DriverValidationError && err.field === 'safetyScore'
      );

      await assert.rejects(
        service.createDriver({ ...invalidInput, safetyScore: -5 }), // < 0
        (err: any) => err instanceof DriverValidationError && err.field === 'safetyScore'
      );
    });

    test('should reject invalid regions', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      await assert.rejects(
        service.createDriver({
          name: 'Jane Doe',
          licenseNumber: 'TX-RGN-ERR',
          licenseCategory: 'CDL Class A',
          licenseExpiryDate: futureDate,
          contactNumber: '+1-555-0100',
          region: 'X', // too short
        }),
        (err: any) => err instanceof DriverValidationError && err.field === 'region'
      );
    });
  });

  describe('Driver Service Operations', () => {
    test('should successfully register a driver and generate default fields', async () => {
      const repository = new InMemoryDriverRepository();
      const service = new DriverService(repository);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const driver = await service.createDriver({
        name: 'Jane Doe',
        licenseNumber: 'TX998877',
        licenseCategory: 'CDL Class A',
        licenseExpiryDate: futureDate,
        contactNumber: '+1-555-0199',
      });

      assert.ok(driver.id);
      assert.strictEqual(driver.name, 'Jane Doe');
      assert.strictEqual(driver.licenseNumber, 'TX998877');
      assert.strictEqual(driver.safetyScore, 100);
      assert.strictEqual(driver.status, DriverStatus.Available);
      assert.strictEqual(driver.safetyLog.length, 1);
      assert.strictEqual(driver.safetyLog[0].eventType, 'INITIAL_REGISTRATION');
      assert.ok(driver.createdAt);
      assert.ok(driver.updatedAt);
    });

    test('should prevent duplicate license numbers', async () => {
      const repository = new InMemoryDriverRepository();
      const service = new DriverService(repository);
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

      await service.createDriver({
        name: 'Jane Doe',
        licenseNumber: 'DUP123',
        licenseCategory: 'CDL Class A',
        licenseExpiryDate: expiry,
        contactNumber: '+1-555-0199',
      });

      await assert.rejects(
        service.createDriver({
          name: 'John Smith',
          licenseNumber: 'DUP123',
          licenseCategory: 'Class B',
          licenseExpiryDate: expiry,
          contactNumber: '+1-555-0200',
        }),
        DriverAlreadyExistsError
      );
    });

    test('should prevent active status for expired licenses', async () => {
      const repository = new InMemoryDriverRepository();
      const service = new DriverService(repository);
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // yesterday

      const driver = await service.createDriver({
        name: 'Old Timer',
        licenseNumber: 'EXP111',
        licenseCategory: 'Class C',
        licenseExpiryDate: pastDate,
        contactNumber: '555-888-9999',
        status: DriverStatus.OffDuty,
      });

      assert.strictEqual(driver.status, DriverStatus.OffDuty);

      await assert.rejects(
        service.createDriver({
          name: 'Old Timer Two',
          licenseNumber: 'EXP222',
          licenseCategory: 'Class C',
          licenseExpiryDate: pastDate,
          contactNumber: '555-888-9999',
          status: DriverStatus.Available,
        }),
        DriverBusinessRuleError
      );

      await assert.rejects(
        service.updateDriverStatus(driver.id, DriverStatus.Available),
        DriverBusinessRuleError
      );
    });

    test('should auto-suspend driver if safety score falls below 50', async () => {
      const repository = new InMemoryDriverRepository();
      const service = new DriverService(repository);
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

      const driver = await service.createDriver({
        name: 'Risky Driver',
        licenseNumber: 'RSK007',
        licenseCategory: 'Class A',
        licenseExpiryDate: expiry,
        contactNumber: '+1-555-0007',
        safetyScore: 85,
      });

      let updated = await service.updateSafetyScore(driver.id, 60, 'HARSH_BRAKING', 'Detected hard braking event.');
      assert.strictEqual(updated.safetyScore, 60);
      assert.strictEqual(updated.status, DriverStatus.Available);
      assert.strictEqual(updated.safetyLog.length, 2);
      assert.strictEqual(updated.safetyLog[1].eventType, 'HARSH_BRAKING');
      assert.strictEqual(updated.safetyLog[1].pointsDelta, -25);

      updated = await service.updateSafetyScore(driver.id, 45, 'SPEEDING_MAJOR', 'Exceeded speed limit by 25mph.');
      assert.strictEqual(updated.safetyScore, 45);
      assert.strictEqual(updated.status, DriverStatus.Suspended);
      assert.strictEqual(updated.safetyLog.length, 3);
      assert.strictEqual(updated.safetyLog[2].eventType, 'SPEEDING_MAJOR');
      assert.strictEqual(updated.safetyLog[2].pointsDelta, -15);
    });

    test('should generate status report correctly', async () => {
      const repository = new InMemoryDriverRepository();
      const service = new DriverService(repository);

      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5); // 5 days ago
      const soonExpiring = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10); // 10 days from now
      const farExpiring = new Date(Date.now() + 1000 * 60 * 60 * 24 * 100); // 100 days from now

      await service.createDriver({
        name: 'Expired Driver',
        licenseNumber: 'LIC-L1',
        licenseCategory: 'Class C',
        licenseExpiryDate: pastDate,
        contactNumber: '555-111-2222',
        status: DriverStatus.OffDuty,
      });

      await service.createDriver({
        name: 'Soon Exp Driver',
        licenseNumber: 'LIC-L2',
        licenseCategory: 'Class C',
        licenseExpiryDate: soonExpiring,
        contactNumber: '555-111-3333',
        status: DriverStatus.Available,
      });

      await service.createDriver({
        name: 'Valid Driver',
        licenseNumber: 'LIC-L3',
        licenseCategory: 'Class C',
        licenseExpiryDate: farExpiring,
        contactNumber: '555-111-4444',
        status: DriverStatus.Available,
      });

      const report = await service.getDriversLicenseStatusReport(30);

      assert.strictEqual(report.expired.length, 1);
      assert.strictEqual(report.expired[0].name, 'Expired Driver');

      assert.strictEqual(report.expiringSoon.length, 1);
      assert.strictEqual(report.expiringSoon[0].name, 'Soon Exp Driver');

      assert.strictEqual(report.valid.length, 1);
      assert.strictEqual(report.valid[0].name, 'Valid Driver');
    });
  });
});
