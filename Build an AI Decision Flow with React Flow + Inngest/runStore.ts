import type { ExecutionRun } from "./types";

// A simple in-memory store, good enough for local dev / a single Next.js
// process. Not for production — a real deployment would use a database or
// Inngest's own step output retrieval instead.
declare global {
  // eslint-disable-next-line no-var
  var __runStore: Map<string, ExecutionRun> | undefined;
}

export const runStore: Map<string, ExecutionRun> =
  global.__runStore ?? (global.__runStore = new Map());

export function createRun(runId: string): ExecutionRun {
  const run: ExecutionRun = {
    runId,
    status: "running",
    log: [],
    startedAt: new Date().toISOString(),
  };
  runStore.set(runId, run);
  return run;
}

export function appendLog(runId: string, entry: ExecutionRun["log"][number]) {
  const run = runStore.get(runId);
  if (!run) return;
  run.log.push(entry);
}

export function finishRun(runId: string, status: "completed" | "error", error?: string) {
  const run = runStore.get(runId);
  if (!run) return;
  run.status = status;
  run.error = error;
  run.finishedAt = new Date().toISOString();
}
