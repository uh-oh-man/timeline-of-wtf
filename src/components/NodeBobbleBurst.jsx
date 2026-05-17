import { motion } from "framer-motion";

const bubbleOffsets = [
  { x: -18, y: -34, size: 9 },
  { x: 10, y: -44, size: 7 },
  { x: 30, y: -24, size: 11 },
  { x: -34, y: -18, size: 6 },
  { x: 2, y: -58, size: 5 },
];

export default function NodeBobbleBurst({ burst, graphWidth, graphHeight }) {
  if (!burst) return null;
  const colors = Array.isArray(burst.colors) && burst.colors.length ? burst.colors : ["#22d3ee", "#ef4444", "#ffffff"];

  return (
    <motion.div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${(burst.x / graphWidth) * 100}%`,
        top: `${(burst.y / graphHeight) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.65, ease: "easeOut" }}
    >
      {bubbleOffsets.map((bubble, index) => (
        <motion.span
          key={`${burst.id}-${index}`}
          className="absolute rounded-full"
          style={{
            height: bubble.size,
            width: bubble.size,
            left: -bubble.size / 2,
            top: -bubble.size / 2,
            backgroundColor: colors[index % colors.length],
            boxShadow: `0 0 16px ${colors[index % colors.length]}88`,
          }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
          animate={{
            x: bubble.x,
            y: bubble.y,
            scale: [0.4, 1.2, 0.9],
            opacity: [0, 0.95, 0],
          }}
          transition={{ duration: 1.25 + index * 0.08, ease: "easeOut" }}
        />
      ))}
      {burst.message ? (
        <motion.div
          className="absolute left-1/2 top-0 w-52 -translate-x-1/2 -translate-y-[4.8rem] rounded-2xl border border-white/15 bg-zinc-950/92 px-3 py-2 text-center text-[0.68rem] font-black text-sky-50 shadow-2xl shadow-black/45 backdrop-blur"
          initial={{ y: -48, opacity: 0, scale: 0.94 }}
          animate={{ y: [-48, -58, -64], opacity: [0, 1, 1, 0], scale: [0.94, 1, 1] }}
          transition={{ duration: 1.7, ease: "easeOut" }}
        >
          {burst.message}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
