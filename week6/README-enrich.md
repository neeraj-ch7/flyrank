# /enrich — an LLM behind the Task API (A17)

Adds one endpoint to the existing task-api: `POST /enrich` takes a scraped
book's title and description (from the A9 scraper) and returns a
category, a one-sentence summary, and quality flags — clean, schema-valid
JSON, never raw model text.

## What it does (plain English)

You give it a book's title and description. It reads the description,
decides which shelf the book belongs on (fiction, nonfiction, poetry,
children's, reference, or "other" if it's genuinely unclear), writes one
sentence summarizing it, and flags anything suspicious about the record
itself (like a thin or missing description). It never guesses wildly —
if it's not confident, it says so instead of picking an answer.

## Run it

```bash
npm install
cp .env.example .env   # fill in your provider (see below)
npm start
```

### Two copy-pasteable curl commands

**Valid:**
```bash
curl -s -X POST http://localhost:3000/enrich \
  -H "Content-Type: application/json" \
  -d '{"title":"A Light in the Attic","description":"A humorous poetry collection for children and adults."}'
```
Expected shape:
```json
{
  "category": "poetry",
  "summary": "A humorous poetry collection exploring imagination and childhood, for readers of any age.",
  "quality_flags": [],
  "confidence": 0.9,
  "reason": "Description explicitly identifies it as a poetry collection."
}
```

**Deliberately broken (missing title):**
```bash
curl -i -X POST http://localhost:3000/enrich \
  -H "Content-Type: application/json" \
  -d '{"description":"no title given"}'
```
Returns `400` naming the field, before any model call is made.

## Job card

See [`JOB-CARD.md`](./JOB-CARD.md) — input/output shape, closed lists, and
the "must never" rules, written before any code.

## Provider

Built against **OpenRouter** (`openrouter/free`), swappable to Ollama by
changing three env vars only — same client code either way:

```
LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
```

## Retry policy

Custom retry logic (`src/llm/retry.js`), SDK's own retries disabled
(`maxRetries: 0`) so there's exactly one place deciding what gets retried.
Retries on `429` and `5xx` only, with exponential backoff + jitter (1s,
2s + a small random amount), obeying `Retry-After` when present. Never
retries `400`/`401`/`403` — a bad key stays a bad key.

## Timeout

Explicit `30000ms` (30s) set on the client, overriding the SDK's 10-minute
default. A timeout returns `504`.

## Kill switch

`LLM_ENABLED=false` → the endpoint returns a clean `503` immediately, zero
model calls. Verified locally (see Testing section).

## Cost logging

Every call (including repairs) writes one structured JSON line to stdout:
prompt version, model, input/output tokens, duration, whether it needed a
repair.

**Estimated cost for 10,000 requests/day:** not filled in — needs one real
call's token counts from your provider, which requires your own API key.
Run one real call, copy the `input_tokens`/`output_tokens` from the log
line, and multiply by your provider's per-token price × 10,000. Fill this
line in before submitting.

## Eval

```bash
node scripts/run-eval.js
```

Runs the 8 cases in `evals/cases.json` against the live endpoint and
prints how many matched on `category`.

**Score: not yet run** — needs a real provider key (see Testing section
below for what I verified without one).

## Testing note (what I verified vs. what needs your key)

I built and tested this without a real LLM provider key or network access
to OpenRouter/Ollama in this sandbox. What I did verify, with zero model
calls:

- **Stage 1 (input validation + stub mode):** confirmed `LLM_STUB=1`
  returns the schema-valid stub with no model call; confirmed missing
  title and over-length title both return `400` naming the field.
- **Stage 4 (kill switch):** confirmed `LLM_ENABLED=false` returns `503`
  immediately.
- **Stage 3 (parse/validate logic):** fed the parser realistic model
  output patterns directly (clean JSON, JSON wrapped in a code fence with
  preamble text, an invalid enum value, and plain refusal text with no
  JSON at all) — all four handled correctly without crashing.

**What you need to do:** get a real OpenRouter or Ollama key, run
`npm start` for real, and:
1. Run the eval script, record the real score + date + prompt version above.
2. Confirm the repair-retry path fires by temporarily editing the prompt
   to demand an out-of-enum category, per the Stage 3 checkpoint.
3. Fill in the cost-per-10k-requests line above using a real log line.

## Prompt injection

`evals/cases.json` includes one deliberate attempt (`prompt_injection_attempt`)
where the "title" field itself tries to instruct the model to break format.
User content is JSON-encoded and sent only as a user message, never
concatenated into the system prompt — see `src/llm/client.js`.
