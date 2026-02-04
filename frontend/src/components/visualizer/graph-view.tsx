"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useRef, useEffect } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Cargando visualizador...
    </div>
  ),
});

// Cambio 1: id puede ser string | number | undefined para compatibilidad con react-force-graph
interface GraphNode {
  id?: string | number;
  labels?: string[];
  properties?: Record<string, unknown>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

interface GraphLink {
  source: string | number | GraphNode;
  target: string | number | GraphNode;
  type?: string;
  properties?: Record<string, unknown>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function GraphView({ data }: { data: GraphData }) {
  const { theme } = useTheme();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(undefined);

  // Ajustar colores según tema claro/oscuro
  const bgColor = theme === "dark" ? "#020617" : "#ffffff";
  const nodeColor = theme === "dark" ? "#6366f1" : "#4f46e5"; // Indigo
  const textColor = theme === "dark" ? "#e2e8f0" : "#1e293b";

  useEffect(() => {
    const graph = graphRef.current;
    if (graph) {
      const chargeForce = graph.d3Force("charge");
      if (chargeForce && typeof chargeForce.strength === "function") {
        chargeForce.strength(-120);
      }
      setTimeout(() => {
        if (graph?.zoomToFit) {
          graph.zoomToFit(400, 20);
        }
      }, 500);
    }
  }, [data]);

  return (
    <div className="border rounded-lg overflow-hidden h-125 w-full bg-slate-50 dark:bg-slate-950 shadow-inner">
      <ForceGraph2D
        ref={graphRef}
        width={800}
        height={500}
        graphData={data}
        backgroundColor={bgColor}
        nodeLabel="labels"
        nodeColor={() => nodeColor}
        linkColor={() => (theme === "dark" ? "#475569" : "#cbd5e1")}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObject={(
          node: GraphNode,
          ctx: CanvasRenderingContext2D,
          globalScale: number,
        ) => {
          const label =
            (node.properties?.name as string) ||
            node.labels?.[0] ||
            String(node.id);
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          if (typeof node.x === "number" && typeof node.y === "number") {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = nodeColor;
            ctx.fill();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = textColor;
            ctx.fillText(label, node.x, node.y + 8);
          }
        }}
      />
    </div>
  );
}
