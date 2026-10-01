/** A minimal interface supported by pg.Client and other PostgreSQL query clients. */
export interface SchemaQueryClient {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface SchemaVerification {
  tables: number;
  primaryKeys: number;
  checkConstraints: number;
  applicationIdIndexes: number;
  rowSecurityTables: number;
  serviceRoleFunctions: number;
  relationStorage: 'existing JSON payloads';
  foreignKeys: number;
}

const entityTables = [
  'publishers', 'books', 'stationery', 'schools', 'orders',
  'purchase_orders', 'stock_movements', 'staff', 'login_logs',
] as const;

interface Column {
  name: string;
  type: string;
  notNull: boolean;
  generated: string;
  expression: string | null;
}

interface Constraint {
  type: string;
  columns: string[] | null;
  expression: string | null;
  validated: boolean;
}

interface Index {
  name: string;
  unique: boolean;
  valid: boolean;
  ready: boolean;
  method: string;
  keyCount: number;
  attributeCount: number;
  key: string;
  partial: boolean;
}

interface Table {
  name: string;
  rowSecurity: boolean;
  columns: Column[];
  constraints: Constraint[];
  indexes: Index[];
  unsafeAcl: boolean;
  clientAccess: boolean;
}

interface Routine {
  name: string;
  argumentTypes: string;
  returnType: string;
  securityDefiner: boolean;
  volatility: string;
  language: string;
  config: string[] | null;
  unsafeAcl: boolean;
  serviceRoleExecute: boolean;
  clientExecute: boolean;
}

function requireCondition(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error('Database schema verification failed. Run the book dealer migration and check database permissions.');
  }
}

function normalizeExpression(expression: string | null): string {
  return (expression ?? '')
    .replaceAll('pg_catalog.', '')
    .replaceAll('::text', '')
    .replace(/[\s()\"]/g, '');
}

/**
 * Verify the migration's catalog objects without reading business records or credentials.
 * Entity relationships retain the existing JSON contracts; the migration defines no SQL FKs.
 */
export async function verifySchema(client: SchemaQueryClient): Promise<SchemaVerification> {
  let catalog: Record<string, unknown>[];
  try {
    const result = await client.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM pg_catalog.pg_namespace n
          WHERE n.nspname = 'book_dealer'
        ) AS "schemaExists",
        EXISTS (
          SELECT 1 FROM pg_catalog.pg_namespace n,
            LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl, pg_catalog.acldefault('n', n.nspowner))) acl
          WHERE n.nspname = 'book_dealer' AND acl.grantee = 0
        ) AS "publicSchemaAccess",
        EXISTS (
          SELECT 1 FROM pg_catalog.pg_namespace n
          WHERE n.nspname = 'book_dealer'
            AND (pg_catalog.has_schema_privilege('anon', n.oid, 'USAGE,CREATE')
              OR pg_catalog.has_schema_privilege('authenticated', n.oid, 'USAGE,CREATE'))
        ) AS "clientSchemaAccess",
        COALESCE((
          SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
            'name', c.relname,
            'rowSecurity', c.relrowsecurity,
            'columns', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
              'name', a.attname, 'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
              'notNull', a.attnotnull, 'generated', a.attgenerated,
              'expression', pg_catalog.pg_get_expr(d.adbin, d.adrelid)
            ) ORDER BY a.attnum)
              FROM pg_catalog.pg_attribute a
              LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
              WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped),
            'constraints', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
              'type', k.contype, 'validated', k.convalidated,
              'expression', pg_catalog.pg_get_expr(k.conbin, k.conrelid),
              'columns', (SELECT pg_catalog.jsonb_agg(a.attname ORDER BY key.ordinality)
                FROM pg_catalog.unnest(k.conkey) WITH ORDINALITY AS key(number, ordinality)
                JOIN pg_catalog.pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = key.number)
            )) FROM pg_catalog.pg_constraint k WHERE k.conrelid = c.oid),
            'indexes', (SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
              'name', ic.relname, 'unique', i.indisunique, 'valid', i.indisvalid,
              'ready', i.indisready, 'method', am.amname, 'keyCount', i.indnkeyatts,
              'attributeCount', i.indnatts, 'key', pg_catalog.pg_get_indexdef(i.indexrelid, 1, true),
              'partial', i.indpred IS NOT NULL
            )) FROM pg_catalog.pg_index i
              JOIN pg_catalog.pg_class ic ON ic.oid = i.indexrelid
              JOIN pg_catalog.pg_am am ON am.oid = ic.relam WHERE i.indrelid = c.oid),
            'unsafeAcl', EXISTS (
              SELECT 1 FROM pg_catalog.aclexplode(COALESCE(c.relacl, pg_catalog.acldefault('r', c.relowner))) acl
              WHERE acl.grantee = 0),
            'clientAccess', (
              pg_catalog.has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
              OR pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
              OR pg_catalog.has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
              OR pg_catalog.has_any_column_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))
          ) ORDER BY c.relname)
          FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'book_dealer' AND c.relkind IN ('r', 'p')
        ), '[]'::jsonb) AS tables,
        COALESCE((
          SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
            'name', p.proname, 'argumentTypes', pg_catalog.oidvectortypes(p.proargtypes),
            'returnType', pg_catalog.format_type(p.prorettype, NULL),
            'securityDefiner', p.prosecdef, 'volatility', p.provolatile,
            'language', l.lanname, 'config', p.proconfig,
            'unsafeAcl', EXISTS (
              SELECT 1 FROM pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
              WHERE acl.grantee <> p.proowner
                AND acl.grantee <> (SELECT r.oid FROM pg_catalog.pg_roles r WHERE r.rolname = 'service_role')),
            'serviceRoleExecute', pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE'),
            'clientExecute', (pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
              OR pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE'))
          ) ORDER BY p.proname)
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          JOIN pg_catalog.pg_language l ON l.oid = p.prolang
          WHERE n.nspname = 'public'
            AND p.proname IN ('book_dealer_load_state', 'book_dealer_commit_state')
        ), '[]'::jsonb) AS functions
    `);
    catalog = result.rows;
  } catch {
    throw new Error('Database schema verification could not read the PostgreSQL catalog. Check the database connection and migration permissions.');
  }

  const result = catalog[0];
  requireCondition(result?.schemaExists && !result.publicSchemaAccess && !result.clientSchemaAccess);
  const tables = result.tables as Table[];
  const functions = result.functions as Routine[];
  requireCondition(Array.isArray(tables) && tables.length === 11);
  requireCondition(Array.isArray(functions) && functions.length === 2);

  let checks = 0;
  let foreignKeys = 0;
  for (const name of ['store_meta', 'business_profile', ...entityTables]) {
    const table = tables.find((entry) => entry.name === name);
    requireCondition(table && table.rowSecurity && !table.unsafeAcl && !table.clientAccess);
    requireCondition(Array.isArray(table.columns) && Array.isArray(table.constraints));
    const entity = (entityTables as readonly string[]).includes(name);
    const expectedColumns = entity
      ? [['position', 'bigint', true], ['payload', 'jsonb', true], ['app_id', 'text', false]] as const
      : name === 'store_meta'
        ? [['singleton', 'boolean', true], ['revision', 'bigint', true], ['initialized', 'boolean', true]] as const
        : [['singleton', 'boolean', true], ['payload', 'jsonb', true]] as const;
    requireCondition(table.columns.length === expectedColumns.length);
    for (const [columnName, type, notNull] of expectedColumns) {
      const column = table.columns.find((entry) => entry.name === columnName);
      requireCondition(column && column.type === type && column.notNull === notNull);
      if (columnName === 'app_id') {
        requireCondition(column.generated === 's' && normalizeExpression(column.expression) === "payload->>'id'");
      } else {
        requireCondition(column.generated === '');
      }
    }

    const primaryKeys = table.constraints.filter((entry) => entry.type === 'p');
    requireCondition(primaryKeys.length === 1 && primaryKeys[0].validated);
    requireCondition(primaryKeys[0].columns?.length === 1
      && primaryKeys[0].columns[0] === (entity ? 'position' : 'singleton'));
    const requiredChecks = entity ? ['position>=1', "jsonb_typeofpayload='object'"]
      : name === 'store_meta' ? ['singleton', 'revision>=0']
        : ['singleton', "jsonb_typeofpayload='object'"];
    for (const expression of requiredChecks) {
      requireCondition(table.constraints.some((entry) => entry.type === 'c' && entry.validated
        && normalizeExpression(entry.expression) === expression));
      checks += 1;
    }
    foreignKeys += table.constraints.filter((entry) => entry.type === 'f').length;
    if (entity) {
      const index = table.indexes.find((entry) => entry.name === `${name}_app_id_idx`);
      requireCondition(index && !index.unique && index.valid && index.ready && !index.partial
        && index.method === 'btree' && index.keyCount === 1 && index.attributeCount === 1
        && normalizeExpression(index.key) === 'app_id');
      // Duplicate application IDs are part of the existing data contract.
      requireCondition(!table.indexes.some((entry) => entry.unique && normalizeExpression(entry.key) === 'app_id'));
    }
  }

  for (const routine of functions) {
    const load = routine.name === 'book_dealer_load_state';
    requireCondition(routine.argumentTypes === (load ? '' : 'jsonb, bigint')
      && routine.returnType === (load ? 'jsonb' : 'bigint'));
    requireCondition(routine.securityDefiner && routine.volatility === 'v' && routine.language === 'plpgsql');
    requireCondition(routine.config?.some((setting) => setting === 'search_path=""' || setting === 'search_path=')
      && !routine.unsafeAcl && routine.serviceRoleExecute && !routine.clientExecute);
  }

  return {
    tables: tables.length,
    primaryKeys: tables.length,
    checkConstraints: checks,
    applicationIdIndexes: entityTables.length,
    rowSecurityTables: tables.length,
    serviceRoleFunctions: functions.length,
    relationStorage: 'existing JSON payloads',
    foreignKeys,
  };
}
