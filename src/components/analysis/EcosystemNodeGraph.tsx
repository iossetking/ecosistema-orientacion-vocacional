"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import "@xyflow/react/dist/style.css";
import type { CatalogDependency, MatrixRecord } from "@/types/matrix";
import {
  buildGraph,
  filterRecords,
  type GraphEdge,
  type GraphFilters,
  type GraphMode,
  type GraphNode,
} from "@/lib/analysis/graph-builder";

type SimNode = GraphNode & { x?: number; y?: number };

function layout(nodes: GraphNode[], edges: GraphEdge[]): Node[] {
  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
  const links = edges.map((e) => ({ source: e.source, target: e.target }));
  const simulation = forceSimulation(simNodes as never)
    .force(
      "link",
      forceLink(links)
        .id((d: unknown) => (d as { id: string }).id)
        .distance(140)
        .strength(0.2),
    )
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(90))
    .stop();
  simulation.tick(150);

  return simNodes.map((n) => ({
    id: n.id,
    type: n.kind === "record" ? "recordNode" : "hubNode",
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n,
  }));
}

function RecordNodeView({ data }: NodeProps) {
  const node = data as unknown as GraphNode;
  return (
    <div
      className="relative w-40 rounded-md border-2 bg-white px-2 py-1.5"
      style={{ borderColor: node.statusColor ?? "#9ca3af" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
      <p className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-700">
        {node.label}
      </p>
      <p className="mt-1 text-[9px] text-slate-400">Dimensión {node.dimensionId}</p>
    </div>
  );
}

function HubNodeView({ data }: NodeProps) {
  const node = data as unknown as GraphNode;
  return (
    <div
      className="relative rounded-full border px-3 py-1.5 text-[10px] font-semibold text-slate-800"
      style={{ backgroundColor: node.color ?? "#e2e8f0", borderColor: "#94a3b8" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
      {node.label}
    </div>
  );
}

const nodeTypes = { recordNode: RecordNodeView, hubNode: HubNodeView };

export default function EcosystemNodeGraph({
  records,
  dependencies,
  mode,
  filters,
  onSelectRecord,
}: {
  records: MatrixRecord[];
  dependencies: CatalogDependency[];
  mode: GraphMode;
  filters: GraphFilters;
  onSelectRecord: (record: MatrixRecord) => void;
}) {
  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);

  const graphData = useMemo(() => {
    const graph = buildGraph(filtered, mode);
    const dependencyNames = new Map<string, string>();
    for (const dep of dependencies) dependencyNames.set(`d:${dep.id}`, dep.name);
    const resolved = graph.nodes.map((n) =>
      n.kind === "dependency" ? { ...n, label: dependencyNames.get(n.id) ?? n.label } : n,
    );
    return {
      nodes: layout(resolved, graph.edges),
      edges: graph.edges.map((e) => ({ ...e, animated: true })) as Edge[],
      nameById: new Map(resolved.map((n) => [n.id, n])),
    };
  }, [filtered, mode, dependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  useEffect(() => {
    setNodes(graphData.nodes);
  }, [graphData.nodes, setNodes]);

  useEffect(() => {
    setEdges(graphData.edges);
  }, [graphData.edges, setEdges]);

  const nameById = graphData.nameById;

  return (
    <div className="h-[520px] rounded-lg border bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable
        fitView
        minZoom={0.15}
        onNodeClick={(_, node) => {
          const graphNode = nameById.get(node.id);
          if (graphNode?.kind === "record" && graphNode.recordId) {
            const record = records.find((r) => r.id === graphNode.recordId);
            if (record) onSelectRecord(record);
          }
        }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
