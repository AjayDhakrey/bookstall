import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { StorageConflictError, StorageError, type StoreSnapshot } from '../src/repositories/stateRepository.js';
import { SupabaseStateRepository } from '../src/repositories/supabaseStateRepository.js';
import { createDefaultStore } from '../src/repositories/store.js';
import type { BusinessProfile } from '../src/types.js';

const migrationUrl = new URL('../../supabase/migrations/202610010001_book_dealer.sql', import.meta.url);
const backendKey = 'test-backend-key';

test('Supabase client, repository, transaction RPCs and Express APIs persist the same state', { timeout: 120_000 }, async (t) => {
  const database = new PGlite();
  const servers: Server[] = [];
  t.after(async () => {
    for (const server of servers.reverse()) {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await database.close();
  });

  async function listen(app: express.Express) {
    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  await database.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  await database.exec(await readFile(migrationUrl, 'utf8'));
  await database.exec('SET ROLE service_role');

  // Exercise real Supabase HTTP calls against the migration's PostgreSQL RPCs.
  const postgrest = express();
  postgrest.use(express.json({ limit: '10mb' }));
  postgrest.use((req, res, next) => {
    if (req.headers.apikey !== backendKey || req.headers.authorization !== `Bearer ${backendKey}`) {
      res.status(401).json({ code: '42501', message: 'Expected the backend API key', details: null, hint: null });
      return;
    }
    next();
  });
  postgrest.post('/rest/v1/rpc/:functionName', async (req, res) => {
    try {
      if (req.params.functionName === 'book_dealer_load_state') {
        const result = await database.query<{ state: StoreSnapshot | null }>(
          'SELECT public.book_dealer_load_state() AS state',
        );
        res.json(result.rows[0].state);
      } else if (req.params.functionName === 'book_dealer_commit_state') {
        const result = await database.query<{ revision: number }>(
          'SELECT public.book_dealer_commit_state($1::jsonb, $2::bigint) AS revision',
          [JSON.stringify(req.body.p_state), req.body.p_expected_revision],
        );
        res.json(result.rows[0].revision);
      } else {
        res.status(404).json({ code: 'PGRST202', message: 'RPC not found', details: null, hint: null });
      }
    } catch (error) {
      const sqlError = error as { code?: string; message?: string; detail?: string; hint?: string };
      const status = sqlError.code === '40001' ? 409 : sqlError.code === '22023' ? 400 : 503;
      res.status(status).json({
        code: sqlError.code ?? 'XX000', message: sqlError.message ?? 'Database failure',
        details: sqlError.detail ?? null, hint: sqlError.hint ?? null,
      });
    }
  });
  const supabaseOrigin = await listen(postgrest);
  const newRepository = () => new SupabaseStateRepository(createClient(supabaseOrigin, backendKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }));
  const repository = newRepository();
  const initialState = createDefaultStore();
  let expectedSnapshot: StoreSnapshot;

  await t.test('initialization seeds an empty database exactly once', async () => {
    await assert.rejects(repository.load(), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.status, 503);
      return true;
    });
    await repository.initialize(initialState);
    expectedSnapshot = { data: initialState, revision: 1 };
    assert.deepEqual(await repository.load(), expectedSnapshot);
    const otherSeed = createDefaultStore();
    otherSeed.businessProfile.businessName = 'Must not overwrite an initialized database';
    await newRepository().initialize(otherSeed);
    assert.deepEqual(await repository.load(), expectedSnapshot);
  });

  await t.test('a fresh Supabase client reloads committed state without reseeding it', async () => {
    const updated = structuredClone(expectedSnapshot.data);
    updated.businessProfile.businessName = 'Stored through the Supabase client';
    updated.books[0].currentStock += 9;
    updated.schools[0].bookMappings.reverse();
    const revision = await repository.save(updated, expectedSnapshot.revision);
    expectedSnapshot = { data: updated, revision };
    assert.equal(revision, 2);
    const restartedRepository = newRepository();
    await restartedRepository.initialize(createDefaultStore());
    assert.deepEqual(await restartedRepository.load(), expectedSnapshot);
  });

  await t.test('SQL revision conflicts become 409 StorageConflictError without overwriting data', async () => {
    const stale = structuredClone(initialState);
    stale.businessProfile.businessName = 'Stale write must not persist';
    await assert.rejects(newRepository().save(stale, expectedSnapshot.revision - 1), (error: unknown) => {
      assert.ok(error instanceof StorageConflictError);
      assert.equal(error.status, 409);
      return true;
    });
    assert.deepEqual(await repository.load(), expectedSnapshot);
  });

  await t.test('SQL snapshot validation becomes a 400 error and leaves all records intact', async () => {
    const invalid = structuredClone(expectedSnapshot.data);
    (invalid.books as unknown[])[0] = null;
    await assert.rejects(repository.save(invalid, expectedSnapshot.revision), (error: unknown) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.status, 400);
      return true;
    });
    assert.deepEqual(await repository.load(), expectedSnapshot);
  });

  await t.test('a commit constraint failure becomes 503 and rolls back earlier table writes', async () => {
    await database.exec('RESET ROLE');
    await database.exec("ALTER TABLE book_dealer.login_logs ADD CONSTRAINT repository_test_fail CHECK (payload ->> 'userName' <> 'Transport rollback sentinel')");
    await database.exec('SET ROLE service_role');
    try {
      const failing = structuredClone(expectedSnapshot.data);
      failing.businessProfile.businessName = 'Must roll back together with every table';
      failing.publishers = [];
      failing.books[0].currentStock = 0;
      failing.loginLogs[0].userName = 'Transport rollback sentinel';
      await assert.rejects(repository.save(failing, expectedSnapshot.revision), (error: unknown) => {
        assert.ok(error instanceof StorageError);
        assert.equal(error.status, 503);
        return true;
      });
      assert.deepEqual(await newRepository().load(), expectedSnapshot);
    } finally {
      await database.exec('RESET ROLE');
      await database.exec('ALTER TABLE book_dealer.login_logs DROP CONSTRAINT repository_test_fail');
      await database.exec('SET ROLE service_role');
    }
  });

  await t.test('an HTTP profile update persists through Supabase and a new Express app reads it', async () => {
    const appOrigin = await listen(createApp(repository));
    const updatedProfile: BusinessProfile = {
      ...expectedSnapshot.data.businessProfile,
      businessName: 'API update persisted in PostgreSQL',
      phone: '+91 90000 00099',
    };
    const updateResponse = await fetch(`${appOrigin}/api/business-profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: updatedProfile.businessName, phone: updatedProfile.phone }),
    });
    assert.equal(updateResponse.status, 200);
    assert.deepEqual(await updateResponse.json(), { success: true, data: updatedProfile });
    expectedSnapshot = {
      data: { ...expectedSnapshot.data, businessProfile: updatedProfile },
      revision: expectedSnapshot.revision + 1,
    };
    assert.deepEqual(await repository.load(), expectedSnapshot);

    const restartedRepository = newRepository();
    await restartedRepository.initialize(createDefaultStore());
    const restartedOrigin = await listen(createApp(restartedRepository));
    const readResponse = await fetch(`${restartedOrigin}/api/business-profile`);
    assert.equal(readResponse.status, 200);
    assert.deepEqual(await readResponse.json(), { success: true, data: updatedProfile });
    const statusResponse = await fetch(`${restartedOrigin}/api/database/status`);
    assert.deepEqual(await statusResponse.json(), {
      success: true, data: { mode: 'supabase', persistent: true },
    });
    assert.deepEqual(await restartedRepository.load(), expectedSnapshot);
  });
});
