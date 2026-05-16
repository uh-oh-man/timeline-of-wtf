import { Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import { buildGameGraph } from "../utils/graphUtils";

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export default function NodeWebModal({ disasters, onClose }) {
  const graph = useMemo(() => buildGameGraph(disasters), [disasters]);
  const graphRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);

  useEffect(() => {
    setNodePositions(
      Object.fromEntries(graph.nodes.map((node) => [node.id, { x: node.x, y: node.y }])),
    );
  }, [graph.nodes]);

  const pointFromPointer = useCallback((event) => {
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * graph.width, 46, graph.width - 46),
      y: clamp(((event.clientY - rect.top) / rect.height) * graph.height, 46, graph.height - 46),
    };
  }, [graph.height, graph.width]);

  useEffect(() => {
    if (!draggingNodeId) return undefined;

    function handlePointerMove(event) {
      const nextPoint = pointFromPointer(event);
      if (!nextPoint) return;
      setNodePositions((current) => ({
        ...current,
        [draggingNodeId]: nextPoint,
      }));
    }

    function handlePointerUp() {
      setDraggingNodeId(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingNodeId, pointFromPointer]);

  function getPoint(nodeId) {
    const point = nodePositions[nodeId];
    if (point) return point;
    const fallback = graph.nodes.find((node) => node.id === nodeId);
    return fallback || { x: 0, y: 0 };
  }

  function handleNodePointerDown(event, nodeId) {
    event.preventDefault();
    event.stopPropagation();
    setDraggingNodeId(nodeId);
    const nextPoint = pointFromPointer(event);
    if (nextPoint) {
      setNodePositions((current) => ({
        ...current,
        [nodeId]: nextPoint,
      }));
    }
  }

  return (
    <FloatingWindow
      title="Live Node Web"
      subtitle="Games only. The note spaghetti got fired."
      onClose={onClose}
      widthClass="max-w-6xl"
      bodyClassName="bg-zinc-950 p-4"
    >
      {graph.nodes.length ? (
        <div
          ref={graphRef}
          className="relative mx-auto min-h-[420px] w-full max-w-[900px] overflow-hidden rounded-3xl border border-white/15 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.16),transparent_35%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,38px_38px,38px_38px]"
          style={{ aspectRatio: `${graph.width} / ${graph.height}` }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${graph.width} ${graph.height}`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="node-web-link" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.9)" />
                <stop offset="52%" stopColor="rgba(99,102,241,0.8)" />
                <stop offset="100%" stopColor="rgba(248,113,113,0.86)" />
              </linearGradient>
            </defs>
            {graph.links.map((link) => {
              const source = getPoint(link.source);
              const target = getPoint(link.target);

              return (
                <line
                  key={`${link.source}-${link.target}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="url(#node-web-link)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {graph.nodes.map((node, index) => {
            const point = getPoint(node.id);
            const isDragging = draggingNodeId === node.id;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: `${(point.x / graph.width) * 100}%`,
                  top: `${(point.y / graph.height) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <motion.button
                  type="button"
                  title={node.label}
                  onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                  className="flex h-24 w-24 touch-none select-none items-center justify-center rounded-full border-2 border-white/80 p-3 text-center text-xs font-black leading-4 text-white shadow-lg outline-none transition hover:border-red-100 hover:text-white focus:ring-4 focus:ring-sky-300/30"
                  style={{
                  background: index % 2 === 0 ? "rgba(2,132,199,0.96)" : "rgba(220,38,38,0.94)",
                  boxShadow:
                    index % 2 === 0 ? "0 0 30px rgba(14,165,233,0.38)" : "0 0 30px rgba(220,38,38,0.38)",
                  cursor: isDragging ? "grabbing" : "grab",
                  }}
                  animate={{ scale: isDragging ? 1.16 : 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 24)}...` : node.label}
                </motion.button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto grid min-h-[520px] max-w-3xl place-items-center rounded-3xl border border-dashed border-white/20 bg-black/30 p-8 text-center">
          <div>
            <Cpu className="mx-auto h-12 w-12 text-red-200" aria-hidden="true" />
            <h3 className="mt-4 text-2xl font-black text-white">No game nodes yet</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-100">
              Add disasters and directly connect games. The web only shows game-to-game links, because the note
              spaghetti got fired.
            </p>
          </div>
        </div>
      )}
    </FloatingWindow>
  );
}
