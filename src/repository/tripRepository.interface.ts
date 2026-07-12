import { Trip } from '../domain/types.js';

export interface ITripRepository {
  save(trip: Trip): Promise<Trip>;
  findById(id: string): Promise<Trip | null>;
  findAll(): Promise<Trip[]>;
  delete(id: string): Promise<boolean>;
}
