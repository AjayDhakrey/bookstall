# Book Dealer Management System

The React frontend and Express API run together at <http://localhost:3000>. Supabase mode saves business data in PostgreSQL before returning a successful API response.

## Project layout

```text
frontend/src/               Pages, components, layouts, API client, context and hooks
backend/src/routes/         API route entry point
backend/src/controllers/    Existing REST request handlers
backend/src/services/       Existing business logic
backend/src/repositories/   Supabase persistence and explicit memory demo adapter
backend/src/middleware/     Request transactions and response helpers
backend/src/config/         Server environment and database configuration
shared/                     Shared domain and storage-status types
supabase/migrations/        PostgreSQL schema and transaction functions
scripts/                    Startup and database maintenance commands
backend/tests/              API and PostgreSQL integration tests
```

## Connect Supabase

1. Install dependencies with `npm install`.
2. Save the real project settings in `backend/.env`:

   ```dotenv
   DATA_STORE=supabase
   SUPABASE_URL=<project URL>
   SUPABASE_SECRET_KEY=<backend secret key>
   DATABASE_URL=<PostgreSQL connection string>
   PORT=3000
   ```

   `backend/.env.example` lists supported settings. A legacy service-role JWT can be set as `SUPABASE_SERVICE_ROLE_KEY` instead. A publishable/anon key cannot replace the backend key. Never put backend secrets in `VITE_` variables or commit credentials.

3. Run `npm run db:migrate` to apply `supabase/migrations/202610010001_book_dealer.sql` and verify its tables, indexes, constraints and permissions. The migration preserves existing records and can be rerun.
4. Run `npm run db:check`, then `npm run db:verify`. Verification commits identical business data and reloads through an independent Supabase client. It advances the database revision without inserting test records or changing business data.
5. Run `npm run dev` and open <http://localhost:3000>. Settings shows whether the server uses Supabase or memory.

Alternatively, run the migration in the Supabase SQL Editor. Runtime needs only `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; `DATABASE_URL` is used for administrative migration and schema inspection. `npm run db:schema` checks the schema without applying SQL. Replace the connection string's password placeholder with your actual database password and URL-encode special characters.

The official [Supabase CA certificate](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt) is included in `backend/certs/prod-ca-2021.crt` and used automatically for Supabase PostgreSQL hosts. `DATABASE_SSL_CA_FILE` can override the certificate path. Certificate and hostname verification stay enabled.

The server reads `backend/.env.local`, `backend/.env`, root `.env.local`, then root `.env`, without overwriting process environment variables. Partial Supabase configuration stops startup; it does not silently switch to memory.

## Existing data and first setup

A new Supabase database starts with empty collections and a blank business profile. Startup inserts no sample publishers, books, schools, staff, orders or payments. Existing database data is never reseeded on restart.

Before stopping an older memory server, export real business data using Settings > Database Backup. Restore that backup through the same screen after connecting Supabase. For a fresh start, enter your business profile and actual staff and catalogue using the existing screens. Login requires an actual staff record. The existing explicit factory-demo reset remains available; use it only when you intend to replace data with the original sample dataset.

The app retains its existing email/ID/name login behavior. It does not use Supabase Auth or check passwords. Its displayed role matrix does not enforce backend authorization. Supabase table restrictions do not add application role enforcement.

## Database layout

The private `book_dealer` schema contains `store_meta`, `business_profile`, `publishers`, `books`, `stationery`, `schools`, `orders`, `purchase_orders`, `stock_movements`, `staff` and `login_logs`.

Entity records retain their existing JSONB payloads, with ordered primary keys and indexed generated application IDs. Order items, payments, returns and school mappings stay nested to preserve existing REST and backup contracts. References remain in those payloads; no foreign keys are introduced because the existing app can reuse IDs and retain records referencing removed catalogue items.

The backend calls two service-role-only PostgreSQL functions through the Supabase client. `book_dealer_load_state` reads a consistent snapshot; `book_dealer_commit_state` atomically saves business state with revision checking. Tables have row-level security and no direct anonymous/authenticated client access. Conflicting writes return HTTP 409; unavailable reads/writes return HTTP 503.

For administrative inspection:

```sql
SELECT app_id, payload ->> 'name' AS name,
       payload ->> 'currentStock' AS current_stock
FROM book_dealer.books
ORDER BY position;
```

The compatibility adapter loads a full business snapshot per API request. Large datasets will need a separate migration to per-entity queries and business transactions.

## Run and verify

- `npm run dev` starts the API and Vite frontend together.
- `npm run lint` checks frontend, backend, scripts and tests.
- `npm test` runs local API, PostgreSQL migration and Supabase-client integration tests. Fixtures stay in local test databases.
- `npm run build` creates `frontend/dist` and `backend/dist`.
- `npm start` serves the built app; production defaults to Supabase.

Set `PORT` to use another port. The frontend calls `/api` by default; `VITE_API_BASE_URL` can point to another API. Set `DATA_STORE=memory` explicitly for the original sample-data demo. Memory changes reset on restart.
