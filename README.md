# Smart Cafeteria Ordering System (Kantin)

Kantin is a cafeteria ordering application for students and cafeteria staff, built with Next.js, React, and Supabase (PostgreSQL + Supabase Auth). This README provides a project overview and the database/API runbook for the MVP (spec: *Database Schema SDS R2*).

- [Project overview and progress](#project-overview-and-progress)
- [Cafeteria dashboard overview](<./CAFETERIA DASHBOARD.md>)
- [Detailed cafeteria dashboard progress](./CAFETERIA_DASHBOARD_PROGRESS.md)
- [1. Design in one page](#1-design-in-one-page)
- [2. Repository layout](#2-repository-layout)
- [3. Applying the migrations](#3-applying-the-migrations)
- [4. Cafe registration and staff access](#4-cafe-registration-and-staff-access)
- [5. API contract](#5-api-contract)
- [6. Error codes](#6-error-codes)
- [7. Business-rule reference](#7-business-rule-reference)
- [8. Running the validation checklist](#8-running-the-validation-checklist)
- [9. Secrets](#9-secrets)
- [10. Deviations, additions and open items](#10-deviations-additions-and-open-items)

---

## Project overview and progress

Kantin brings student ordering and cafeteria operations together in one application:

- **Student experience:** discover cafeterias and dishes, manage a cart, place orders, follow order status, review order history, and manage an account.
- **Cafeteria operations:** manage incoming orders and fulfillment, maintain the menu and daily availability, configure operating hours, and review order history and analytics.
- **Technology:** Next.js 16, React 19, Supabase Auth, PostgreSQL, and database RPC functions for protected operations.

The cafeteria dashboard is implemented across staff registration and access, overview, order management, menu, inventory, hours, order history, analytics, and settings. Its detailed features and recorded build verification are in [CAFETERIA DASHBOARD.md](<./CAFETERIA DASHBOARD.md>) and [CAFETERIA_DASHBOARD_PROGRESS.md](./CAFETERIA_DASHBOARD_PROGRESS.md).

### Run the application

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Apply the Supabase migrations as described in section 3 below.
4. Start the development server with `npm run dev`.

For student email OTP configuration, see [AUTH_SETUP.md](./AUTH_SETUP.md). Keep `.env.local` and any service-role credentials out of version control; only the public anon key belongs in the browser.

### Current project status

The repository includes student ordering workflows, cafeteria staff workflows, Supabase migrations, and a database validation checklist. The dashboard progress report records a successful production build with 26 routes generated. Before release or deployment, configure the target Supabase project, apply and validate its migrations, and smoke-test the main student and staff workflows.

---

## Database & API Runbook

## 1. Design in one page

**Clients can read, but never write.** `anon` has no table access. `authenticated` has `SELECT` only, filtered by RLS. There are no `INSERT`/`UPDATE`/`DELETE` policies and the privileges are revoked as well (migration 0006), so a direct `PATCH /rest/v1/orders` fails with `permission denied`.

**Application data writes go through a `SECURITY DEFINER` RPC** (migration 0005), except cafe signup: Supabase Auth creates the cafe and first staff membership in a trusted `auth.users` trigger (migration 0008). Each RPC:

- takes identity from `auth.uid()` only. No RPC accepts `student_id`, `cafe_id` (for operators), `cancelled_by`, `cancelled_by_role`, `removed_by`, prices, totals or actor fields;
- runs as one transaction, so the mutation and its `order_events` row commit or roll back together;
- uses `search_path = ''` and fully qualified names;
- reports failures as a stable machine-readable error code (section 6).

**Cafe-operator access comes only from `cafe_staff`.** `profiles` has no role column. There is no client write path to `cafe_staff`.

**Service role** bypasses RLS. It is the trusted admin path (menu/destination edits) and must stay server-side. Public cafe registration intentionally lets anyone create a new cafe and its first login; it does not let a registrant claim an existing cafe.

**Money** is integer paise (`*_paise`) throughout. Order and line totals are computed in PostgreSQL.

---

## 2. Repository layout

```
supabase/
  migrations/
    20261020000100_core_tables.sql                  profiles, cafes, cafe_staff, destinations, menu_items, signup trigger
    20261020000200_orders_and_items.sql             orders, order_items, snapshot-immutability trigger
    20261020000300_hours_availability_events.sql    cafe_hours, menu_item_availability, order_events (append-only)
    20261020000400_helper_functions.sql             is_cafe_staff, cafe_is_open, get_menu_item_status, state machine, totals
    20261020000500_rpc_functions.sql                all client-callable RPCs + EXECUTE lockdown
    20261020000600_rls_policies.sql                 table privileges + RLS policies
    20261024000100_one_staff_login_per_cafe.sql     enforce one cafe staff login per cafe
    20261024000200_public_cafe_registration.sql     create a cafe and first staff login at signup
    20261024000300_complete_existing_cafe_signup.sql let an existing account finish cafe setup
    20261025000100_cafe_staff_manage_menu.sql       let cafe staff manage their menu through authorized RPCs
  seed.sql                                          demo cafe, hours, menu, destinations
  tests/checklist.sql                               executable validation checklist
README.md
```

Migrations are ordered by filename and must run in that order. Table creation is once-only (plain `CREATE TABLE`, as with any ordered migration runner). Functions, triggers, indexes, policies and the seed are re-runnable.

---

## 3. Applying the migrations

### Option A: Supabase CLI (recommended)

```bash
supabase link --project-ref <your-project-ref>
supabase db push                       # applies supabase/migrations/* in order
psql "$DATABASE_URL" -f supabase/seed.sql
```

For a local stack: `supabase start && supabase db reset` (applies migrations, then `seed.sql` if configured in `supabase/config.toml` under `[db.seed]`).

### Option B: SQL editor

Paste and run `0001` through `0010` in order, then `seed.sql`.

### Checks after applying

```sql
-- RLS enabled on all 10 tables
SELECT relname, relrowsecurity FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' ORDER BY relname;

-- No table privileges for anon; SELECT-only for authenticated
SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated') ORDER BY 2,1,3;

-- Review the client-callable functions granted across the migrations
SELECT p.oid::regprocedure FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
```

Then run the checklist (section 8), which verifies all of this behaviourally.

---

## 4. Cafe registration and staff access

Anyone can register through `/cafe/register`. Each signup creates a new cafe and assigns the registering user as its only staff login. The auth trigger uses the cafe name from signup metadata and the new Auth user ID. If an account was created before the registration trigger was installed, sign in and finish cafe setup on `/cafe/access-pending`; the `cafe_complete_registration` RPC creates a new cafe for the authenticated user without allowing the browser to write directly to `cafes` or `cafe_staff`. Each cafe has one login; to change that login, use the trusted SQL editor/service-role admin path.

1. Apply migrations `0001` through `0010`.
2. Open `/cafe/register`, enter the cafe name and account details, and submit.
3. If Supabase requires email confirmation, confirm the email first. Then go to `/cafe/login` and sign in. If email confirmation is disabled for a local test project, signup signs in immediately.

This is intentionally open registration: any person can create a new cafe account. The one-login-per-cafe constraint prevents two accounts from sharing a cafe, but does not verify that a registrant owns or represents a real cafe. The database creates a distinct cafe for every signup; no signup can take over an existing cafe.

To manually assign or replace a cafe's one login, first create the user in **Authentication → Users → Add user**, then find both IDs:

```sql
SELECT id, email FROM auth.users WHERE email = 'staff@example.com';
SELECT id, name FROM public.cafes;
```

Then run as `postgres` or with the service role:

```sql
INSERT INTO public.cafe_staff (cafe_id, user_id)
VALUES ('<cafe-uuid>', '<user-uuid>')
ON CONFLICT (cafe_id) DO UPDATE SET user_id = EXCLUDED.user_id;
```

**One cafe per staff member (MVP).** `/api/cafe/*` operations resolve "the caller's cafe" from `cafe_staff`. A user with two memberships gets `multiple_cafe_memberships` until one is removed.

Cafe staff can manage their own menu through the authenticated `cafe_add_menu_item`, `cafe_update_menu_item`, and `cafe_delete_menu_item` RPCs (migration `20261025000100`). Other admin-only data, including cafe settings such as `is_accepting_orders` and `timezone` and destinations, has no client write path; edit it through the SQL editor or service role.

---

## 5. API contract

The spec's REST endpoints map onto PostgREST reads and RPC calls. The API layer can be a thin proxy, or the web client can call these directly with the user's JWT (never the service-role key).

| Endpoint | Implementation |
|---|---|
| `GET /api/cafes` | `SELECT` on `cafes` (RLS: active cafes, own cafe, cafes you have ordered from) |
| `GET /api/cafes/:cafeId/menu` | `rpc get_cafe_menu(p_cafe_id)`. Returns only items orderable today, with `remaining_stock`. Do **not** read `menu_items` for this; it ignores per-day overrides. |
| `GET /api/destinations` | `SELECT` on `destinations` |
| `POST /api/orders` | `rpc create_order(p_items, p_destination_id, p_idempotency_key)` |
| `GET /api/orders` | `SELECT` on `orders` (RLS: own orders) |
| `GET /api/orders/:orderId` | `SELECT` on `orders` + `order_items` (+ `order_events`) |
| `PATCH /api/orders/:orderId/cancel` | `rpc student_cancel_order(p_order_id, p_reason)` |
| `GET /api/cafe/orders` | `rpc cafe_list_orders(p_status)`. Returns `jsonb`: orders with `student_display_name` and `items`, newest first, max 200. |
| `PATCH /api/cafe/orders/:orderId/status` | `rpc cafe_set_order_status(p_order_id, p_to_status, p_reason)` |
| `PATCH /api/cafe/orders/:orderId/items/:itemId/remove` | `rpc cafe_remove_order_item(p_order_id, p_item_id, p_reason)` |
| `GET /api/cafe/hours` | `rpc cafe_get_hours()` |
| `PUT /api/cafe/hours` | `rpc cafe_put_hours(p_shifts)`. Full replace. |
| `GET /api/cafe/menu-availability?date=` | `rpc cafe_get_menu_availability(p_date)` |
| `PUT /api/cafe/menu-availability` | `rpc cafe_put_menu_availability(p_service_date, p_overrides)` |

### Request / response shapes

**`create_order`**

```jsonc
// p_items: ONLY ids and quantities. Any other key (price, total, status...) is ignored.
[{ "menu_item_id": "<uuid>", "quantity": 2 }]
```

Limits: 1–50 lines, quantity 1–100 per item (duplicate ids are merged). Response:

```jsonc
{ "order": { /* orders row */ }, "items": [ /* order_items rows */ ], "idempotent_replay": false }
```

A retry with the same `(student, idempotency_key)` returns the existing order with `"idempotent_replay": true` and ignores the new payload. Keys are 1–128 characters.

**`cafe_put_hours`**

```jsonc
[
  { "day_of_week": 1, "opens_at": "08:00", "closes_at": "14:00" },
  { "day_of_week": 1, "opens_at": "16:00", "closes_at": "22:00" },   // split shift
  { "day_of_week": 7, "is_closed": true }                            // closed all day
]
```

**`cafe_put_menu_availability`**

```jsonc
// Upserts one override per listed item; each entry fully replaces that item's override for the date.
// Omitted is_available = true; omitted quantity_available = unlimited. Unlisted items are untouched.
[{ "menu_item_id": "<uuid>", "is_available": true, "quantity_available": 20 }]
```

**`cafe_set_order_status`**: `p_to_status` is one of `accepted | rejected | preparing | ready | out_for_delivery | delivered | cancelled`. `cancelled` requires `p_reason`.

Mutating order RPCs return `{ "order": {...}, "items": [...] }`.

---

## 6. Error codes

Failures raise an exception whose **message is a stable code**. Extra context is in `DETAIL`. With PostgREST the code is in `error.message` and the context in `error.details`.

| Code | Raised when |
|---|---|
| `not_authenticated` | No valid JWT (SQLSTATE 28000) |
| `not_cafe_staff` / `multiple_cafe_memberships` | Operator RPC called by a non-member / by a member of several cafes (42501) |
| `order_not_found` | Missing order, **or** one that belongs to another student/cafe (deliberately indistinguishable) |
| `item_not_found` | Unknown menu item or order line (including a line that is not part of this order) |
| `invalid_idempotency_key`, `invalid_items`, `invalid_shifts`, `invalid_overrides`, `invalid_date` | Malformed input |
| `items_from_multiple_cafes` | Order lines span more than one cafe |
| `destination_not_available` | Destination missing or inactive |
| `cafe_not_active`, `cafe_not_accepting_orders`, `cafe_closed` | Cafe cannot take orders right now |
| `item_globally_unavailable`, `item_unavailable_today`, `out_of_stock`, `insufficient_stock` | Menu resolution rule failed (the first three come from `get_menu_item_status().reason`) |
| `order_total_too_large` | Total would overflow `integer` paise |
| `order_terminal` | Order is `cancelled`, `rejected` or `delivered`. No further transitions. |
| `invalid_transition` | Not in the state machine (`DETAIL`: `from -> to`) |
| `cancel_window_closed` | Student past `accepted`, or cafe past `ready` |
| `reason_required` | Cafe cancellation without a reason |
| `item_removal_not_allowed` | Order not in `pending / accepted / preparing / ready` |
| `item_already_removed` | Line already removed |
| `overlapping_shifts` | `cafe_put_hours` schedule has overlaps (including overnight spill-over) |
| `invalid_actor` | Internal: bad role/actor combination |
| `order_events_append_only`, `order_item_snapshot_immutable`, `order_item_removal_irreversible` | Trigger guards. They fire even for superusers. |

---

## 7. Business-rule reference

### Order state machine

```
pending ──> accepted ──> preparing ──> ready ──> out_for_delivery ──> delivered
   ├──> rejected       (cafe declines a pending order)
   └──> cancelled      student: pending/accepted   cafe: pending..ready   system: any pre-delivery
```

`cancelled`, `rejected` and `delivered` are terminal. Cafe-driven transitions are validated by `can_cafe_transition()`. Cancellation has its own windows and is handled by `internal_cancel_order()`, the single source of truth for who can cancel when.

### Menu item resolution (`get_menu_item_status`)

An item is orderable on date D iff `menu_items.is_available` **and** (no override for D **or** `override.is_available`) **and** (`quantity_available IS NULL` **or** remaining stock > 0). Global `is_available = false` always wins.

Remaining stock is `quantity_available` minus the quantity of `included` lines on orders that are not `cancelled`/`rejected` and were created on that cafe-local date.

### Working hours (`cafe_is_open`)

- Times are cafe-local (`cafes.timezone`); `closes_at` is **exclusive**.
- `closes_at < opens_at` means the shift **spans midnight** and belongs to the day it opens on. No flag column.
- `closes_at = opens_at` is forbidden. For a 24-hour day, use two shifts.
- If any row for a day has `is_closed = true`, the cafe is closed that entire day (and the previous day's overnight spill-over into it is cancelled). Times on an `is_closed` row are placeholders.
- `create_order` also requires `cafes.is_active` and `cafes.is_accepting_orders`.

### Item removal

Cafe staff of the order's cafe only. Sets `status = 'removed'`, `removed_at`, `removed_by` (from the JWT) and an optional reason. Recomputes `orders.total_paise` from remaining `included` lines. Snapshot columns are never touched (a trigger enforces this). If the last included line is removed, the order is cancelled with `cancelled_by_role = 'cafe'` and reason `all items removed`.

### Audit trail

`order_events` gets one row inside the same transaction for order creation, every status change, every item removal and every cancellation. It is append-only (trigger blocks `UPDATE`/`DELETE`). Event types: `status_changed`, `item_removed`, `cancelled`, plus `idempotent_replay` (see section 10).

---

## 8. Running the validation checklist

`supabase/tests/checklist.sql` runs inside one transaction that **rolls back**, so nothing is left behind. It creates its own users, cafes and items, and impersonates `anon` / `authenticated` with `SET ROLE` + JWT claims, so RLS, privileges and RPC grants are exercised exactly as a client hits them.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/checklist.sql
```

(or paste it into the SQL editor). Each assertion emits `PASS: ...`. The first failure aborts with `FAIL: ...`. Success ends with `=== ALL CHECKLIST TESTS PASSED ===`.

Run as `postgres` against a **dev or staging** project. The test inserts into `auth.users` (rolled back), so don't run it against production.

| # | Checklist item | Covered by |
|---|---|---|
| C1 | Migration applies to a clean project | Applying section 3 on a fresh project; the test then runs against that schema |
| C2 | Student A cannot read/update Student B's order | `checklist.sql` (C2) |
| C3 | Cafe A operator cannot read/update Cafe B's order or items | `checklist.sql` (C3/C10) |
| C4 | Student cannot mark own order delivered | `checklist.sql` (C4) |
| C5 | Users cannot grant themselves `cafe_staff` | `checklist.sql` (C5) |
| C6 | Client price/total tampering has no effect | `checklist.sql` (C6) |
| C7 | Item from another cafe cannot be included | `checklist.sql` (C7) |
| C8 | Duplicate retry returns the existing order | `checklist.sql` (C8) |
| C9 | Service-role key not in client bundles or Git | **Manual**, see section 9 |
| C10 | Cafe A staff cannot remove items from / cancel Cafe B's order | `checklist.sql` (C3/C10) |
| C11 | Removal recomputes total; other snapshots untouched | `checklist.sql` (C11/C12) |
| C12 | Removing every item cancels with `cancelled_by_role = 'cafe'` | `checklist.sql` (C11/C12) |
| C13 | Rejected outside hours or when not accepting orders | `checklist.sql` (C13) |
| C14 | Overrides respected; global `is_available = false` wins | `checklist.sql` (C14) |
| C15 | Cancellation windows (student / cafe) | `checklist.sql` (C15) |
| C16 | `cancelled` is terminal | `checklist.sql` (C16) |
| C17 | `cancelled_by`, `cancelled_by_role`, `removed_by` server-set only | `checklist.sql` (C17), which also asserts no client-callable RPC takes such arguments |
| C18 | Every mutation writes an `order_events` row in the same transaction | `checklist.sql` (C18), including a rollback-atomicity check |

### Manual smoke test through the real API

1. Sign up two students and one staff user. Grant the staff user the demo cafe (section 4).
2. As student A, call `get_cafe_menu` for the demo cafe, then `create_order` with two items.
3. As student B, `SELECT` from `orders`. Expect zero rows.
4. As staff, `cafe_list_orders`, then `cafe_set_order_status` through `accepted → preparing → ready → out_for_delivery → delivered`.
5. As student A, `student_cancel_order` on a delivered order. Expect `order_terminal`.

---

## 9. Secrets

**C9 cannot be checked in SQL.** Do this manually and in CI:

- Only the **anon** key and project URL belong in the browser bundle. The **service-role** key lives only in server-side environment variables or a secret manager.
- Keep `.env*` files in `.gitignore`. Commit a `.env.example` with placeholders only.
- Before release, scan the repo and the built bundle:

  ```bash
  git log -p --all -S 'service_role' | head        # history
  git grep -nI 'service_role\|SERVICE_ROLE'        # working tree
  grep -R "service_role" dist/ build/ .next/static 2>/dev/null   # built client bundle
  ```

  Also decode any key found in client code: a JWT with `"role":"service_role"` in its payload is a leak.
- If a service-role key ever leaks, rotate it immediately in the Supabase dashboard (API settings).

---

## 10. Deviations, additions and open items

Flagged so they can be approved or reverted. None adds a table or endpoint beyond the spec.

**Integrity tightenings (no new columns)**
- `price_paise`, `prep_minutes` and `travel_minutes` are `NOT NULL` (prep and travel default to 0); `is_*` booleans are `NOT NULL` with defaults.
- `order_items.line_total_paise = unit_price_paise * quantity` is enforced by a CHECK.
- `orders` has CHECKs tying `cancelled_*` columns to `status = 'cancelled'` in both directions, and `cancelled_by IS NULL` iff the role is `system`.
- `order_events.event_type` is CHECK-constrained.

**Deviations from the spec's wording**
- **Order numbers:** `next_order_number()` uses `lpad(..., greatest(6, length))`. A plain `lpad(x, 6, '0')` truncates beyond 6 digits and would eventually collide on `UNIQUE (order_number)`. The `ORD-000123` shape is kept.
- **Seed has no `cafe_staff` row.** The spec asks for one, but a fresh project has no `auth.users` row to reference. Use section 4.
- **Cafe cancellation rides on `PATCH .../status`** (`p_to_status = 'cancelled'`), since the spec lists no separate cafe-cancel endpoint.
- **Idempotent replays are logged** as an `idempotent_replay` event type, which the spec's event list doesn't include. It is optional; drop it from the CHECK and `internal_replay_order()` to remove it.
- **`create_order` also enforces** `quantity <= remaining stock`, the 50-line / 100-quantity limits, and cafe `is_active`.
- **Item removal is allowed in `pending | accepted | preparing | ready`.** The spec says only "cafe staff of the order's cafe"; this window mirrors the cafe cancellation window. Confirm that's intended.
- **Stock accounting** counts orders by cafe-local *order creation* date, not by a delivery date.

**Open items**
- `profiles`, `cafes`, `menu_items` and `destinations` have no `updated_at`, because the spec's column lists omit it while the global rule says "created_at/updated_at on mutable tables". Adding them is a small follow-up migration if wanted.
- `cafes.timezone` must be a valid IANA name (it must exist in `pg_timezone_names`); an invalid value makes `cafe_is_open()` error. It is admin-managed.
- Payments are out of scope. Order status and any future payment status are separate concepts; use pay-at-counter / cash-on-delivery for the MVP.
