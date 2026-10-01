import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import { createApp } from '../src/app.js';
import { MemoryStateRepository } from '../src/repositories/memoryStateRepository.js';
import { StorageError, type StateRepository, type StoreSnapshot } from '../src/repositories/stateRepository.js';
import { createDefaultStore, type DataStore } from '../src/repositories/store.js';
import type { BusinessProfile, LoginLogRecord, StaffPartner } from '../src/types.js';

interface ApiResult<T> {
  status: number;
  body: { success: boolean; data: T; error?: string };
}

class ControlledRepository extends MemoryStateRepository {
  failLoads = false;
  failSaves = false;
  externalBusinessName?: string;
  savedStores: DataStore[] = [];

  override async load(): Promise<StoreSnapshot> {
    if (this.failLoads) throw new StorageError('Database read unavailable.');
    return super.load();
  }

  override async save(data: DataStore, expectedRevision: number): Promise<number> {
    if (this.failSaves) throw new StorageError('Database write unavailable.');
    if (this.externalBusinessName) {
      // An independent server commits between this request's read and write.
      const external = await super.load();
      external.data.businessProfile.businessName = this.externalBusinessName;
      this.externalBusinessName = undefined;
      await super.save(external.data, external.revision);
    }
    const revision = await super.save(data, expectedRevision);
    this.savedStores.push(structuredClone(data));
    return revision;
  }
}

async function startApi(t: TestContext, repository: StateRepository) {
  await repository.initialize(createDefaultStore());
  const server = createApp(repository).listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return async function request<T = unknown>(
    path: string,
    method = 'GET',
    payload?: unknown,
    headers: Record<string, string> = {},
  ): Promise<ApiResult<T>> {
    const response = await fetch(`${origin}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() as ApiResult<T>['body'] };
  };
}

test('profile updates survive a new app instance and read-only requests do not write', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await request<BusinessProfile>('/business-profile');
  assert.equal(initial.status, 200);
  assert.equal(initial.body.success, true);
  assert.equal(repository.savedStores.length, 0);

  const updated = await request<BusinessProfile>('/business-profile', 'PUT', {
    businessName: 'Persistent Book Depot',
    phone: '+91 90000 00001',
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.businessName, 'Persistent Book Depot');
  assert.equal(updated.body.data.address, initial.body.data.address);
  assert.equal(repository.savedStores.length, 1);

  const restartedRequest = await startApi(t, repository);
  const reloaded = await restartedRequest<BusinessProfile>('/business-profile');
  assert.deepEqual(reloaded.body.data, updated.body.data);
  assert.equal((await repository.load()).revision, 1);
  assert.equal(repository.savedStores.length, 1);
});

test('concurrent stock adjustments persist each stock change with its movement atomically', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await repository.load();
  const book = initial.data.books[0];

  const results = await Promise.all([5, 7].map((change) => request('/inventory/adjust', 'POST', {
    itemType: 'book', itemId: book.id, change, type: 'Adjustment In', notes: 'Persistence check',
  })));
  for (const result of results) {
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
  }

  const persisted = await repository.load();
  assert.equal(persisted.revision, 2);
  assert.equal(persisted.data.books.find((item) => item.id === book.id)?.currentStock, book.currentStock + 12);
  assert.equal(persisted.data.stockMovements.length, initial.data.stockMovements.length + 2);
  assert.equal(repository.savedStores.length, 2);
  repository.savedStores.forEach((snapshot, index) => {
    const movement = snapshot.stockMovements[0];
    assert.equal(movement.itemId, book.id);
    assert.equal(movement.type, 'Adjustment In');
    assert.equal(movement.notes, 'Persistence check');
    assert.equal(snapshot.stockMovements.length, initial.data.stockMovements.length + index + 1);
    assert.equal(snapshot.books.find((item) => item.id === book.id)?.currentStock, movement.newStock);
  });
});

test('a missing-order return discards stock and movement changes made before the service throws', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await repository.load();
  const book = initial.data.books[0];
  const result = await request('/orders/ORD-does-not-exist/returns', 'POST', {
    items: [{ itemId: book.id, itemName: book.name, quantity: 3, refundAmount: 450, reason: 'Wrong book' }],
    notes: 'Must not add stock for an absent order',
  });

  assert.equal(result.status, 404);
  assert.equal(result.body.success, false);
  assert.match(result.body.error ?? '', /not found/i);
  assert.deepEqual(await repository.load(), initial);
  assert.equal(repository.savedStores.length, 0);
  const backup = await request<{ store: DataStore }>('/admin/backup');
  assert.deepEqual(backup.body.data.store, initial.data);
});

test('save failures return 503 without persisting partial stock updates and subsequent requests can recover', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await repository.load();
  const book = initial.data.books[0];
  repository.failSaves = true;
  const payload = { itemType: 'book', itemId: book.id, change: -4, type: 'Damage' };
  const failed = await request('/inventory/adjust', 'POST', payload);

  assert.equal(failed.status, 503);
  assert.equal(failed.body.success, false);
  assert.match(failed.body.error ?? '', /write unavailable/i);
  assert.deepEqual(await repository.load(), initial);
  assert.equal(repository.savedStores.length, 0);

  repository.failSaves = false;
  const recovered = await request('/inventory/adjust', 'POST', payload);
  assert.equal(recovered.status, 200);
  const persisted = await repository.load();
  assert.equal(persisted.revision, 1);
  assert.equal(persisted.data.books.find((item) => item.id === book.id)?.currentStock, book.currentStock - 4);
  assert.equal(persisted.data.stockMovements.length, initial.data.stockMovements.length + 1);
});

test('read failures return 503 instead of serving stale data or accepting writes', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await repository.load();
  repository.failLoads = true;
  for (const result of [
    await request('/business-profile'),
    await request('/business-profile', 'PUT', { businessName: 'Must not persist' }),
  ]) {
    assert.equal(result.status, 503);
    assert.equal(result.body.success, false);
  }
  assert.equal(repository.savedStores.length, 0);
  repository.failLoads = false;
  assert.deepEqual(await repository.load(), initial);
  assert.equal((await request('/business-profile')).status, 200);
});

test('a stale request returns 409 and preserves another server commit, then succeeds after reloading', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  repository.externalBusinessName = 'Saved by another server';
  const conflicted = await request('/business-profile', 'PUT', { businessName: 'Stale request value' });

  assert.equal(conflicted.status, 409);
  assert.equal(conflicted.body.success, false);
  assert.match(conflicted.body.error ?? '', /refresh/i);
  const external = await repository.load();
  assert.equal(external.revision, 1);
  assert.equal(external.data.businessProfile.businessName, 'Saved by another server');
  assert.equal(repository.savedStores.length, 0);

  const retry = await request<BusinessProfile>('/business-profile', 'PUT', { businessName: 'Fresh request value' });
  assert.equal(retry.status, 200);
  assert.equal(retry.body.data.businessName, 'Fresh request value');
  assert.equal((await repository.load()).revision, 2);
});

test('backup restore and reset are persisted across app instances', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const defaults = await repository.load();
  const backup = await request<{ store: DataStore }>('/admin/backup');
  assert.equal(backup.status, 200);
  assert.deepEqual(backup.body.data.store, defaults.data);

  const custom = structuredClone(backup.body.data.store);
  custom.businessProfile.businessName = 'Restored Book Depot';
  custom.books[0].currentStock = 321;
  const restored = await request<{ store: DataStore }>('/admin/restore', 'POST', { store: custom });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.success, true);
  assert.deepEqual(restored.body.data.store, custom);

  const restartedRequest = await startApi(t, repository);
  const restoredBackup = await restartedRequest<{ store: DataStore }>('/admin/backup');
  assert.deepEqual(restoredBackup.body.data.store, custom);
  assert.equal((await repository.load()).revision, 1);

  const reset = await restartedRequest<{ store: DataStore }>('/admin/reset', 'POST');
  assert.equal(reset.status, 200);
  assert.deepEqual(reset.body.data.store, defaults.data);
  const afterResetRequest = await startApi(t, repository);
  const afterResetBackup = await afterResetRequest<{ store: DataStore }>('/admin/backup');
  assert.deepEqual(afterResetBackup.body.data.store, defaults.data);
  assert.equal((await repository.load()).revision, 2);
});

test('existing demo login, bearer identity and logout persist their session logs', { timeout: 10_000 }, async (t) => {
  const repository = new ControlledRepository();
  const request = await startApi(t, repository);
  const initial = await repository.load();
  const user = initial.data.staff[1];
  const loggedIn = await request<{ user: StaffPartner; log: LoginLogRecord }>('/auth/login', 'POST', {
    emailOrId: user.email,
    terminal: 'Store POS test',
    device: 'Persistence test client',
    ipAddress: '127.0.0.1',
    loginMethod: 'Quick Role Switch',
  });
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.body.data.user.id, user.id);
  assert.equal(loggedIn.body.data.log.status, 'Active');
  const persistedLogin = await repository.load();
  assert.equal(persistedLogin.data.loginLogs.length, initial.data.loginLogs.length + 1);
  assert.deepEqual(persistedLogin.data.loginLogs[0], loggedIn.body.data.log);

  const restartedRequest = await startApi(t, repository);
  const token = loggedIn.body.data.log.sessionToken;
  const currentUser = await restartedRequest<StaffPartner>('/auth/me', 'GET', undefined, {
    Authorization: `Bearer ${token}`,
  });
  assert.equal(currentUser.status, 200);
  assert.equal(currentUser.body.data.id, user.id);
  const logs = await restartedRequest<LoginLogRecord[]>(`/auth/logs?userId=${user.id}`);
  assert.deepEqual(logs.body.data[0], loggedIn.body.data.log);

  const loggedOut = await restartedRequest('/auth/logout', 'POST', { token });
  assert.equal(loggedOut.status, 200);
  const persistedLogout = await repository.load();
  assert.equal(persistedLogout.revision, 2);
  assert.equal(persistedLogout.data.loginLogs[0].status, 'Logged Out');
  assert.equal(persistedLogout.data.loginLogs[0].sessionToken, token);
});
