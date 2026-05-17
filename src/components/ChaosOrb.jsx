import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateIdleOrbPosition,
  generateOrbPanicExit,
  generateOrbReturnPath,
} from "../utils/orbUtils";

const blobRadius = [
  "48% 52% 58% 42% / 45% 55% 48% 52%",
  "64% 36% 45% 55% / 58% 38% 62% 42%",
  "40% 60% 68% 32% / 36% 63% 37% 64%",
  "58% 42% 39% 61% / 62% 42% 58% 38%",
  "48% 52% 58% 42% / 45% 55% 48% 52%",
];

const hoverMessages = [
  "The orb noticed you noticing it.",
  "Stop staring at it.",
  "Orb suspicion rising.",
  "The anomaly is becoming self-conscious.",
  "You are making the orb uncomfortable.",
  "Observation detected. Panic pending.",
];

export default function ChaosOrb({ active, path, triggerKey, onComplete, onHoverTrigger }) {
  const [idle, setIdle] = useState(() => generateIdleOrbPosition());
  const [phase, setPhase] = useState("idle");
  const [panicPath, setPanicPath] = useState(null);
  const [returnPath, setReturnPath] = useState(null);
  const [hovering, setHovering] = useState(false);
  const [hoverMessage, setHoverMessage] = useState("");
  const hoverTimer = useRef(null);

  const clearHoverIntent = useCallback(() => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHovering(false);
    setHoverMessage("");
  }, []);

  useEffect(() => {
    if (!active || !path) return;

    clearHoverIntent();
    setPanicPath(generateOrbPanicExit(idle));
    setReturnPath(null);
    setPhase("panicExit");
  }, [active, clearHoverIntent, idle, path, triggerKey]);

  useEffect(() => {
    return () => window.clearTimeout(hoverTimer.current);
  }, []);

  const nextIdle = useMemo(() => {
    if (!returnPath) return idle;
    return {
      ...idle,
      x: returnPath.x[returnPath.x.length - 1],
      y: returnPath.y[returnPath.y.length - 1],
      driftX: [0, -24, 38, 0],
      driftY: [0, 30, -18, 0],
    };
  }, [idle, returnPath]);

  const orbStyle = {
    background:
      "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.92), rgba(125,211,252,0.52) 12%, transparent 23%), conic-gradient(from 115deg, #0ea5e9, #22d3ee, #1d4ed8, #7c3aed, #dc2626, #fb7185, #0ea5e9)",
    boxShadow:
      "0 0 34px rgba(34,211,238,0.82), 0 0 62px rgba(220,38,38,0.5), 0 0 96px rgba(59,130,246,0.26), inset -18px -16px 28px rgba(5,8,22,0.62), inset 14px 12px 24px rgba(255,255,255,0.34)",
    border: "1px solid rgba(255,255,255,0.38)",
  };

  const isIdle = phase === "idle";
  const isPanic = phase === "panicExit";
  const isReturn = phase === "returnToIdle";
  const activePath = isPanic ? panicPath : isReturn ? returnPath : path;
  const idleAnimate = {
    x: idle.driftX.map((value) => idle.x + value),
    y: idle.driftY.map((value) => idle.y + value),
    rotate: hovering ? [0, 10, -12, 8, 0] : [0, 80, -40, 0],
    scale: hovering ? [0.84, 0.92, 0.86, 0.94, 0.84] : [0.72, 0.9, 0.78, 0.72],
    opacity: hovering ? [0.34, 0.48, 0.36, 0.5] : [0.2, 0.28, 0.18, 0.2],
    filter: hovering ? "blur(6px)" : "blur(10px)",
    borderRadius: blobRadius,
  };
  const phaseAnimate = {
    x: activePath?.x || [idle.x],
    y: activePath?.y || [idle.y],
    rotate: activePath?.rotate || [0],
    scale: activePath?.scale || [0.8],
    opacity: isPanic ? [0.68, 0.96, 0.82] : isReturn ? [0.95, 0.55, 0.24] : [1, 1, 0.92],
    filter: isReturn ? ["blur(0px)", "blur(3px)", "blur(9px)"] : ["blur(0px)", "blur(0px)"],
    skewX: isPanic ? [0, -11, 9, 0] : isReturn ? [0, 5, -3, 0] : path?.wobble?.skewX || [0, -7, 8, -3, 0],
    skewY: isPanic ? [0, 8, -7, 0] : isReturn ? [0, -4, 2, 0] : path?.wobble?.skewY || [0, 5, -6, 4, 0],
    borderRadius: blobRadius,
  };

  function handleOrbPointerEnter() {
    if (!isIdle || active || hoverTimer.current) return;

    setHovering(true);
    setHoverMessage(hoverMessages[Math.floor(Math.random() * hoverMessages.length)]);
    hoverTimer.current = window.setTimeout(() => {
      clearHoverIntent();
      onHoverTrigger?.();
    }, 1200 + Math.random() * 600);
  }

  return (
    <>
      <motion.div
        className={[
          "fixed left-0 top-0 overflow-hidden rounded-full",
          isIdle ? "z-[1] h-40 w-40 pointer-events-auto" : "pointer-events-none z-[9999] h-28 w-28",
        ].join(" ")}
        style={orbStyle}
        initial={{ x: idle.x, y: idle.y, scale: 0.74, opacity: 0.18, filter: "blur(10px)" }}
        animate={isIdle ? idleAnimate : phaseAnimate}
        transition={
          isIdle
            ? { duration: hovering ? 0.42 : idle.duration, repeat: Infinity, ease: "easeInOut" }
            : {
                duration: isPanic
                  ? panicPath?.duration || 0.7
                  : isReturn
                    ? returnPath?.duration || 0.9
                    : path?.duration || 2.6,
                ease: "anticipate",
              }
        }
        onPointerEnter={handleOrbPointerEnter}
        onPointerLeave={clearHoverIntent}
        onPointerCancel={clearHoverIntent}
        onAnimationComplete={() => {
          if (phase === "panicExit") {
            setPhase("foregroundEscape");
            return;
          }

          if (phase === "foregroundEscape") {
            setReturnPath(generateOrbReturnPath(path, idle));
            setPhase("returnToIdle");
            return;
          }

          if (phase === "returnToIdle") {
            setIdle(nextIdle);
            setPhase("idle");
            onComplete?.();
          }
        }}
      >
        <motion.div
          className="absolute left-5 top-4 h-8 w-8 rounded-full bg-white/85 blur-[2px]"
          animate={{ x: [0, 26, 10, 0], y: [0, 15, 34, 0], opacity: [0.95, 0.35, 0.78, 0.95] }}
          transition={{ duration: path?.pulseDuration || 0.34, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border border-cyan-100/50"
          animate={{ scale: [0.72, 1.17, 0.84], rotate: [0, 70, -35, 0], opacity: [0.72, 0.18, 0.66] }}
          transition={{ duration: path?.pulseDuration || 0.36, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-6 -right-8 h-20 w-20 rounded-full bg-red-500/45 blur-xl"
          animate={{ scale: [0.8, 1.25, 0.9], opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: (path?.pulseDuration || 0.36) + 0.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <AnimatePresence>
        {hovering && hoverMessage ? (
          <motion.div
            className="pointer-events-none fixed z-[2] max-w-[13rem] rounded-2xl border border-cyan-200/20 bg-zinc-950/78 px-3 py-2 text-center text-[0.68rem] font-black text-cyan-50 shadow-2xl shadow-black/35 backdrop-blur"
            style={{ left: idle.x + 82, top: idle.y + 18 }}
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 0.82, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            {hoverMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
