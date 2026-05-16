import { motion } from "framer-motion";

const lines = [
  "ADMIN MODE ENGAGED",
  "Unlocking forbidden buttons...",
  "Bribing the orb...",
  "Disabling common sense...",
  "Opening restricted nonsense drawer...",
  "Dev Goblin Mode online.",
];

export default function AdminModeOverlay({ active }) {
  if (!active) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[95] grid place-items-center bg-[radial-gradient(circle,rgba(14,165,233,0.24),rgba(127,29,29,0.28),rgba(0,0,0,0.74))] backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 3.6, times: [0, 0.14, 0.86, 1] }}
    >
      <motion.div
        className="w-[min(34rem,calc(100vw-2rem))] rounded-3xl border border-sky-200/35 bg-zinc-950/92 p-6 font-mono text-sm text-sky-50 shadow-2xl shadow-sky-950/50"
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: [0.96, 1.02, 1], y: [12, -4, 0] }}
        transition={{ duration: 0.9 }}
      >
        {lines.map((line, index) => (
          <motion.div
            key={line}
            className={index === 0 ? "text-lg font-black text-red-100" : "mt-2 text-sky-100"}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 + index * 0.38, duration: 0.28 }}
          >
            &gt; {line}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
