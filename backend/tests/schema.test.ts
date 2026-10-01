import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createDefaultStore, type DataStore } from '../src/repositories/store.js';

const migrationUrl = new URL('../../supabase/migrations/202610010001_book_dealer.sql', import.meta.url);

test('Supabase migration preserves dealer state and restricts database access', async (t) => {
  const database = new PGlite();
  const migration = await readFile(migrationUrl, 'utf8');
  const initialState = createDefaultStore();
  let expectedState = initialState;
  let expectedRevision = 0;

  const load = async () => {
    const result = await database.query<{ state: { revision: number; data: DataStore } | null }>(
      'SELECT public.book_dealer_load_state() AS state',
    );
    return result.rows[0].state;
  };
  const commit = async (state: unknown, revision = expectedRevision) => {
    const result = await database.query<{ revision: number }>(
      'SELECT public.book_dealer_commit_state($1::jsonb, $2::bigint) AS revision',
      [JSON.stringify(state), revision],
    );
    return result.rows[0].revision;
  };
  const assertSqlState = (code: string) => (error: unknown) => {
    assert.equal((error as { code?: string }).code, code);
    return true;
  };

  try {
    await database.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');

    await t.test('migration runs and an uninitialized store loads as null', async () => {
      await database.exec(migration);
      assert.equal(await load(), null);
      const tables = await database.query<{ count: number }>(
        "SELECT count(*)::integer AS count FROM pg_catalog.pg_tables WHERE schemaname = 'book_dealer' AND rowsecurity",
      );
      assert.equal(tables.rows[0].count, 11);
    });

    await t.test('service_role can commit and load an exact default-store snapshot', async () => {
      await database.exec('SET ROLE service_role');
      try {
        expectedRevision = await commit(initialState);
        assert.equal(expectedRevision, 1);
        assert.deepEqual(await load(), { revision: expectedRevision, data: initialState });
      } finally {
        await database.exec('RESET ROLE');
      }
    });

    await t.test('duplicate application IDs, array order and nested fields survive a commit', async () => {
      const changed = structuredClone(initialState);
      changed.books = [changed.books[2], changed.books[0], { ...changed.books[0], name: 'Same ID, separate record' }];
      changed.orders.push({ ...structuredClone(changed.orders[0]), notes: 'Same order ID must survive' });
      changed.schools[0].classes.reverse();
      changed.schools[0].bookMappings.reverse();
      changed.orders[0].payments.push({
        id: changed.orders[0].payments[0].id,
        date: '2026-10-01 10:30',
        amount: 25,
        method: 'Cash',
        collectedBy: 'Schema test',
        note: 'Nested duplicate ID also survives',
      });
      expectedRevision = await commit(changed);
      expectedState = changed;
      assert.deepEqual(await load(), { revision: expectedRevision, data: changed });
      const duplicates = await database.query<{ count: number }>(
        'SELECT count(*)::integer AS count FROM book_dealer.books WHERE app_id = $1',
        [changed.books[1].id],
      );
      assert.equal(duplicates.rows[0].count, 2);
    });

    await t.test('stale writes fail without overwriting the committed store', async () => {
      await assert.rejects(commit(initialState, expectedRevision - 1), assertSqlState('40001'));
      assert.deepEqual(await load(), { revision: expectedRevision, data: expectedState });
    });

    await t.test('invalid snapshots fail before mutating any table', async () => {
      const invalid = structuredClone(expectedState) as unknown as Record<string, unknown>;
      invalid.businessProfile = { businessName: 'Must not be persisted' };
      invalid.publishers = [];
      invalid.loginLogs = [null];
      await assert.rejects(commit(invalid), assertSqlState('22023'));
      const missingArray = { ...expectedState } as Partial<DataStore>;
      delete missingArray.orders;
      await assert.rejects(commit(missingArray), assertSqlState('22023'));
      await assert.rejects(commit(null), assertSqlState('22023'));
      assert.deepEqual(await load(), { revision: expectedRevision, data: expectedState });
    });

    await t.test('a database constraint failure rolls back earlier writes in the RPC', async () => {
      await database.exec("ALTER TABLE book_dealer.login_logs ADD CONSTRAINT schema_test_fail CHECK (payload ->> 'userName' <> 'Rollback sentinel')");
      const invalid = structuredClone(expectedState);
      invalid.businessProfile.businessName = 'Must roll back';
      invalid.publishers = [];
      invalid.loginLogs[0].userName = 'Rollback sentinel';
      await assert.rejects(commit(invalid), assertSqlState('23514'));
      assert.deepEqual(await load(), { revision: expectedRevision, data: expectedState });
      await database.exec('ALTER TABLE book_dealer.login_logs DROP CONSTRAINT schema_test_fail');
    });

    await t.test('migration can run again without resetting data or revisions', async () => {
      await database.exec(migration);
      assert.deepEqual(await load(), { revision: expectedRevision, data: expectedState });
    });

    await t.test('empty arrays and deleted positions persist correctly', async () => {
      const shortened = structuredClone(expectedState);
      shortened.books = [shortened.books[1]];
      shortened.orders = [];
      shortened.stationery = [];
      shortened.loginLogs = [];
      expectedRevision = await commit(shortened);
      expectedState = shortened;
      assert.deepEqual(await load(), { revision: expectedRevision, data: shortened });
      const positions = await database.query<{ position: number }>(
        'SELECT position::integer AS position FROM book_dealer.books ORDER BY position',
      );
      assert.deepEqual(positions.rows, [{ position: 1 }]);
    });

    for (const role of ['anon', 'authenticated']) {
      await t.test(`${role} cannot call RPCs or access private records`, async () => {
        await database.exec(`SET ROLE ${role}`);
        try {
          await assert.rejects(load(), assertSqlState('42501'));
          await assert.rejects(commit(expectedState), assertSqlState('42501'));
          await assert.rejects(database.query('SELECT * FROM book_dealer.staff'), assertSqlState('42501'));
        } finally {
          await database.exec('RESET ROLE');
        }
        assert.deepEqual(await load(), { revision: expectedRevision, data: expectedState });
      });
    }
  } finally {
    await database.close();
  }
});
