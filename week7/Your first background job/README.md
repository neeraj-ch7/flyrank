# Background Job API (A7)

Accept fast, work in the background, report status. `POST /reports`
answers in milliseconds; the actual 8-second work happens in an Inngest
function; `GET /reports/:id` tells you when it's done.

## Run it (two terminals)

**Terminal 1 — the API:**
```bash
npm install
npm start
```

**Terminal 2 — the Inngest Dev Server** (the actual job runner/scheduler):
```bash
npm run inngest:dev
```

Dashboard: **http://localhost:8288**

## Endpoints & functions

| | | |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |
| POST | `/reports` | `{"topic": "..."}` → `202` + `{id, status: "pending"}` instantly. Missing topic → `400`, no job sent. |
| GET | `/reports/:id` | `pending` → `done` (+result) or `failed`. Unknown id → `404`. |
| GET | `/reports` | Lists all reports (control panel extra) |

| Function | Trigger | What it does |
|---|---|---|
| `say-hello` | event `test/hello` | Sleeps 5s, returns a fixed string (Stage 1 warm-up) |
| `make-report` | event `report/requested` | Sleeps 8s, then builds the report. `topic: "fail"` throws deliberately. `retries: 2`. Marks the report `failed` once retries are exhausted (`onFailure`). Skips redoing work if the report is already `done` (idempotency). |
| `heartbeat` | cron `* * * * *` | Every minute, logs one line: counts of pending/done/failed |

## Real proof — the 202-then-poll flow

Actually run, not simulated:

```
$ curl -X POST http://localhost:3000/reports -d '{"topic":"cats"}'
{"id":"359da4a8-ddf3-4a7b-aff0-7b58230a732a","status":"pending"}   [202, took 19ms]

$ curl http://localhost:3000/reports/359da4a8-ddf3-4a7b-aff0-7b58230a732a
{"id":"...","topic":"cats","status":"pending"}                     [immediately after]

$ curl http://localhost:3000/reports/359da4a8-ddf3-4a7b-aff0-7b58230a732a
{"id":"...","topic":"cats","status":"done",
 "result":"Report on \"cats\": generated at 2026-09-09T04:10:52.796Z"}   [~10s later]
```

## Real proof — retries and failure

```
$ curl -X POST http://localhost:3000/reports -d '{"topic":"fail"}'
{"id":"683571b8-0ee5-4229-b404-28eda042ccb5","status":"pending"}

# server log shows exactly 3 attempts (1 initial + retries:2):
Error: The report oven is broken!   (x3, with increasing backoff between each)

$ curl http://localhost:3000/reports/683571b8-0ee5-4229-b404-28eda042ccb5
{"id":"...","topic":"fail","status":"failed"}
```

```
$ curl -X POST http://localhost:3000/reports -d '{}'
{"error":"topic is required"}   [400, no event sent, no job created]
```

## Real proof — cron heartbeat

Two consecutive log lines, one minute apart, from a single continuous run:
```
heartbeat: pending=0 done=0 failed=0
heartbeat: pending=0 done=0 failed=0
```

## Stage 3 sentence — validation vs. retry

A missing `topic` is rejected at the door with `400` and never becomes a
job at all, because the input itself is wrong and will still be wrong on
a retry; a `topic: "fail"` case is accepted as a valid job that failed at
a bad *moment* (a transient-looking failure), so it's worth retrying —
the difference is whether trying again could plausibly produce a
different outcome.

## Stage 4 sentences — cron expressions

- Every day at 08:00: `0 8 * * *`
- Every Sunday at 22:00: `0 22 * * 0`

(built and confirmed on crontab.guru)

## Idempotency note

If `report/requested` is ever redelivered for an id that's already
`done` (Inngest guarantees at-least-once delivery, not exactly-once), the
`build-report` step checks the existing status first and returns the
saved result instead of redoing the work — so a duplicate delivery
produces the same report once, not twice.

## Dashboard screenshot

_Add a screenshot of http://localhost:8288 here showing: a completed
`make-report` run with its steps, a `Failed` run with 3 attempts, and the
`heartbeat` cron runs — all three are real in this repo, just need the
screenshot taken on your machine since I can't capture a browser
screenshot from this sandbox._

## What I actually tested myself

Every proof pasted above is from a real run in this sandbox: both
Inngest and the API were actually started, and I confirmed the exact
response timing (19ms), the pending→done transition after the real 8s
sleep, the 3-attempt retry-then-fail path (waited ~120s for backoff to
finish), the 400 rejection with zero job creation, and two real
one-minute-apart cron log lines. The only thing I couldn't produce myself
is the dashboard *screenshot* — the dashboard itself was confirmed
running and reachable (`curl localhost:8288` → 200) but taking a visual
screenshot needs a real browser, which this sandbox doesn't have.
