export type NodeKind = "start" | "decision" | "end";

export interface FlowNodeData {
  label: string;
  prompt?: string; // only meaningful for "decision" nodes
}

export interface SerializedNode {
  id: string;
  type: NodeKind;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: "yes" | "no" | null; // null for edges out of "start"
}

export interface FlowGraph {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

export interface ExecutionLogEntry {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeKind;
  prompt?: string;
  answer?: "YES" | "NO";
  timestamp: string;
}

export interface ExecutionRun {
  runId: string;
  status: "running" | "completed" | "error";
  log: ExecutionLogEntry[];
  error?: string;
  startedAt: string;
  finishedAt?: string;
}
