import type { DataStore } from './store.js';

export interface StoreSnapshot { data: DataStore; revision: number }
export interface StateRepository {
  readonly mode: 'memory' | 'supabase';
  initialize(seed: DataStore): Promise<void>;
  load(): Promise<StoreSnapshot>;
  save(data: DataStore, expectedRevision: number): Promise<number>;
}

export class StorageError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
    this.name = 'StorageError';
  }
}
export class StorageConflictError extends StorageError {
  constructor() { super('Data changed in another request. Refresh and try again.', 409); }
}

export function assertDataStore(value: unknown): asserts value is DataStore {
  const data = value as DataStore | null;
  const collections = ['publishers', 'books', 'stationery', 'schools', 'orders',
    'purchaseOrders', 'stockMovements', 'staff', 'loginLogs'] as const;
  if (!data || typeof data !== 'object' || !data.businessProfile ||
      typeof data.businessProfile !== 'object' || Array.isArray(data.businessProfile) ||
      collections.some((key) => !Array.isArray(data[key]))) {
    throw new StorageError('Invalid database snapshot or backup format.', 400);
  }
}
