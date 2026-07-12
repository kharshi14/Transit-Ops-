import { Trip } from '../domain/types.js';
import { ITripRepository } from './tripRepository.interface.js';

export class InMemoryTripRepository implements ITripRepository {
  private trips: Map<string, Trip> = new Map();

  async save(trip: Trip): Promise<Trip> {
    const cloned = structuredClone(trip);
    this.trips.set(trip.id, cloned);
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
    return this.trips.delete(id);
  }
}
