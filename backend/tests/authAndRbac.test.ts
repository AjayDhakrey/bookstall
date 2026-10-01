import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import { createApp } from '../src/app.js';
import { MemoryStateRepository } from '../src/repositories/memoryStateRepository.js';
import { createDefaultStore } from '../src/repositories/store.js';
import { signToken, verifyJwtToken } from '../src/middleware/authMiddleware.js';
import type { StaffPartner, LoginLogRecord, School, Book, Order } from '../src/types.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function startApi(t: TestContext) {
  const repository = new MemoryStateRepository();
  await repository.initialize(createDefaultStore());
  const server = createApp(repository).listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function request<T>(
    path: string,
    method = 'GET',
    payload?: unknown,
    token?: string,
    headers: Record<string, string> = {}
  ) {
    const response = await fetch(`${origin}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    return {
      status: response.status,
      headers: response.headers,
      body: ((await response.json().catch(() => ({}))) as ApiResponse<T>),
    };
  }

  async function success<T>(
    path: string,
    method = 'GET',
    payload?: unknown,
    status = 200,
    token?: string
  ): Promise<T> {
    const result = await request<T>(path, method, payload, token);
    assert.equal(result.status, status, `${method} ${path}: ${result.body.error ?? 'unexpected status'}`);
    assert.equal(result.body.success, true, `${method} ${path}`);
    return result.body.data;
  }

  return { request, success };
}

test('real authentication with bcrypt password verification and signed JWT', { timeout: 20_000 }, async (t) => {
  const api = await startApi(t);

  // 1. Password login with correct password (default admin123)
  const loginRes = await api.request<{ user: StaffPartner; token: string; log: LoginLogRecord }>('/auth/login', 'POST', {
    emailOrId: 'vikram@vanguardbooks.com',
    password: 'admin123',
    loginMethod: 'Password',
  });
  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.success, true);
  assert.ok(loginRes.body.data.token, 'Must return signed token');
  assert.equal((loginRes.body.data.user as any).passwordHash, undefined, 'passwordHash must never be exposed');

  // Verify decoded JWT
  const decoded = verifyJwtToken(loginRes.body.data.token);
  assert.ok(decoded);
  assert.equal(decoded.id, 'STF-01');
  assert.equal(decoded.role, 'Super Admin');

  // 2. Failed password login with incorrect password
  const failRes = await api.request('/auth/login', 'POST', {
    emailOrId: 'vikram@vanguardbooks.com',
    password: 'wrongpassword',
    loginMethod: 'Password',
  });
  assert.equal(failRes.status, 404);
  assert.equal(failRes.body.success, false);

  // 3. GET /auth/me with valid signed JWT
  const meRes = await api.request<StaffPartner>('/auth/me', 'GET', undefined, loginRes.body.data.token);
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.data?.id, 'STF-01');
  assert.equal(meRes.body.data?.role, 'Super Admin');

  // 4. GET /auth/me without token returns null (no fallback to staff[0])
  const unauthMe = await api.request<StaffPartner>('/auth/me', 'GET');
  assert.equal(unauthMe.status, 200);
  assert.equal(unauthMe.body.data, null);

  // 5. GET /auth/me with forged/invalid token returns null
  const invalidMe = await api.request<StaffPartner>('/auth/me', 'GET', undefined, 'invalid-bogus-token');
  assert.equal(invalidMe.status, 200);
  assert.equal(invalidMe.body.data, null);
});

test('RBAC role enforcement restricts unauthorized roles and permits authorized roles', { timeout: 20_000 }, async (t) => {
  const api = await startApi(t);

  // Login as Super Admin
  const adminLogin = await api.success<{ user: StaffPartner; token: string }>('/auth/login', 'POST', {
    emailOrId: 'vikram@vanguardbooks.com',
    password: 'admin123',
    loginMethod: 'Password',
  });

  // Login as Field Employee
  const fieldLogin = await api.success<{ user: StaffPartner; token: string }>('/auth/login', 'POST', {
    emailOrId: 'amitabh@vanguardbooks.com',
    password: 'admin123',
    loginMethod: 'Password',
  });

  // 1. Super Admin can access /auth/staff
  const adminStaff = await api.request('/auth/staff', 'GET', undefined, adminLogin.token);
  assert.equal(adminStaff.status, 200);
  assert.equal(adminStaff.body.success, true);

  // 2. Field Employee accessing /auth/staff is rejected with 403 Forbidden
  const fieldStaff = await api.request('/auth/staff', 'GET', undefined, fieldLogin.token);
  assert.equal(fieldStaff.status, 403);
  assert.equal(fieldStaff.body.success, false);
  assert.match(fieldStaff.body.error || '', /Forbidden.*Field Employee/i);

  // 3. Field Employee accessing /admin/backup is rejected with 403
  const fieldBackup = await api.request('/admin/backup', 'GET', undefined, fieldLogin.token);
  assert.equal(fieldBackup.status, 403);

  // 4. Unauthenticated request with x-enforce-auth header is rejected with 401
  const unauthStaff = await api.request('/auth/staff', 'GET', undefined, undefined, { 'x-enforce-auth': 'true' });
  assert.equal(unauthStaff.status, 401);

  // 5. Public routes (e.g. database status, school details, books) are accessible without auth
  const statusRes = await api.request('/database/status', 'GET');
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.body.success, true);

  const schoolRes = await api.request<School>('/schools/DPS01', 'GET');
  assert.equal(schoolRes.status, 200);
  assert.equal(schoolRes.body.data.code, 'DPS01');

  const booksRes = await api.request<Book[]>('/books', 'GET');
  assert.equal(booksRes.status, 200);
  assert.ok(Array.isArray(booksRes.body.data));
});

test('CORS headers allow requests from configured web origins and Vercel domains', { timeout: 20_000 }, async (t) => {
  const api = await startApi(t);

  const corsRes = await api.request('/database/status', 'OPTIONS', undefined, undefined, {
    Origin: 'https://bookstall.vercel.app',
    'Access-Control-Request-Method': 'GET',
  });
  assert.equal(corsRes.status, 204);
  assert.equal(corsRes.headers.get('access-control-allow-origin'), 'https://bookstall.vercel.app');
  assert.equal(corsRes.headers.get('access-control-allow-credentials'), 'true');
});

