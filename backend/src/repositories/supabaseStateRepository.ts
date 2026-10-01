import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataStore } from './store.js';
import { assertDataStore, StorageConflictError, StorageError,
  type StateRepository, type StoreSnapshot } from './stateRepository.js';

export class SupabaseStateRepository implements StateRepository {
  readonly mode = 'supabase' as const;
  constructor(private readonly client: SupabaseClient) {}

  private async read(): Promise<StoreSnapshot | null> {
    const { data, error } = await this.client.rpc('book_dealer_load_state');
    if (error) throw new StorageError('Cannot read Supabase. Verify the backend key and run the database migration.');
    if (data === null) return null;
    try {
      assertDataStore(data.data);
      if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('Invalid revision');
    } catch {
      throw new StorageError('Supabase contains an invalid application state. Restore a valid backup.');
    }
    return data as StoreSnapshot;
  }

  async initialize(seed: DataStore): Promise<void> {
    if (await this.read()) return;
    try {
      await this.save(seed, 0);
    } catch (error) {
      // Another server may have initialized the database while this one was starting.
      if (!(error instanceof StorageConflictError)) throw error;
    }
    await this.load();
  }

  async load(): Promise<StoreSnapshot> {
    const snapshot = await this.read();
    if (!snapshot) throw new StorageError('Supabase is not initialized. Restart after applying the migration.');
    return snapshot;
  }

  async save(data: DataStore, expectedRevision: number): Promise<number> {
    assertDataStore(data);
    const { data: revision, error } = await this.client.rpc('book_dealer_commit_state', {
      p_state: data,
      p_expected_revision: expectedRevision,
    });
    if (error?.code === '40001') throw new StorageConflictError();
    if (error?.code === '22023') throw new StorageError('Invalid database snapshot or backup format.', 400);
    if (error) throw new StorageError('Supabase save failed. Your changes were not confirmed; refresh and try again.');
    if (!Number.isSafeInteger(revision) || revision <= expectedRevision) {
      throw new StorageError('Supabase returned an invalid database revision.');
    }
    return revision;
  }
}
