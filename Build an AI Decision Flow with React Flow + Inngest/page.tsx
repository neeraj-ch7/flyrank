"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { StartNode, DecisionNode, EndNode } from "@/components/nodes";
import { Button } from "@/components/ui/button";
import type { ExecutionRun, FlowGraph, SerializedEdge, SerializedNode } from "@/lib/types";

const nodeTypes = { start: StartNode, decision: DecisionNode, end: EndNode };

let idCounter = 1;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

const initialNodes: Node[] = [
  { id: "start-1", type: "start", position: { x: 250, y: 20 }, data: { label: "Start" } },
  {
    id: "decision-1",
    type: "decision",
    position: { x: 150, y: 140 },
    data: { label: "Decision", prompt: "Is this a support request?" },
  },
  { id: "end-support", type: "end", position: { x: 20, y: 340 }, data: { label: "Support Node" } },
  { id: "end-sales", type: "end", position: { x: 320, y: 340 }, data: { label: "Sales Node" } },
];

const initialEdges: Edge[] = [
  { id: "e-start-decision", source: "start-1", target: "decision-1" },
  { id: "e-yes", source: "decision-1", sourceHandle: "yes", target: "end-support", animated: false },
  { id: "e-no", source: "decision-1", sourceHandle: "no", target: "end-sales", animated: false },
];

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [run, setRun] = useState<ExecutionRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wire each decision node's textarea onChange back into node state.
  const nodesWithHandlers = nodes.map((n) => {
    if (n.type !== "decision") {
      // apply active-state highlighting to end nodes too, based on last log entry
      return n;
    }
    return {
      ...n,
      data: {
        ...n.data,
        onPromptChange: (value: string) => {
          setNodes((nds) =>
            nds.map((x) => (x.id === n.id ? { ...x, data: { ...x.data, prompt: value } } : x))
          );
        },
        activeState: computeActiveState(n.id, run),
      },
    };
  });

  function computeActiveState(nodeId: string, run: ExecutionRun | null): DecisionActiveState {
    if (!run) return "idle";
    const idx = run.log.findIndex((l) => l.nodeId === nodeId);
    if (idx === -1) return "idle";
    const isLast = idx === run.log.length - 1;
    if (isLast && run.status === "running") return "active";
    const entry = run.log[idx];
    if (entry.answer === "YES") return "done-yes";
    if (entry.answer === "NO") return "done-no";
    return "idle";
  }

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  function addDecisionNode() {
    const id = nextId("decision");
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "decision",
        position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
        data: { label: "Decision", prompt: "Ask a yes/no question…" },
      },
    ]);
  }

  function addEndNode() {
    const id = nextId("end");
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "end",
        position: { x: 200 + Math.random() * 200, y: 400 + Math.random() * 100 },
        data: { label: "End" },
      },
    ]);
  }

  function serializeGraph(): FlowGraph {
    const serNodes: SerializedNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type as SerializedNode["type"],
      position: n.position,
      data: { label: n.data.label, prompt: n.data.prompt },
    }));
    const serEdges: SerializedEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: (e.sourceHandle as "yes" | "no" | null) ?? null,
    }));
    return { nodes: serNodes, edges: serEdges };
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(serializeGraph(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const graph: FlowGraph = JSON.parse(reader.result as string);
        setNodes(
          graph.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: { label: n.data.label, prompt: n.data.prompt },
          }))
        );
        setEdges(
          graph.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
          }))
        );
        setRun(null);
        setError(null);
      } catch (err) {
        setError("Could not parse that JSON file.");
      }
    };
    reader.readAsText(file);
  }

  async function runWorkflow() {
    setError(null);
    setRun(null);
    const graph = serializeGraph();

    const res = await fetch("/api/workflow/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graph),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Failed to start run");
      return;
    }

    const { runId } = await res.json();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const logRes = await fetch(`/api/workflow/logs/${runId}`);
      if (!logRes.ok) return;
      const data: ExecutionRun = await logRes.json();
      setRun(data);
      if (data.status !== "running" && pollRef.current) {
        clearInterval(pollRef.current);
      }
    }, 800);
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // animate edges that were part of the traversal
  const edgesWithAnimation = edges.map((e) => {
    if (!run) return e;
    const traversed = run.log.some((l, i) => {
      const prev = run.log[i - 1];
      if (!prev) return false;
      const handle = prev.answer === "YES" ? "yes" : prev.answer === "NO" ? "no" : null;
      return prev.nodeId === e.source && l.nodeId === e.target && (e.sourceHandle ?? null) === handle;
    }) || (run.log[0]?.nodeId === e.target && e.source === "start-1");
    return traversed ? { ...e, animated: true, style: { stroke: "#5B8CFF", strokeWidth: 2 } } : e;
  });

  return (
    <div className="flex h-screen bg-canvas text-white">
      <div className="flex-1 relative">
        <div className="absolute z-10 top-4 left-4 flex gap-2">
          <Button variant="outline" onClick={addDecisionNode}>+ Decision node</Button>
          <Button variant="outline" onClick={addEndNode}>+ End node</Button>
          <Button variant="default" onClick={runWorkflow}>▶ Run workflow</Button>
          <Button variant="outline" onClick={exportJson}>Export JSON</Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
          />
        </div>

        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edgesWithAnimation}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#2A2D33" gap={20} />
          <Controls />
          <MiniMap pannable zoomable className="!bg-panel" />
        </ReactFlow>
      </div>

      <div className="w-96 border-l border-border bg-panel p-4 overflow-y-auto">
        <h2 className="text-sm uppercase tracking-wide text-white/50 mb-3">Execution log</h2>

        {error && <p className="text-no text-sm mb-3">{error}</p>}

        {!run && !error && (
          <p className="text-sm text-white/40">
            No run yet. Click "Run workflow" to send it through Inngest.
          </p>
        )}

        {run && (
          <div className="space-y-3">
            <div className="text-xs">
              Status:{" "}
              <span
                className={
                  run.status === "completed"
                    ? "text-yes"
                    : run.status === "error"
                    ? "text-no"
                    : "text-yellow-400"
                }
              >
                {run.status}
              </span>
            </div>
            {run.error && <p className="text-no text-xs">{run.error}</p>}
            <ol className="space-y-2">
              {run.log.map((entry, i) => (
                <li key={i} className="border border-border rounded-md p-2 text-xs">
                  <div className="font-medium">{entry.nodeLabel}</div>
                  {entry.prompt && <div className="text-white/50 mt-1">"{entry.prompt}"</div>}
                  {entry.answer && (
                    <div className={entry.answer === "YES" ? "text-yes mt-1" : "text-no mt-1"}>
                      → {entry.answer}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

type DecisionActiveState = "idle" | "active" | "done-yes" | "done-no";
