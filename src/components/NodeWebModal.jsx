import { Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import NodeBobbleBurst from "./NodeBobbleBurst";
import { nodeCollisionReactions } from "../data/nodeCollisionReactions";
import { buildGameGraph } from "../utils/graphUtils";
import { getGameNodeColor, mixHexColors } from "../utils/colorUtils";
import { pickRandom } from "../utils/helpers";

const NODE_BASH_ACHIEVEMENT_THRESHOLD = 7;
const NODE_COLLISION_DISTANCE = 92;
const NODE_COLLISION_COOLDOWN = 430;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export default function NodeWebModal({ disasters, onClose, onNodeBashAchievement }) {
  const graph = useMemo(() => buildGameGraph(disasters), [disasters]);
  const graphRef = useRef(null);
  const burstTimers = useRef([]);
  const bashTracker = useRef({ count: 0, lastHitByPair: {}, achievementUnlocked: false });
  const nodePositionsRef = useRef({});
  const [nodePositions, setNodePositions] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [bashedNodes, setBashedNodes] = useState({});
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    setNodePositions(
      Object.fromEntries(graph.nodes.map((node) => [node.id, { x: node.x, y: node.y }])),
    );
  }, [graph.nodes]);

  useEffect(() => {
    nodePositionsRef.current = nodePositions;
  }, [nodePositions]);

  useEffect(() => {
    return () => {
      burstTimers.current.forEach((timer) => window.clearTimeout(timer));
      burstTimers.current = [];
    };
  }, []);

  const pointFromPointer = useCallback((event) => {
    const rect = graphRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * graph.width, 46, graph.width - 46),
      y: clamp(((event.clientY - rect.top) / rect.height) * graph.height, 46, graph.height - 46),
    };
  }, [graph.height, graph.width]);

  const getPoint = useCallback((nodeId) => {
    const point = nodePositionsRef.current[nodeId];
    if (point) return point;
    const fallback = graph.nodes.find((node) => node.id === nodeId);
    return fallback || { x: 0, y: 0 };
  }, [graph.nodes]);

  const addBurst = useCallback((draggedNodeId, targetNodeId, point) => {
    const showMessage = bashTracker.current.count % 2 === 0 || Math.random() < 0.28;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const draggedColor = getGameNodeColor(draggedNodeId, disasters);
    const targetColor = getGameNodeColor(targetNodeId, disasters);
    const mixedColor = mixHexColors(draggedColor, targetColor);
    const burst = {
      id,
      nodeId: targetNodeId,
      x: point.x,
      y: point.y,
      message: showMessage ? pickRandom(nodeCollisionReactions) : "",
      colors: [draggedColor, targetColor, mixedColor],
    };

    setBursts((current) => [...current.slice(-9), burst]);
    const timer = window.setTimeout(() => {
      setBursts((current) => current.filter((item) => item.id !== id));
    }, 1850);
    burstTimers.current.push(timer);
  }, [disasters]);

  const registerCollision = useCallback((draggedNodeId, draggedPoint) => {
    const now = performance.now();
    const targetNode = graph.nodes.find((node) => {
      if (node.id === draggedNodeId) return false;
      const targetPoint = getPoint(node.id);
      const distance = Math.hypot(draggedPoint.x - targetPoint.x, draggedPoint.y - targetPoint.y);
      return distance <= NODE_COLLISION_DISTANCE;
    });

    if (!targetNode) return;

    const pairKey = `${draggedNodeId}->${targetNode.id}`;
    const lastHit = bashTracker.current.lastHitByPair[pairKey] || 0;
    if (now - lastHit < NODE_COLLISION_COOLDOWN) return;

    const targetPoint = getPoint(targetNode.id);
    bashTracker.current.lastHitByPair[pairKey] = now;
    bashTracker.current.count += 1;
    setBashedNodes((current) => ({
      ...current,
      [targetNode.id]: (current[targetNode.id] || 0) + 1,
    }));
    addBurst(draggedNodeId, targetNode.id, targetPoint);

    if (
      !bashTracker.current.achievementUnlocked &&
      bashTracker.current.count >= NODE_BASH_ACHIEVEMENT_THRESHOLD
    ) {
      bashTracker.current.achievementUnlocked = true;
      onNodeBashAchievement?.();
    }
  }, [addBurst, getPoint, graph.nodes, onNodeBashAchievement]);

  useEffect(() => {
    if (!draggingNodeId) return undefined;

    function handlePointerMove(event) {
      const nextPoint = pointFromPointer(event);
      if (!nextPoint) return;
      setNodePositions((current) => ({
        ...current,
        [draggingNodeId]: nextPoint,
      }));
      registerCollision(draggingNodeId, nextPoint);
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
  }, [draggingNodeId, pointFromPointer, registerCollision]);

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

          {graph.nodes.map((node) => {
            const point = getPoint(node.id);
            const isDragging = draggingNodeId === node.id;
            const bashCount = bashedNodes[node.id] || 0;
            const nodeColor = getGameNodeColor(node.label, disasters);

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
                  background: nodeColor,
                  boxShadow: `0 0 30px ${nodeColor}66`,
                  cursor: isDragging ? "grabbing" : "grab",
                  }}
                  animate={
                    isDragging
                      ? { scale: 1.16, rotate: 0 }
                      : bashCount
                        ? { scale: [1, 0.9, 1.13, 1], rotate: [0, -5, 5, 0] }
                        : { scale: 1, rotate: 0 }
                  }
                  transition={
                    isDragging
                      ? { type: "spring", stiffness: 260, damping: 18 }
                      : { duration: 0.42, ease: "easeOut" }
                  }
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 24)}...` : node.label}
                </motion.button>
              </div>
            );
          })}
          {bursts.map((burst) => (
            <NodeBobbleBurst
              key={burst.id}
              burst={burst}
              graphWidth={graph.width}
              graphHeight={graph.height}
            />
          ))}
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
