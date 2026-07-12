import { test, describe } from 'node:test';
import assert from 'node:assert';
import { UserRole } from '../src/domain/types.js';
import { AuthService, AuthenticationError, hashPassword } from '../src/service/authService.js';

describe('Authentication & RBAC', () => {
  test('should correctly hash password using SHA-256', async () => {
    const rawPassword = 'admin123';
    const hash = await hashPassword(rawPassword);
    
    assert.strictEqual(
      hash,
      '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
    );
  });

  test('should successfully authenticate seeded admin user', async () => {
    const authService = new AuthService();
    const user = await authService.authenticate('admin@transitops.com', 'admin123');
    
    assert.strictEqual(user.name, 'System Administrator');
    assert.strictEqual(user.role, UserRole.Admin);
    assert.strictEqual(user.email, 'admin@transitops.com');
  });

  test('should successfully authenticate seeded dispatcher user', async () => {
    const authService = new AuthService();
    const user = await authService.authenticate('dispatcher@transitops.com', 'dispatch123');
    
    assert.strictEqual(user.name, 'Lead Dispatcher');
    assert.strictEqual(user.role, UserRole.Dispatcher);
  });

  test('should throw AuthenticationError for incorrect password', async () => {
    const authService = new AuthService();
    
    await assert.rejects(
      authService.authenticate('admin@transitops.com', 'wrongpassword'),
      (err: any) => err instanceof AuthenticationError && err.message === 'Invalid email or password.'
    );
  });

  test('should throw AuthenticationError for non-existent email', async () => {
    const authService = new AuthService();
    
    await assert.rejects(
      authService.authenticate('notfound@transitops.com', 'admin123'),
      (err: any) => err instanceof AuthenticationError && err.message === 'Invalid email or password.'
    );
  });

  test('should support registering new users and authenticating them', async () => {
    const authService = new AuthService();
    
    const newUser = await authService.register(
      'Alice Vance',
      'alice@transitops.com',
      'alicepwd123',
      UserRole.Dispatcher
    );
    
    assert.strictEqual(newUser.name, 'Alice Vance');
    assert.strictEqual(newUser.role, UserRole.Dispatcher);
    assert.ok(newUser.id.startsWith('usr-'));

    // Authenticate with new credentials
    const authUser = await authService.authenticate('alice@transitops.com', 'alicepwd123');
    assert.strictEqual(authUser.id, newUser.id);
    assert.strictEqual(authUser.name, 'Alice Vance');
  });

  test('should reject registrations with duplicate emails', async () => {
    const authService = new AuthService();
    
    await assert.rejects(
      authService.register('Clone User', 'admin@transitops.com', 'pwd123', UserRole.Viewer),
      (err: any) => err instanceof AuthenticationError && err.message === 'Email already registered.'
    );
  });
});
