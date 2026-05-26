import { motion } from "framer-motion";

export default function TimelineToast({ message }) {
  if (!message) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-1/2 z-[9999] w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-sky-200/30 bg-zinc-950/95 px-5 py-4 text-center text-sm font-black text-sky-50 shadow-2xl shadow-black/50 backdrop-blur"
      style={{ top: "max(1rem, env(safe-area-inset-top))", overflowWrap: "anywhere" }}
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.96 }}
    >
      {message}
    </motion.div>
  );
}
