import assert from 'node:assert/strict';
import test from 'node:test';
import { createConfiguredRepository } from '../src/config/database.js';

test('production and partial database configuration never silently fall back to memory', () => {
  for (const env of [
    { NODE_ENV: 'production' },
    { SUPABASE_URL: 'https://example.supabase.co' },
    { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' },
    { SUPABASE_SECRET_KEY: 'sb_secret_test' },
  ]) {
    assert.throws(() => createConfiguredRepository(env), /Save SUPABASE_URL and SUPABASE_SECRET_KEY/);
  }
});

test('publishable keys and malformed project URLs fail without disclosing supplied values', () => {
  const publishableKey = 'sb_publishable_private_test_marker';
  assert.throws(() => createConfiguredRepository({
    SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: publishableKey,
  }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /secret\/service_role key/);
    assert.ok(!error.message.includes(publishableKey));
    return true;
  });
  const malformedUrl = 'private-url-test-marker';
  assert.throws(() => createConfiguredRepository({
    SUPABASE_URL: malformedUrl, SUPABASE_SECRET_KEY: 'sb_secret_test',
  }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /valid project URL/);
    assert.ok(!error.message.includes(malformedUrl));
    return true;
  });
});

test('a backend secret selects Supabase and memory demo mode must be explicit when configured', () => {
  const configured = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test' };
  assert.equal(createConfiguredRepository(configured).mode, 'supabase');
  assert.equal(createConfiguredRepository({ ...configured, DATA_STORE: 'memory' }).mode, 'memory');
  assert.equal(createConfiguredRepository({}).mode, 'memory');
  assert.throws(() => createConfiguredRepository({ DATA_STORE: 'invalid' }), /supabase or memory/);
});
