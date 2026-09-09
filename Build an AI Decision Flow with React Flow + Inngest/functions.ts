import OpenAI from "openai";
import { inngest } from "./client";
import { appendLog, finishRun } from "@/lib/runStore";
import type { FlowGraph, SerializedNode } from "@/lib/types";

const MAX_STEPS = 25; // hard cap so a cyclic graph can never loop forever

function findStartNode(graph: FlowGraph): SerializedNode | undefined {
  return graph.nodes.find((n) => n.type === "start");
}

function findNextNode(
  graph: FlowGraph,
  currentId: string,
  handle: "yes" | "no" | null
): SerializedNode | undefined {
  const edge = graph.edges.find(
    (e) => e.source === currentId && e.sourceHandle === handle
  );
  if (!edge) return undefined;
  return graph.nodes.find((n) => n.id === edge.target);
}

// Calls the model and returns exactly "YES" or "NO" — nothing else is a
// valid answer for this node type. This is the whole "AI-powered branching
// logic" requirement from Phase 3.
async function askYesNo(prompt: string): Promise<"YES" | "NO"> {
  if (process.env.LLM_STUB === "1") {
    // Deterministic stub for local development without spending API calls —
    // alternates based on prompt length so a demo graph shows both branches.
    return prompt.length % 2 === 0 ? "YES" : "NO";
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 2, // retries on the SDK's own transient-error logic; fine for a single classification call
  });

  const res = await client.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You answer a yes/no decision question. Respond with exactly one word: YES or NO. Never explain, never add punctuation, never say anything else.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = (res.choices[0]?.message?.content || "").trim().toUpperCase();
  if (raw.startsWith("YES")) return "YES";
  if (raw.startsWith("NO")) return "NO";
  // Model didn't follow the format — default to NO rather than crash the run.
  // A production version would repair-retry here (see the A17 assignment's
  // parse/repair/quarantine pattern); kept simple here since this
  // assignment's focus is the graph execution, not schema repair.
  return "NO";
}

export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow" },
  { event: "workflow/execute.requested" },
  async ({ event, step }) => {
    const { graph, runId } = event.data as { graph: FlowGraph; runId: string };

    let current = findStartNode(graph);
    if (!current) {
      finishRun(runId, "error", "No start node found in graph");
      return { error: "No start node found" };
    }

    let steps = 0;
    let handle: "yes" | "no" | null = null;

    while (current && steps < MAX_STEPS) {
      steps += 1;
      const node = current;

      if (node.type === "decision") {
        // The model call AND the log write both need to be inside step.run —
        // Inngest replays the whole function body on every step advance, and
        // anything outside step.run re-executes on each replay. Combining
        // them into one memoized step prevents duplicate log entries.
        const answer = await step.run(`decide-${node.id}`, async () => {
          const result = await askYesNo(node.data.prompt || node.data.label);
          appendLog(runId, {
            nodeId: node.id,
            nodeLabel: node.data.label,
            nodeType: node.type,
            prompt: node.data.prompt,
            answer: result,
            timestamp: new Date().toISOString(),
          });
          return result;
        });

        handle = answer === "YES" ? "yes" : "no";
      } else {
        // start or end nodes: no model call, but the log write still needs
        // memoizing for the same replay reason.
        await step.run(`arrive-${node.id}`, async () => {
          appendLog(runId, {
            nodeId: node.id,
            nodeLabel: node.data.label,
            nodeType: node.type,
            timestamp: new Date().toISOString(),
          });
        });
        handle = null;
      }

      const next = findNextNode(graph, node.id, handle);
      if (!next) break; // terminal node — nothing wired to this handle
      current = next;
    }

    if (steps >= MAX_STEPS) {
      finishRun(runId, "error", "Max step count reached — possible cycle in graph");
      return { error: "max steps reached" };
    }

    finishRun(runId, "completed");
    return { completedSteps: steps };
  }
);
