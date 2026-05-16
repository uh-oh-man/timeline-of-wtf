import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import JokeButton from "./JokeButton";

export default function AgeGateModal({ message, onClose }) {
  if (!message) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      onPointerDown={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-[1.4rem] border border-red-300/30 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black"
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 18 }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/15 bg-red-950/70 px-5 py-4">
          <ShieldAlert className="h-7 w-7 text-red-100" aria-hidden="true" />
          <div>
            <h2 id="age-gate-title" className="text-xl font-black text-white">
              {message.title}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-red-100">{message.subtitle}</p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-zinc-100">{message.body}</p>

          <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
            <JokeButton
              type="button"
              onClick={onClose}
              reactionType="nervous"
              className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              {message.no}
            </JokeButton>
            <JokeButton
              type="button"
              onClick={onClose}
              reactionType="bureaucratic"
              className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
            >
              {message.yes}
            </JokeButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
