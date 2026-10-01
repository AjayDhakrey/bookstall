-- Run with the Supabase SQL editor or an administrative PostgreSQL connection.
-- The private schema preserves every existing record, nested field and array order.
-- Application IDs intentionally are not unique: the current app can reuse IDs.
BEGIN;

CREATE SCHEMA IF NOT EXISTS book_dealer;

CREATE TABLE IF NOT EXISTS book_dealer.store_meta (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  initialized boolean NOT NULL DEFAULT false
);

INSERT INTO book_dealer.store_meta (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS book_dealer.business_profile (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  payload jsonb NOT NULL CHECK (pg_catalog.jsonb_typeof(payload) = 'object')
);

-- Keep entities in separate tables while retaining their existing JSON contracts.
-- position is the durable array identity; app_id is available for SQL lookups.
DO $migration$
DECLARE
  entity_table text;
BEGIN
  FOREACH entity_table IN ARRAY ARRAY[
    'publishers', 'books', 'stationery', 'schools', 'orders',
    'purchase_orders', 'stock_movements', 'staff', 'login_logs'
  ] LOOP
    EXECUTE pg_catalog.format(
      'CREATE TABLE IF NOT EXISTS book_dealer.%I (
        position bigint PRIMARY KEY CHECK (position >= 1),
        payload jsonb NOT NULL CHECK (pg_catalog.jsonb_typeof(payload) = ''object''),
        app_id text GENERATED ALWAYS AS (payload ->> ''id'') STORED
      )',
      entity_table
    );
    EXECUTE pg_catalog.format(
      'CREATE INDEX IF NOT EXISTS %I ON book_dealer.%I (app_id)',
      entity_table || '_app_id_idx', entity_table
    );
    EXECUTE pg_catalog.format(
      'ALTER TABLE book_dealer.%I ENABLE ROW LEVEL SECURITY', entity_table
    );
  END LOOP;
END;
$migration$;

ALTER TABLE book_dealer.store_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_dealer.business_profile ENABLE ROW LEVEL SECURITY;

-- Only the backend can invoke these RPCs. Private tables have no client policies.
REVOKE ALL ON SCHEMA book_dealer FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA book_dealer FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA book_dealer FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA book_dealer
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA book_dealer
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.book_dealer_load_state()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_revision bigint;
  is_initialized boolean;
  profile jsonb;
BEGIN
  -- Hold a shared lock across all reads so a commit cannot mix store revisions.
  SELECT revision, initialized
  INTO current_revision, is_initialized
  FROM book_dealer.store_meta
  WHERE singleton = true
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book dealer metadata is missing; run the migration'
      USING ERRCODE = '55000';
  END IF;

  IF NOT is_initialized THEN
    RETURN NULL;
  END IF;

  SELECT payload INTO profile
  FROM book_dealer.business_profile
  WHERE singleton = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Initialized book dealer store has no business profile'
      USING ERRCODE = '55000';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'revision', current_revision,
    'data', pg_catalog.jsonb_build_object(
      'businessProfile', profile,
      'publishers', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.publishers),
      'books', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.books),
      'stationery', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.stationery),
      'schools', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.schools),
      'orders', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.orders),
      'purchaseOrders', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.purchase_orders),
      'stockMovements', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.stock_movements),
      'staff', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.staff),
      'loginLogs', (SELECT COALESCE(pg_catalog.jsonb_agg(payload ORDER BY position), '[]'::jsonb) FROM book_dealer.login_logs)
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.book_dealer_commit_state(
  p_state jsonb,
  p_expected_revision bigint
)
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_revision bigint;
  entity_table text;
  state_key text;
  state_keys constant text[] := ARRAY[
    'publishers', 'books', 'stationery', 'schools', 'orders',
    'purchaseOrders', 'stockMovements', 'staff', 'loginLogs'
  ];
BEGIN
  -- Validate the entire incoming snapshot before changing any table.
  IF pg_catalog.jsonb_typeof(p_state) IS DISTINCT FROM 'object'
    OR pg_catalog.jsonb_typeof(p_state -> 'businessProfile') IS DISTINCT FROM 'object'
    OR p_expected_revision IS NULL
    OR p_expected_revision < 0 THEN
    RAISE EXCEPTION 'Invalid book dealer state or expected revision'
      USING ERRCODE = '22023';
  END IF;

  FOREACH state_key IN ARRAY state_keys LOOP
    IF pg_catalog.jsonb_typeof(p_state -> state_key) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Book dealer state field % must be an array', state_key
        USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_array_elements(p_state -> state_key) AS entry(value)
      WHERE pg_catalog.jsonb_typeof(entry.value) IS DISTINCT FROM 'object'
    ) THEN
      RAISE EXCEPTION 'Book dealer state field % must contain objects', state_key
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  SELECT revision INTO current_revision
  FROM book_dealer.store_meta
  WHERE singleton = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book dealer metadata is missing; run the migration'
      USING ERRCODE = '55000';
  END IF;
  IF current_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'Book dealer store changed since revision %', p_expected_revision
      USING ERRCODE = '40001';
  END IF;

  INSERT INTO book_dealer.business_profile (singleton, payload)
  VALUES (true, p_state -> 'businessProfile')
  ON CONFLICT (singleton) DO UPDATE SET payload = EXCLUDED.payload;

  FOR entity_table, state_key IN
    SELECT mapping.table_name, mapping.json_key
    FROM (VALUES
      ('publishers', 'publishers'),
      ('books', 'books'),
      ('stationery', 'stationery'),
      ('schools', 'schools'),
      ('orders', 'orders'),
      ('purchase_orders', 'purchaseOrders'),
      ('stock_movements', 'stockMovements'),
      ('staff', 'staff'),
      ('login_logs', 'loginLogs')
    ) AS mapping(table_name, json_key)
  LOOP
    EXECUTE pg_catalog.format(
      'INSERT INTO book_dealer.%I (position, payload)
        SELECT entry.ordinality, entry.value
        FROM pg_catalog.jsonb_array_elements($1) WITH ORDINALITY AS entry(value, ordinality)
        ON CONFLICT (position) DO UPDATE SET payload = EXCLUDED.payload',
      entity_table
    ) USING p_state -> state_key;

    EXECUTE pg_catalog.format(
      'DELETE FROM book_dealer.%I WHERE position > pg_catalog.jsonb_array_length($1)',
      entity_table
    ) USING p_state -> state_key;
  END LOOP;

  UPDATE book_dealer.store_meta
  SET revision = current_revision + 1, initialized = true
  WHERE singleton = true;

  RETURN current_revision + 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.book_dealer_load_state()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.book_dealer_commit_state(jsonb, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_dealer_load_state() TO service_role;
GRANT EXECUTE ON FUNCTION public.book_dealer_commit_state(jsonb, bigint) TO service_role;

COMMENT ON SCHEMA book_dealer IS
  'Private book dealer store. Access only through service-role transaction RPCs.';
COMMENT ON FUNCTION public.book_dealer_commit_state(jsonb, bigint) IS
  'Atomically persist all dealer data with optimistic revision checking.';

NOTIFY pgrst, 'reload schema';
COMMIT;
