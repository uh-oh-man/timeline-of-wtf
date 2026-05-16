import { createPortal } from "react-dom";
import { motion } from "framer-motion";

function getOverlayPosition(rect) {
  if (!rect) return { left: "50vw", top: "50vh", transform: "translate(-50%, -50%)" };

  return {
    left: rect.left + rect.width / 2,
    top: Math.max(18, rect.top - 12),
  };
}

function Bubble({ message, rect, type }) {
  const position = getOverlayPosition(rect);

  return (
    <motion.div
      data-twtaf-reaction-overlay
      className="pointer-events-none fixed z-[10000] max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-2xl border border-white/20 bg-zinc-950/96 px-3 py-2 text-center text-[0.7rem] font-black text-sky-50 shadow-2xl shadow-black/50 backdrop-blur"
      style={position}
      initial={{ opacity: 0, y: 8, scale: 0.88 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [8, -4, -8, -14],
        scale: type === "spark" ? [0.88, 1.08, 1, 0.96] : [0.88, 1, 1, 0.96],
      }}
      transition={{ duration: 0.72, ease: "easeOut" }}
    >
      {message}
      {type === "spark" ? (
        <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
      ) : null}
    </motion.div>
  );
}

function Progress({ message, rect }) {
  const position = getOverlayPosition(rect);

  return (
    <motion.div
      data-twtaf-reaction-overlay
      className="pointer-events-none fixed z-[10000] w-[15rem] -translate-x-1/2 -translate-y-full rounded-2xl border border-sky-200/25 bg-zinc-950/96 p-3 text-xs font-black text-sky-50 shadow-2xl shadow-black/50 backdrop-blur"
      style={position}
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: [0, 1, 1, 0], y: [10, -2, -5, -10], scale: [0.94, 1, 1, 0.98] }}
      transition={{ duration: 0.86, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        <span className="rounded-full border border-red-200/25 bg-red-500/15 px-2 py-0.5 text-[0.6rem] text-red-50">
          FILED
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-red-400"
          initial={{ width: "3%" }}
          animate={{ width: ["3%", "48%", "76%", "100%"] }}
          transition={{ duration: 0.62, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

function OrbPulse({ message, rect }) {
  const position = getOverlayPosition(rect);

  return (
    <motion.div
      data-twtaf-reaction-overlay
      className="pointer-events-none fixed z-[10000] -translate-x-1/2 -translate-y-full"
      style={position}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.72 }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/55 shadow-[0_0_24px_rgba(34,211,238,0.7)]"
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 1.65, opacity: 0 }}
        transition={{ duration: 0.68, ease: "easeOut" }}
      />
      <div className="relative rounded-2xl border border-cyan-200/25 bg-[linear-gradient(135deg,rgba(14,165,233,0.96),rgba(127,29,29,0.96))] px-3 py-2 text-center text-[0.7rem] font-black text-white shadow-2xl shadow-black/50">
        {message}
      </div>
    </motion.div>
  );
}

function Stamp({ message, rect }) {
  const position = getOverlayPosition(rect);

  return (
    <motion.div
      data-twtaf-reaction-overlay
      className="pointer-events-none fixed z-[10000] -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-red-300/80 bg-zinc-950/92 px-4 py-2 text-xl font-black uppercase tracking-[0.18em] text-red-100 shadow-2xl shadow-black/60"
      style={{ left: position.left, top: rect ? rect.top + rect.height / 2 : position.top }}
      initial={{ opacity: 0, scale: 1.8, rotate: -18 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [1.8, 0.95, 1, 0.9], rotate: [-18, -8, -6, -4] }}
      transition={{ duration: 0.78, ease: "easeOut" }}
    >
      {message}
    </motion.div>
  );
}

export default function ReactionOverlay({ reaction, rect }) {
  if (!reaction || typeof document === "undefined") return null;

  const overlay = reaction.overlay || "bubble";
  const message = reaction.message;

  const content =
    overlay === "progress" ? (
      <Progress message={message} rect={rect} />
    ) : overlay === "orb" ? (
      <OrbPulse message={message} rect={rect} />
    ) : overlay === "stamp" ? (
      <Stamp message={message} rect={rect} />
    ) : (
      <Bubble message={message} rect={rect} type={overlay} />
    );

  return createPortal(content, document.body);
}
