import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { createServer, type AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import express from 'express';
import { PGlite } from '@electric-sql/pglite';
import { createEmptyStore, type DataStore } from '../src/repositories/store.js';
import type { StoreSnapshot } from '../src/repositories/stateRepository.js';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const serverPath = fileURLToPath(new URL('../src/server.ts', import.meta.url));
const migrationUrl = new URL('../../supabase/migrations/202610010001_book_dealer.sql', import.meta.url);
const indexUrl = new URL('../../frontend/dist/index.html', import.meta.url);
const backendKey = 'sb_secret_test_server_restart_marker';

interface RunningServer {
  child: ChildProcess;
  origin: string;
  logs: () => string;
  exited: Promise<void>;
}

async function unusedPort(): Promise<number> {
  const reservation = createServer();
  await new Promise<void>((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const port = (reservation.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => {
    reservation.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

async function stopServer(server: RunningServer): Promise<void> {
  if (server.child.exitCode !== null || server.child.signalCode !== null) return;
  server.child.kill('SIGTERM');
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      server.child.kill('SIGKILL');
      reject(new Error('The test server did not stop within 10 seconds.'));
    }, 10_000);
    server.exited.then(() => { clearTimeout(timer); resolve(); }, (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

test('actual server processes serve frontend assets and retain Supabase data across restarts', { timeout: 120_000 }, async (t) => {
  const builtIndex = await readFile(indexUrl, 'utf8');
  const assetPaths = [...builtIndex.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
  assert.ok(assetPaths.some((asset) => asset.endsWith('.js')), 'Run the frontend build before the server restart test.');
  assert.ok(assetPaths.some((asset) => asset.endsWith('.css')));

  const database = new PGlite();
  const processes: RunningServer[] = [];
  let postgrestServer: Server | undefined;
  t.after(async () => {
    for (const process of processes.reverse()) await stopServer(process);
    if (postgrestServer) {
      postgrestServer.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        postgrestServer!.close((error) => error ? reject(error) : resolve());
      });
    }
    await database.close();
  });

  await database.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  await database.exec(await readFile(migrationUrl, 'utf8'));
  await database.exec('SET ROLE service_role');
  const loadDatabase = async () => {
    const result = await database.query<{ state: StoreSnapshot | null }>('SELECT public.book_dealer_load_state() AS state');
    return result.rows[0].state;
  };
  assert.equal(await loadDatabase(), null);

  const postgrest = express();
  postgrest.use(express.json({ limit: '10mb' }));
  postgrest.use((req, res, next) => {
    // Supabase sends new-format secret keys through apikey, not as JWTs.
    if (req.headers.apikey !== backendKey) {
      res.status(401).json({ code: '42501', message: 'Expected the local test secret key', details: null, hint: null });
      return;
    }
    next();
  });
  postgrest.post('/rest/v1/rpc/:functionName', async (req, res) => {
    try {
      if (req.params.functionName === 'book_dealer_load_state') {
        res.json(await loadDatabase());
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
      res.status(sqlError.code === '40001' ? 409 : sqlError.code === '22023' ? 400 : 503).json({
        code: sqlError.code ?? 'XX000', message: sqlError.message ?? 'Database failure',
        details: sqlError.detail ?? null, hint: sqlError.hint ?? null,
      });
    }
  });
  postgrestServer = postgrest.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    postgrestServer!.once('listening', resolve);
    postgrestServer!.once('error', reject);
  });
  const supabaseOrigin = `http://127.0.0.1:${(postgrestServer.address() as AddressInfo).port}`;

  async function launchServer(mode: 'production' | 'development') {
    const port = await unusedPort();
    // Inherit only operating-system settings. Every database setting is local test data.
    const environment: NodeJS.ProcessEnv = {};
    for (const name of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'ComSpec', 'TEMP', 'TMP',
      'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'LOCALAPPDATA', 'APPDATA', 'PATHEXT']) {
      if (process.env[name] !== undefined) environment[name] = process.env[name];
    }
    Object.assign(environment, {
      NODE_ENV: mode,
      PORT: String(port),
      DATA_STORE: 'supabase',
      SUPABASE_URL: supabaseOrigin,
      SUPABASE_SECRET_KEY: backendKey,
      SUPABASE_SERVICE_ROLE_KEY: backendKey,
      VITE_SUPABASE_URL: supabaseOrigin,
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_unused',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_unused',
      DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/unused',
      DISABLE_HMR: 'true',
    });
    const child = spawn(process.execPath, ['--import', 'tsx', serverPath], {
      cwd: projectRoot, env: environment, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let output = '';
    let spawnError: Error | undefined;
    child.stdout!.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr!.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    const exited = new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      child.once('error', (error) => { spawnError = error; resolve(); });
    });
    const server: RunningServer = { child, origin: `http://127.0.0.1:${port}`, logs: () => output, exited };
    processes.push(server);

    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`The test ${mode} server exited before becoming ready.\n${output}`);
      }
      try {
        const response = await fetch(`${server.origin}/api/database/status`, { signal: AbortSignal.timeout(1_000) });
        if (response.ok) {
          assert.deepEqual(await response.json(), { success: true, data: { mode: 'supabase', persistent: true } });
          assert.match(output, new RegExp(`Express server running on http://localhost:${port}`));
          assert.match(output, /Database: Supabase persistence enabled\./);
          assert.doesNotMatch(output, /Fatal:|Failed to start server/);
          return server;
        }
      } catch (error) {
        if (error instanceof assert.AssertionError) throw error;
      }
      await delay(100);
    }
    throw new Error(`The test ${mode} server did not become ready within 30 seconds.\n${output}`);
  }

  async function getApi<T>(server: RunningServer, endpoint: string): Promise<T> {
    const response = await fetch(`${server.origin}/api${endpoint}`, { signal: AbortSignal.timeout(5_000) });
    assert.equal(response.status, 200, `${endpoint} responds successfully`);
    const body = await response.json() as { success: boolean; data: T };
    assert.equal(body.success, true);
    return body.data;
  }

  let productionServer: RunningServer;
  let expectedStore = createEmptyStore();

  await t.test('production startup serves the built frontend and initializes an empty Supabase store', async () => {
    productionServer = await launchServer('production');
    const page = await fetch(`${productionServer.origin}/`, { signal: AbortSignal.timeout(5_000) });
    assert.equal(page.status, 200);
    assert.equal(await page.text(), builtIndex);
    for (const asset of assetPaths) {
      const response = await fetch(`${productionServer.origin}${asset}`, { signal: AbortSignal.timeout(5_000) });
      assert.equal(response.status, 200, `Built asset ${asset} is served`);
      const content = await response.text();
      assert.ok(content.length > 100);
      assert.doesNotMatch(content, /<!doctype html>/i);
    }
    for (const endpoint of ['/publishers', '/books', '/stationery', '/schools', '/orders',
      '/purchase-orders', '/inventory/movements', '/auth/staff', '/auth/logs']) {
      assert.deepEqual(await getApi(productionServer, endpoint), [], `${endpoint} has no sample records`);
    }
    const backup = await getApi<{ store: DataStore }>(productionServer, '/admin/backup');
    assert.deepEqual(backup.store, expectedStore);
    assert.deepEqual(await loadDatabase(), { revision: 1, data: expectedStore });
    const dashboard = await getApi<{ kpis: Record<string, number>; recentOrders: unknown[] }>(productionServer, '/dashboard');
    assert.ok(Object.values(dashboard.kpis).every((value) => value === 0));
    assert.deepEqual(dashboard.recentOrders, []);
  });

  await t.test('a profile API update survives a complete backend process restart without reseeding', async () => {
    const profile = { businessName: 'Restart Test Book Depot', phone: '+91 90000 00123', email: 'restart@example.test' };
    const response = await fetch(`${productionServer.origin}/api/business-profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(response.status, 200);
    expectedStore = { ...expectedStore, businessProfile: { ...expectedStore.businessProfile, ...profile } };
    assert.deepEqual(await response.json(), { success: true, data: expectedStore.businessProfile });
    assert.deepEqual(await loadDatabase(), { revision: 2, data: expectedStore });

    const previousPid = productionServer.child.pid;
    await stopServer(productionServer);
    await productionServer.exited;
    productionServer = await launchServer('production');
    assert.notEqual(productionServer.child.pid, previousPid);
    assert.deepEqual(await getApi(productionServer, '/business-profile'), expectedStore.businessProfile);
    assert.deepEqual((await getApi<{ store: DataStore }>(productionServer, '/admin/backup')).store, expectedStore);
    assert.deepEqual(await loadDatabase(), { revision: 2, data: expectedStore });
  });

  await t.test('development startup serves transformed frontend modules with the persisted database', async () => {
    await stopServer(productionServer);
    const developmentServer = await launchServer('development');
    const page = await fetch(`${developmentServer.origin}/`, { signal: AbortSignal.timeout(10_000) });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /\/src\/main\.tsx/);
    assert.match(html, /id="root"/);
    for (const module of ['/src/main.tsx', '/src/App.tsx']) {
      const response = await fetch(`${developmentServer.origin}${module}`, { signal: AbortSignal.timeout(15_000) });
      assert.equal(response.status, 200, `${module} compiles`);
      assert.match(response.headers.get('content-type') ?? '', /javascript/);
      const content = await response.text();
      assert.ok(content.length > 100);
      assert.doesNotMatch(content, /<!doctype html>/i);
    }
    assert.deepEqual(await getApi(developmentServer, '/business-profile'), expectedStore.businessProfile);
    assert.deepEqual(await loadDatabase(), { revision: 2, data: expectedStore });
    assert.doesNotMatch(developmentServer.logs(), /Internal server error|\[vite:css\]|Failed to resolve import/);
  });
});
