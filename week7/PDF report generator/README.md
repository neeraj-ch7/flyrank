# PDF Report Generator (A8)

Query → render → store → serve: a plain endpoint that turns 200 seeded
orders into a real PDF sales report, no background job required.

## Setup

```bash
npm install
npx playwright install chromium   # see note below — required for real PDF rendering
npm run seed
npm start
```

Server runs on `http://localhost:3000`.

## Dataset chosen

**Option A — the little shop.** `report.db` has one `orders` table:
`id, customer, product, amount, created_at`. `npm run seed` inserts 200
random orders (deletes all rows first, so running it twice still leaves
exactly 200 — verified, see Testing section).

## Aggregation SQL (Stage 2)

```sql
-- totals
SELECT COUNT(*) AS totalOrders, SUM(amount) AS totalRevenue FROM orders;

-- top 5 products by revenue
SELECT product, SUM(amount) AS revenue
FROM orders
GROUP BY product
ORDER BY revenue DESC
LIMIT 5;

-- orders per day, last 7 days
SELECT created_at AS date, COUNT(*) AS count
FROM orders
WHERE created_at >= date('now', '-7 days')
GROUP BY created_at
ORDER BY created_at ASC;
```

## API

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |
| POST | `/reports` | Runs query → render → store. Returns `201` + `{id, file}` on a fresh report, or `200` + the same `{id, file}` if today's report already exists (idempotency, see below). Pass `{"force": true}` to force a fresh one. |
| GET | `/reports/:id` | Returns the report row. `404` if unknown. |
| GET | `/reports/:id/file` | Serves the actual PDF from disk. |

## Stage 4 sentence — where would this move to a background job?

The moment a single report takes long enough that a user notices the
wait, or the moment more than one person can trigger a generation at the
same time — right now, `POST /reports` blocks the whole request on
Chromium's launch + render time, which is fine for one user clicking one
button, but would need to become an async job (A7 pattern: `202` + poll)
the moment that stops being true, e.g. once the order table grows from
200 rows to 5,000+ (see the stretch goal below).

## Stage 5 sentences — idempotency

The once-per-day check protects against a double-clicked "Generate
report" button creating two identical PDFs from the same data, wasting
disk space and confusing anyone looking at "which report is the real
one." A real-world example with actual stakes: an e-commerce system that
emails an order confirmation on every request instead of checking "did I
already confirm this order" will happily email the customer twice for
one purchase — the exact same class of bug, just with a customer instead
of a file on disk.

## Testing note — what I actually verified vs. what needs your machine

This sandbox has no network route to `cdn.playwright.dev`, so Chromium
could not be downloaded here — `npx playwright install chromium` fails
with a `403: Host not in allowlist` error. Everything **except the actual
PDF byte-rendering** was tested for real:

- **Seed idempotency:** ran `seed.js` twice, row count stayed at exactly
  200 both times.
- **Aggregation queries:** ran against the real seeded data, printed the
  full JSON report object, and verified the sanity check (no product's
  revenue exceeds total revenue) passes.
- **HTML generation:** confirmed the template renders all 200 order rows,
  includes `<thead>`, and includes the `break-inside: avoid` page-break
  fix — all built *before* ever hitting the Chromium-missing wall, per the
  assignment's own advice to fix page breaks proactively.
- **API routes:** `/health` → `200`, unknown report id → `404`.
- **The Chromium-missing failure itself:** confirmed it fails as a clean
  `500` with a readable error, not a server crash.
- **Idempotency logic, for real:** manually inserted a completed report
  row for today, confirmed a fresh `POST /reports` returns the *same id*
  with `200` instead of generating a new one, and confirmed `GET /reports/:id`
  returns that exact row.
- **A bug I caught this way:** my first version left a permanent
  `path: "pending"` row in the database whenever rendering failed, which
  the idempotency check didn't exclude — meaning one failed render would
  have permanently blocked all future generation "for today." Fixed by
  (a) excluding `pending` rows from the idempotency check and (b) deleting
  the row entirely on render failure. Re-verified: after a failed
  attempt, the reports table has zero rows, and a second attempt
  correctly retries rather than returning a false cached success.

**What you need to do:** run `npx playwright install chromium` on your
own machine (it'll work fine outside this sandbox), then run the full
`POST /reports` → download → open flow for real, and confirm:
1. The PDF is ≥2 pages
2. No table row is sliced across a page break
3. The header row repeats on page 2

## Stretch note — the big-table experiment

Not run — would need Chromium installed locally. To try it yourself:
change `seed.js`'s loop from 200 to 5,000, reseed, time a `POST /reports`
call, and compare against the 200-row timing. That timing gap *is* the
argument for background jobs (A7) once a report gets big enough.
