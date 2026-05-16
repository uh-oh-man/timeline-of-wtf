import { motion } from "framer-motion";

export default function BackgroundLights() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_34%),linear-gradient(145deg,rgba(8,47,73,0.36),rgba(9,9,11,0.76)_42%,rgba(127,29,29,0.3))]" />

      <motion.div
        className="absolute -left-40 top-8 h-[34rem] w-[34rem] rounded-full bg-cyan-400/28 blur-[105px]"
        animate={{ x: [0, 100, 40, 0], y: [0, 80, 160, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 top-10 h-[36rem] w-[36rem] rounded-full bg-red-500/26 blur-[112px]"
        animate={{ x: [0, -140, -60, 0], y: [0, 130, 40, 0], scale: [1, 0.94, 1.1, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-12rem] left-1/3 h-[38rem] w-[38rem] rounded-full bg-indigo-500/22 blur-[124px]"
        animate={{ x: [0, 90, -120, 0], y: [0, -120, -60, 0], scale: [1, 1.12, 0.98, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.04),transparent_18%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,54px_54px,54px_54px] opacity-25" />
      <div className="absolute inset-0 bg-zinc-950/34" />
    </div>
  );
}
