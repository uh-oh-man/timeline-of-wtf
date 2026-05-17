import { Award, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AchievementToast({ achievement, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(1);

  useEffect(() => {
    if (isDragging) return undefined;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [isDragging, onClose]);

  if (!achievement) return null;

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-[80] w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/94 text-zinc-100 shadow-2xl shadow-black/55 backdrop-blur"
      initial={{ opacity: 0, x: 42, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: exitDirection * 140, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.22}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        if (Math.abs(info.offset.x) > 100) {
          setExitDirection(info.offset.x < 0 ? -1 : 1);
          onClose();
        }
      }}
    >
      <motion.div
        className="h-1 bg-gradient-to-r from-cyan-300 via-blue-400 to-red-400"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.58, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
      />
      <div className="relative p-4">
        <motion.div
          className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl"
          animate={{ opacity: [0.28, 0.55, 0.25], scale: [0.9, 1.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex gap-3">
          <motion.div
            className="mt-1 grid h-12 w-12 flex-none place-items-center rounded-2xl border border-sky-200/35 bg-sky-500/15 text-sky-50 shadow-lg shadow-sky-950/30"
            animate={{ boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 22px rgba(34,211,238,0.28)", "0 0 0 rgba(248,113,113,0)"] }}
            transition={{ duration: 1.2, repeat: 1, ease: "easeInOut" }}
          >
            <Award className="h-5 w-5" aria-hidden="true" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-red-100" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-widest text-sky-100">
                Achievement Unlocked
              </p>
            </div>
            <h3 className="mt-1 text-lg font-black leading-tight text-white">{achievement.title}</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-200">{achievement.description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
