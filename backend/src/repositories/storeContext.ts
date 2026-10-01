import { AsyncLocalStorage } from 'node:async_hooks';
import type { DataStore } from './store.js';
import type { StateRepository } from './stateRepository.js';

export interface StoreContext {
  data: DataStore;
  revision: number;
  dirty: boolean;
  repository: StateRepository;
}
export const storeContext = new AsyncLocalStorage<StoreContext>();

export async function commitStore(): Promise<void> {
  const context = storeContext.getStore();
  if (!context?.dirty) return;
  context.revision = await context.repository.save(context.data, context.revision);
  context.dirty = false;
}
