"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export function StartNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <div
      className={cn(
        "rounded-full border px-5 py-2.5 text-sm font-medium bg-panel border-border text-white",
        selected && "ring-2 ring-accent"
      )}
    >
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!bg-accent" />
    </div>
  );
}

export function EndNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <div
      className={cn(
        "rounded-lg border px-5 py-3 text-sm font-medium bg-panel border-border text-white min-w-[140px] text-center",
        selected && "ring-2 ring-accent"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      {data.label}
    </div>
  );
}

interface DecisionData {
  label: string;
  prompt: string;
  onPromptChange?: (value: string) => void;
  activeState?: "idle" | "active" | "done-yes" | "done-no";
}

export function DecisionNode({ data, selected }: NodeProps<DecisionData>) {
  const stateRing =
    data.activeState === "active"
      ? "ring-2 ring-yellow-400 animate-pulse"
      : data.activeState === "done-yes"
      ? "ring-2 ring-yes"
      : data.activeState === "done-no"
      ? "ring-2 ring-no"
      : selected
      ? "ring-2 ring-accent"
      : "";

  return (
    <div
      className={cn(
        "rounded-lg border bg-panel border-border text-white w-64 shadow-lg",
        stateRing
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="px-3 py-2 border-b border-border text-xs uppercase tracking-wide text-white/50">
        {data.label}
      </div>
      <textarea
        className="nodrag w-full bg-transparent px-3 py-2 text-sm resize-none outline-none placeholder:text-white/30"
        rows={3}
        placeholder="Ask a yes/no question…"
        defaultValue={data.prompt}
        onChange={(e) => data.onPromptChange?.(e.target.value)}
      />
      <div className="flex justify-between px-3 pb-2 text-xs">
        <span className="text-no">NO</span>
        <span className="text-yes">YES</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "25%" }}
        className="!bg-no"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "75%" }}
        className="!bg-yes"
      />
    </div>
  );
}
