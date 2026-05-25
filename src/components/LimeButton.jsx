import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function LimeButton({ onOpen }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, scale: 0.5, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 19 }}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-lime-300/40 bg-lime-500/15 px-4 py-2 text-xs font-black lowercase tracking-wide text-lime-100 shadow-[0_0_18px_rgba(132,204,22,0.35)] transition hover:bg-lime-500/25 focus:outline-none focus:ring-4 focus:ring-lime-300/25"
    >
      <Sparkles className="h-4 w-4" aria-hidden="true" />
      lime
    </motion.button>
  );
}
