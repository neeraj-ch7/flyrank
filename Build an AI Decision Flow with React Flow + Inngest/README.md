# AI Decision Flow (BE-09)

A visual workflow builder: draw a graph of YES/NO decision nodes in
**React Flow**, execute it through **Inngest**, and each decision node
asks an LLM (via the **OpenAI SDK**) to answer exactly `YES` or `NO`,
branching down the matching edge.

## Quick start (two terminals)

**Terminal 1 — the app:**
```bash
npm install
cp .env.example .env    # fill in OPENAI_API_KEY, or set LLM_STUB=1 to test without one
npm run dev
```

**Terminal 2 — the Inngest dev server** (required — this is the actual
orchestrator; the app only registers functions with it):
```bash
npm run inngest:dev
```

Open **http://localhost:3000**. The Inngest dev dashboard (useful for
watching step-by-step execution) is at **http://localhost:8288**.

A demo graph loads by default: Start → "Is this a support request?" →
Support Node (YES) / Sales Node (NO), matching the assignment's example
exactly. Click **▶ Run workflow** to execute it.

## Testing without an OpenAI key

Set `LLM_STUB=1` in `.env`. The decision node then returns a deterministic
YES/NO based on prompt length instead of calling a model — this proves the
graph traversal, edge routing, and Inngest step wiring all work correctly
with zero API cost. This is exactly how I verified the whole pipeline
myself (see "What I actually tested" below).

## Project structure

```
src/
  app/
    page.tsx                     the flow editor (Phase 2 + 4 UI)
    api/inngest/route.ts         registers the function with Inngest
    api/workflow/trigger/        POST: validates graph, sends the event
    api/workflow/logs/[runId]/   GET: polled by the frontend for live status
  components/
    nodes.tsx                    Start / Decision / End node components
    ui/button.tsx                shadcn-style Button (see note below)
  inngest/
    client.ts                    Inngest client
    functions.ts                 the actual graph-traversal engine (Phase 3)
  lib/
    types.ts                     shared graph/execution types
    runStore.ts                  in-memory execution log store (local dev)
    utils.ts                     cn() helper
```

## Phase-by-phase, what's actually implemented

**Phase 1 — Setup**
- Next.js 14 (App Router) + TypeScript
- React Flow, Inngest, OpenAI SDK all installed and wired
- shadcn: `components.json` configured; `Button` component hand-written in
  the exact shadcn generated pattern (`cva` + `cn()`), because this sandbox
  had no network route to `ui.shadcn.com`'s registry to run `npx shadcn add`
  directly. **If you have network access, you can run
  `npx shadcn@latest add card input` etc. to add more components the normal
  way — the config is already in place for it.**
- `.env.example` with every variable, no real values

**Phase 2 — Foundations**
- Full React Flow canvas: add Decision/End nodes, drag to connect, drag to
  reposition
- Decision nodes have an editable prompt textarea, live-bound to state
- Two distinct edge types via handle IDs: `yes` (right, green) and `no`
  (left, red) — visually distinguished on the node itself
- Graph state lives in React state (`useNodesState`/`useEdgesState`); no
  backend persistence needed for editing

**Phase 3 — Build (core)**
- Each node maps to one Inngest step (`step.run`), so each is independently
  retryable and shows separately in the Inngest dashboard
- The model is instructed to answer only `YES` or `NO` (see
  `src/inngest/functions.ts`), and non-conforming answers default to `NO`
  rather than crashing the run
- Execution follows the graph's actual edges (`sourceHandle` match), not a
  hardcoded path — tested with both YES and NO branches (see below)
- Execution order is tracked and returned via the run log

**Phase 4 — Build (polish)** — implemented 5 of the required 3+:
1. **Visual execution state** — the active node pulses yellow while running,
   then turns green (YES) or red (NO) once resolved
2. **Execution logs panel** — right-hand panel, polls every 800ms, shows
   each node visited with its prompt and answer
3. **JSON export/import** — buttons to download the current graph as
   `workflow.json` and load one back in
4. **Animated active edges** — edges actually traversed during a run turn
   blue and animated, so you can see the path taken at a glance
5. **Better node styling** — distinct visual treatment for Start (pill),
   Decision (card with YES/NO handles), End (rounded box)
6. **Error handling** — missing start node → `400` before anything runs;
   a cyclic graph is caught by a hard `MAX_STEPS = 25` cap rather than
   hanging forever

## A real bug I hit and fixed (worth reading)

Inngest replays a function's entire body from the top every time a step
completes, to reconstruct where it left off — but it only **memoizes**
code inside `step.run()`. My first version wrote to the execution log
*outside* `step.run()` for Start/End nodes (and just after the decision
call). Running it for real produced a duplicate `start-1` log entry,
because that non-memoized line re-executed on the replay after the first
`step.run()` call. Fixed by moving every log-write inside its own
`step.run()`, alongside (or instead of) the model call, so each one only
ever fires once. This is documented in the commit history and in
`src/inngest/functions.ts`'s comments.

## What I actually tested (and what needs your own key)

Verified myself, with zero OpenAI cost (`LLM_STUB=1`):
- Full production build (`npm run build`) succeeds with no type errors
- Both dev servers start and talk to each other correctly
- A full run: Start → Decision (YES) → Support Node, `status: completed`,
  exactly 3 log entries, no duplicates
- The NO branch routes correctly to the other end node
- Missing-start-node input returns `400` before any model call

**What you need to do:** put a real `OPENAI_API_KEY` in `.env`, set
`LLM_STUB=0`, and run one real workflow to see an actual model-generated
YES/NO rather than the stub. Everything downstream of that call (parsing,
routing, logging) is already proven correct against the stub.
