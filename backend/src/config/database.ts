import { createClient } from '@supabase/supabase-js';
import { MemoryStateRepository } from '../repositories/memoryStateRepository.js';
import { SupabaseStateRepository } from '../repositories/supabaseStateRepository.js';
import type { StateRepository } from '../repositories/stateRepository.js';

export function createConfiguredRepository(env = process.env): StateRepository {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL)?.trim();
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  const mode = env.DATA_STORE || ((url || key || env.NODE_ENV === 'production') ? 'supabase' : 'memory');
  if (mode === 'memory') return new MemoryStateRepository();
  if (mode !== 'supabase') throw new Error('DATA_STORE must be supabase or memory.');
  if (!url || !key) {
    throw new Error('Save SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env before starting Supabase mode.');
  }
  let parsedUrl: URL;
  try { parsedUrl = new URL(url); } catch { throw new Error('SUPABASE_URL must be a valid project URL.'); }
  if (!['https:', 'http:'].includes(parsedUrl.protocol)) throw new Error('SUPABASE_URL must use HTTP or HTTPS.');
  let isBackendKey = key.startsWith('sb_secret_');
  if (!isBackendKey) {
    try { isBackendKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; }
    catch { /* Invalid or publishable keys cannot access the private database. */ }
  }
  if (!isBackendKey) throw new Error('Use a Supabase secret/service_role key in the backend, not a publishable/anon key.');
  return new SupabaseStateRepository(createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init,
      signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    }) },
  }));
}
