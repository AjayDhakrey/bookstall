import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { loadServerEnvironment, projectRoot } from '../backend/src/config/environment.js';
import { createConfiguredRepository } from '../backend/src/config/database.js';
import { createEmptyStore } from '../backend/src/repositories/store.js';
import { verifySchema } from './verifySchema.js';

loadServerEnvironment();

async function withPostgres(operation: (client: pg.Client) => Promise<void>) {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error('Add DATABASE_URL to backend/.env, or run the migration in the Supabase SQL Editor.');
  }
  let connectionUrl: URL;
  try { connectionUrl = new URL(connectionString); }
  catch { throw new Error('DATABASE_URL must be a valid PostgreSQL connection string.'); }
  if (!['postgres:', 'postgresql:'].includes(connectionUrl.protocol)) {
    throw new Error('Supabase uses PostgreSQL. DATABASE_URL must start with postgresql://.');
  }
  let databasePassword: string;
  try { databasePassword = decodeURIComponent(connectionUrl.password); }
  catch { throw new Error('URL-encode special characters in the DATABASE_URL password.'); }
  if (/^\[YOUR[-_]PASSWORD\]$/i.test(databasePassword) || /^<(?:(?:your[-_ ])?(?:database[-_ ])?password)>$/i.test(databasePassword)) {
    throw new Error('Replace the password placeholder in DATABASE_URL with your actual Supabase database password.');
  }
  const projectUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (projectUrl) {
    let projectHost: string;
    try { projectHost = new URL(projectUrl).hostname; }
    catch { throw new Error('SUPABASE_URL must be a valid project URL.'); }
    if (/^[a-z0-9]+\.supabase\.co$/i.test(projectHost)) {
      const projectRef = projectHost.split('.')[0];
      const directHost = connectionUrl.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
      const pooledRef = connectionUrl.hostname.endsWith('.pooler.supabase.com')
        ? decodeURIComponent(connectionUrl.username).split('.').at(-1) : undefined;
      if ((directHost && directHost[1] !== projectRef) || (pooledRef && pooledRef !== projectRef)) {
        throw new Error('DATABASE_URL and SUPABASE_URL refer to different projects. Copy the connection string from this Supabase project.');
      }
    }
  }
  // Configure certificate verification explicitly rather than inheriting URL SSL overrides.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) connectionUrl.searchParams.delete(key);
  const isSupabaseHost = connectionUrl.hostname.endsWith('.supabase.co') || connectionUrl.hostname.endsWith('.pooler.supabase.com');
  const caFile = process.env.DATABASE_SSL_CA_FILE || (isSupabaseHost ? 'backend/certs/prod-ca-2021.crt' : undefined);
  const ca = caFile ? await readFile(path.resolve(projectRoot, caFile), 'utf8') : undefined;
  const client = new pg.Client({
    connectionString: connectionUrl.toString(),
    connectionTimeoutMillis: 15000,
    statement_timeout: 30000,
    query_timeout: 30000,
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  });
  try {
    await client.connect();
    await operation(client);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Database schema verification failed.')) throw error;
    const code = (error as { code?: string }).code;
    if (code === '28P01') throw new Error('Supabase rejected the database password. Update DATABASE_URL using the actual database password from your project.');
    throw new Error(`Database operation failed${code && /^[A-Z0-9_]+$/i.test(code) ? ` (${code})` : ''}. Check the PostgreSQL URL, network access and SSL certificate.`);
  } finally {
    await client.end();
  }
}

async function inspectSchema(client: pg.Client) {
  const schema = await verifySchema(client);
  console.log(`Schema verified: ${schema.tables} tables, ${schema.primaryKeys} primary keys, ${schema.checkConstraints} checks, ${schema.applicationIdIndexes} application-ID indexes, ${schema.rowSecurityTables} tables with RLS and ${schema.serviceRoleFunctions} restricted functions.`);
  console.log('Existing relationships are preserved in JSON payloads; no new foreign keys were introduced.');
}

async function migrate() {
  const migration = await readFile(path.join(projectRoot, 'supabase/migrations/202610010001_book_dealer.sql'), 'utf8');
  await withPostgres(async (client) => {
    await client.query(migration);
    console.log('Book dealer schema applied. Existing data was preserved.');
    await inspectSchema(client);
  });
}

async function check(verify: boolean) {
  const repository = createConfiguredRepository({ ...process.env, DATA_STORE: 'supabase' });
  await repository.initialize(createEmptyStore());
  const snapshot = await repository.load();
  if (verify) {
    // Commit identical business data, then load through a fresh independent client.
    const revision = await repository.save(snapshot.data, snapshot.revision);
    const independent = createConfiguredRepository({ ...process.env, DATA_STORE: 'supabase' });
    const reloaded = await independent.load();
    if (reloaded.revision !== revision) throw new Error('Another writer changed the data during verification; try again.');
    if (!isDeepStrictEqual(reloaded.data, snapshot.data)) throw new Error('Database reload did not match the saved data.');
    console.log('Supabase persistence verified with a fresh connection. Business data was unchanged.');
  } else {
    console.log(`Supabase connected. Revision ${snapshot.revision}; ${snapshot.data.books.length} books, ${snapshot.data.orders.length} orders.`);
  }
}

async function seed() {
  const repository = createConfiguredRepository({ ...process.env, DATA_STORE: process.env.DATA_STORE || 'supabase' });
  const defaultData = createDefaultStore();
  await repository.initialize(defaultData);
  const snapshot = await repository.load();
  await repository.save(defaultData, snapshot.revision);
  console.log(`Database seeded with practical benchmark data:`);
  console.log(`- ${defaultData.publishers.length} Publishers`);
  console.log(`- ${defaultData.books.length} Books & ${defaultData.stationery.length} Stationery items`);
  console.log(`- ${defaultData.schools.length} Partner Schools & Booksets`);
  console.log(`- ${defaultData.orders.length} Real Sample Orders with Payment Records`);
  console.log(`- ${defaultData.purchaseOrders.length} Purchase Orders`);
  console.log(`- ${defaultData.staff.length} Staff Accounts (Password: admin123)`);
}

try {
  const command = process.argv[2];
  if (command === 'migrate') await migrate();
  else if (command === 'schema') await withPostgres(inspectSchema);
  else if (command === 'check' || command === 'verify') await check(command === 'verify');
  else if (command === 'seed') await seed();
  else throw new Error('Use npm run db:migrate, db:schema, db:check, db:verify, or db:seed.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Database command failed.');
  process.exitCode = 1;
}
