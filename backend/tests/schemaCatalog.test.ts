import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { verifySchema } from '../../scripts/verifySchema.js';

test('catalog verification checks the actual migration and rejects insecure or incomplete schema objects', async (t) => {
  const database = new PGlite();
  const migration = await readFile(new URL('../../supabase/migrations/202610010001_book_dealer.sql', import.meta.url), 'utf8');
  const client = { query: async (sql: string) => database.query<Record<string, unknown>>(sql) };
  try {
    await database.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
    await database.exec(migration);
    await t.test('all expected objects pass without inserting business records', async () => {
      assert.deepEqual(await verifySchema(client), {
        tables: 11,
        primaryKeys: 11,
        checkConstraints: 22,
        applicationIdIndexes: 9,
        rowSecurityTables: 11,
        serviceRoleFunctions: 2,
        relationStorage: 'existing JSON payloads',
        foreignKeys: 0,
      });
    });
    const alterations = [
      ['missing application-ID index', 'DROP INDEX book_dealer.books_app_id_idx', 'CREATE INDEX books_app_id_idx ON book_dealer.books (app_id)'],
      ['disabled row security', 'ALTER TABLE book_dealer.books DISABLE ROW LEVEL SECURITY', 'ALTER TABLE book_dealer.books ENABLE ROW LEVEL SECURITY'],
      ['private schema granted to a client role', 'GRANT USAGE ON SCHEMA book_dealer TO anon', 'REVOKE ALL ON SCHEMA book_dealer FROM anon'],
      ['direct column access granted to a client role', 'GRANT SELECT (payload) ON book_dealer.staff TO authenticated', 'REVOKE SELECT (payload) ON book_dealer.staff FROM authenticated'],
      ['RPC execution granted to a client role', 'GRANT EXECUTE ON FUNCTION public.book_dealer_load_state() TO authenticated', 'REVOKE ALL ON FUNCTION public.book_dealer_load_state() FROM authenticated'],
      ['unsafe RPC search path', "ALTER FUNCTION public.book_dealer_load_state() SET search_path = public", "ALTER FUNCTION public.book_dealer_load_state() SET search_path = ''"],
      ['missing payload constraint', 'ALTER TABLE book_dealer.books DROP CONSTRAINT books_payload_check', "ALTER TABLE book_dealer.books ADD CONSTRAINT books_payload_check CHECK (jsonb_typeof(payload) = 'object')"],
    ];
    for (const [description, change, restore] of alterations) {
      await t.test(`rejects ${description}`, async () => {
        await database.exec(change);
        try {
          await assert.rejects(verifySchema(client), /Database schema verification failed/);
        } finally {
          await database.exec(restore);
        }
        await verifySchema(client);
      });
    }
  } finally {
    await database.close();
  }
});
