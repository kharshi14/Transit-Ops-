import { User, UserRole } from '../domain/types.js';

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Environment-safe SHA-256 password hashing.
 * Uses window.crypto in browser environments, globalThis.crypto in modern Node,
 * and falls back to dynamic dynamic node:crypto import for older Node testing.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  let cryptoProvider: any;
  if (typeof window !== 'undefined' && window.crypto) {
    cryptoProvider = window.crypto;
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    cryptoProvider = (globalThis as any).crypto;
  } else {
    // Dynamic import prevents bundle externalization errors in client packages
    const nodeCrypto = await import('node:crypto');
    cryptoProvider = nodeCrypto.webcrypto;
  }

  const hashBuffer = await cryptoProvider.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  private users: User[] = [];

  constructor() {
    const now = new Date();
    // Default seed accounts for Transit-Ops:
    // admin@transitops.com / admin123
    // dispatcher@transitops.com / dispatch123
    // maintenance@transitops.com / maint123
    // viewer@transitops.com / view123
    this.users = [
      {
        id: 'usr-1',
        email: 'admin@transitops.com',
        name: 'System Administrator',
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        role: UserRole.Admin,
        createdAt: now,
      },
      {
        id: 'usr-2',
        email: 'dispatcher@transitops.com',
        name: 'Lead Dispatcher',
        passwordHash: '5fe2e402b51c5793b3c81c9758f698bb649c3fcbc1a6b8a11f8bd851a3245957',
        role: UserRole.Dispatcher,
        createdAt: now,
      },
      {
        id: 'usr-3',
        email: 'maintenance@transitops.com',
        name: 'Maintenance Manager',
        passwordHash: '2eab737d095f86d7e5a1fc616298ac81169cc91b09d1035b44706bc0a1c10ecf',
        role: UserRole.Maintenance,
        createdAt: now,
      },
      {
        id: 'usr-4',
        email: 'viewer@transitops.com',
        name: 'General Viewer',
        passwordHash: '656d604dfdba41a262963cce53699bbc56cd7a2c0da1ad5ead45fc49214159d6',
        role: UserRole.Viewer,
        createdAt: now,
      },
    ];
  }

  async authenticate(email: string, password: string): Promise<User> {
    const formattedEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email === formattedEmail);
    if (!user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const calculatedHash = await hashPassword(password);
    if (calculatedHash !== user.passwordHash) {
      throw new AuthenticationError('Invalid email or password.');
    }

    return user;
  }

  async register(name: string, email: string, password: string, role: UserRole): Promise<User> {
    const formattedEmail = email.trim().toLowerCase();
    const existing = this.users.find(u => u.email === formattedEmail);
    if (existing) {
      throw new AuthenticationError('Email already registered.');
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email: formattedEmail,
      name: name.trim(),
      passwordHash,
      role,
      createdAt: new Date(),
    };

    this.users.push(newUser);
    return newUser;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }
}
