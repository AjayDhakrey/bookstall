import type { DataStore } from './store.js';
import { assertDataStore, StorageConflictError, StorageError,
  type StateRepository, type StoreSnapshot } from './stateRepository.js';

export class MemoryStateRepository implements StateRepository {
  readonly mode = 'memory' as const;
  private snapshot?: StoreSnapshot;

  async initialize(seed: DataStore): Promise<void> {
    if (!this.snapshot) this.snapshot = { data: structuredClone(seed), revision: 0 };
  }
  async load(): Promise<StoreSnapshot> {
    if (!this.snapshot) throw new StorageError('The data store has not been initialized.');
    return structuredClone(this.snapshot);
  }
  async save(data: DataStore, expectedRevision: number): Promise<number> {
    assertDataStore(data);
    if (!this.snapshot || this.snapshot.revision !== expectedRevision) throw new StorageConflictError();
    const revision = expectedRevision + 1;
    this.snapshot = { data: structuredClone(data), revision };
    return revision;
  }
}
