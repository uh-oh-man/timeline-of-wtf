import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { limeFruitAssets } from "../data/limeFruitAssets";
import { formatLimeNumber } from "../utils/numberFormat";

function getPosition(fruit, fallback) {
  const position = fruit?.position || fallback;
  return {
    left: `${Math.min(Math.max(Number(position?.xPercent || 50), 8), 88)}vw`,
    top: `${Math.min(Math.max(Number(position?.yPercent || 40), 12), 82)}vh`,
  };
}

function FruitImage({ type }) {
  const asset = limeFruitAssets[type] || limeFruitAssets.lemon;
  const candidates = [asset.localSrc, asset.fallbackLocalSrc, asset.rawGithubSrc].filter(Boolean);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = candidates[index] || "";

  if (failed || !src) {
    return <span className="text-6xl drop-shadow-[0_0_20px_rgba(255,255,255,0.28)]">{asset.fallbackText}</span>;
  }

  return (
    <img
      src={src}
      alt={asset.label}
      className="h-20 w-20 select-none object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.28)] sm:h-24 sm:w-24"
      draggable={false}
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((current) => current + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export default function LimeFruitOverlay({ fruitState, limeCount = 0, onClearLemon, onClearEggplant }) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!fruitState?.orange?.activeUntil) return undefined;
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [fruitState?.orange?.activeUntil]);

  const orangeSeconds = useMemo(() => {
    if (!fruitState?.orange?.activeUntil) return 0;
    return Math.max(0, Math.ceil((new Date(fruitState.orange.activeUntil).getTime() - nowTick) / 1000));
  }, [fruitState?.orange?.activeUntil, nowTick]);

  if (!portalTarget) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      <AnimatePresence>
        {fruitState?.lemon ? (
          <motion.button
            key={fruitState.lemon.id}
            type="button"
            onClick={onClearLemon}
            className="pointer-events-auto fixed flex min-h-28 min-w-28 -translate-x-1/2 -translate-y-1/2 touch-manipulation flex-col items-center justify-center rounded-full border border-yellow-200/45 bg-yellow-500/15 p-3 text-center shadow-[0_0_34px_rgba(250,204,21,0.3)] backdrop-blur focus:outline-none focus:ring-4 focus:ring-yellow-200/30"
            style={getPosition(fruitState.lemon, { xPercent: 24, yPercent: 45 })}
            initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
            animate={{ opacity: 1, scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
            exit={{ opacity: 0, scale: 0.5, y: 24 }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "mirror" }}
          >
            <FruitImage type="lemon" />
            <span className="mt-1 rounded-full border border-yellow-100/35 bg-black/45 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-yellow-50">
              stealing 25%
            </span>
          </motion.button>
        ) : null}

        {fruitState?.orange ? (
          <motion.div
            key={fruitState.orange.id}
            className="pointer-events-none fixed flex min-h-28 min-w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-orange-200/45 bg-orange-500/15 p-3 text-center shadow-[0_0_34px_rgba(251,146,60,0.32)] backdrop-blur"
            style={getPosition(fruitState.orange, { xPercent: 74, yPercent: 36 })}
            initial={{ opacity: 0, scale: 0.4, rotate: 12 }}
            animate={{ opacity: 1, scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            exit={{ opacity: 0, scale: 0.65, y: -24 }}
            transition={{ duration: 1.05, repeat: Infinity, repeatType: "mirror" }}
          >
            <FruitImage type="orange" />
            <span className="mt-1 rounded-full border border-orange-100/35 bg-black/45 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-orange-50">
              +30% | {orangeSeconds}s
            </span>
            {fruitState.orange.autoClicked ? (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none fixed left-1/2 top-1/2 h-8 w-5 rounded-sm border-l-[14px] border-t-[22px] border-l-white border-t-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.55)]"
                initial={{ opacity: 0, x: "-45vw", y: "42vh", rotate: -18, scale: 0.8 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: ["-45vw", "-8vw", "-2vw", "32vw"],
                  y: ["42vh", "6vh", "2vh", "-22vh"],
                  scale: [0.8, 1, 0.82, 0.9],
                }}
                transition={{ duration: 2.15, ease: "easeInOut" }}
              />
            ) : null}
          </motion.div>
        ) : null}

        {fruitState?.eggplant ? (
          <motion.button
            key={fruitState.eggplant.id}
            type="button"
            onClick={onClearEggplant}
            className="pointer-events-auto fixed flex min-h-28 min-w-28 -translate-x-1/2 -translate-y-1/2 touch-manipulation flex-col items-center justify-center rounded-full border border-fuchsia-200/45 bg-fuchsia-500/15 p-3 text-center shadow-[0_0_34px_rgba(217,70,239,0.32)] backdrop-blur focus:outline-none focus:ring-4 focus:ring-fuchsia-200/30"
            style={getPosition(fruitState.eggplant, { xPercent: 50, yPercent: 48 })}
            initial={{ opacity: 0, scale: 0.45, rotate: 10 }}
            animate={{ opacity: 1, scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
            exit={{ opacity: 0, scale: 0.55, y: 24 }}
            transition={{ duration: 0.95, repeat: Infinity, repeatType: "mirror" }}
          >
            <FruitImage type="eggplant" />
            <span className="mt-1 rounded-full border border-fuchsia-100/35 bg-black/45 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-fuchsia-50">
              auto halted
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
      {fruitState?.lemon && Number(limeCount) < 0 ? (
        <div className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-red-300/35 bg-red-950/90 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-red-50 shadow-2xl shadow-black/45">
          Citrus debt: {formatLimeNumber(limeCount)} limes
        </div>
      ) : null}
    </div>,
    portalTarget,
  );
}
