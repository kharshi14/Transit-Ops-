import { Trip } from '../domain/types.js';
import { ITripRepository } from './tripRepository.interface.js';

export class InMemoryTripRepository implements ITripRepository {
  private trips: Map<string, Trip> = new Map();
  private storageKey = 'transit_ops_trips_v1';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.forEach((t: any) => {
            t.createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
            t.updatedAt = t.updatedAt ? new Date(t.updatedAt) : new Date();
            this.trips.set(t.id, t);
          });
        }
      } catch (err) {
        console.error('Failed to load trips from localStorage:', err);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const list = Array.from(this.trips.values());
        window.localStorage.setItem(this.storageKey, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save trips to localStorage:', err);
      }
    }
  }

  async save(trip: Trip): Promise<Trip> {
    const cloned = structuredClone(trip);
    this.trips.set(trip.id, cloned);
    this.saveToStorage();
    return structuredClone(cloned);
  }

  async findById(id: string): Promise<Trip | null> {
    const trip = this.trips.get(id);
    if (!trip) return null;
    return structuredClone(trip);
  }

  async findAll(): Promise<Trip[]> {
    return Array.from(this.trips.values()).map((t) => structuredClone(t));
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.trips.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }
}
