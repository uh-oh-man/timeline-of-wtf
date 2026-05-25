import { motion } from "framer-motion";
import { RefreshCw, ShoppingCart, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import LimevementsPanel from "./LimevementsPanel";
import { limeConfig } from "../data/limeConfig";
import { limeUpgrades } from "../data/limeUpgrades";
import { calculateUpgradeCost, canAffordUpgrade } from "../services/lime/limeMath";
import { formatLimeNumber, formatLimesLabel, formatRate } from "../utils/numberFormat";
import { cx } from "../utils/helpers";

const IMAGE_CANDIDATES = [limeConfig.localSrc, limeConfig.fallbackLocalSrc, limeConfig.rawGithubSrc].filter(Boolean);

function Stat({ label, value }) {
  return (
    <article className="rounded-2xl border border-white/12 bg-black/25 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </article>
  );
}

export default function LimeClickerWindow({
  state,
  limesPerClick,
  limesPerSecond,
  saveStatus,
  offlineGains,
  onClickLime,
  onPurchaseUpgrade,
  onClose,
  onReset,
  limeMode = "solo",
  onSetLimeMode,
  onHostMultiplayer,
  onJoinMultiplayer,
  onDisconnectMultiplayer,
  multiplayerSessionName = "",
  multiplayerPeersCount = 0,
  multiplayerSyncStatus = "No multiplayer session active.",
  fruitState = null,
  onClearLemon,
  limevementsState = null,
  limevementsOpen = false,
  onToggleLimevements,
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [floatingBursts, setFloatingBursts] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const currentImage = IMAGE_CANDIDATES[imageIndex] || "";
  const upgrades = useMemo(
    () =>
      limeUpgrades.map((upgrade) => {
        const level = Number(state?.upgrades?.[upgrade.id] || 0);
        return {
          ...upgrade,
          level,
          cost: calculateUpgradeCost(upgrade, level),
          affordable: canAffordUpgrade(state, upgrade),
        };
      }),
    [state],
  );

  function spawnFloatBurst() {
    const burst = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: Math.random() * 50 - 25,
      y: Math.random() * 24 - 12,
      value: `+${formatRate(limesPerClick)}`,
    };
    setFloatingBursts((current) => [...current, burst]);
    window.setTimeout(() => {
      setFloatingBursts((current) => current.filter((entry) => entry.id !== burst.id));
    }, 600);
  }

  function handleClickLime() {
    spawnFloatBurst();
    onClickLime();
  }

  function handleImageError() {
    if (imageIndex < IMAGE_CANDIDATES.length - 1) {
      setImageIndex((current) => current + 1);
      return;
    }
    setImageFailed(true);
  }

  return (
    <FloatingWindow
      title="lime"
      subtitle="Fruit-based productivity simulator"
      onClose={onClose}
      widthClass="max-w-5xl"
      zIndexClass="z-[69]"
      bodyClassName="bg-zinc-950 p-4 md:p-5"
    >
      <div className="grid gap-4">
        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSetLimeMode?.("solo")}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                limeMode === "solo"
                  ? "border-sky-200/35 bg-sky-500/20 text-sky-50"
                  : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
              )}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => onSetLimeMode?.("multiplayer")}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                limeMode === "multiplayer"
                  ? "border-emerald-300/35 bg-emerald-500/20 text-emerald-50"
                  : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
              )}
            >
              Multiplayer
            </button>
            <span className="text-xs text-zinc-400">Mode: {limeMode === "multiplayer" ? "Multiplayer" : "Solo"}</span>
          </div>
          {limeMode === "multiplayer" ? (
            <div className="mt-3 grid gap-2">
              <p className="text-xs text-zinc-300">
                Session: {multiplayerSessionName || "Lime Session"} | Peers: {multiplayerPeersCount}
              </p>
              <p className="text-xs text-zinc-400">{multiplayerSyncStatus}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onHostMultiplayer}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Host Lime Session
                </button>
                <button
                  type="button"
                  onClick={onJoinMultiplayer}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-300/30 bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/25"
                >
                  Join Lime Session
                </button>
                <button
                  type="button"
                  onClick={onDisconnectMultiplayer}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-200 transition hover:bg-zinc-800"
                >
                  Switch to Local Lime
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {fruitState?.lemon ? (
          <section className="rounded-3xl border border-yellow-300/30 bg-yellow-500/10 p-4">
            <p className="text-sm font-black text-yellow-50">Lemon detected: -25% limes every 2s.</p>
            <button
              type="button"
              onClick={onClearLemon}
              className="mt-2 rounded-xl border border-yellow-300/30 bg-yellow-500/20 px-3 py-2 text-xs font-black text-yellow-50 transition hover:bg-yellow-500/30"
            >
              Click lemon to remove
            </button>
          </section>
        ) : null}
        {fruitState?.orange ? (
          <section className="rounded-3xl border border-orange-300/30 bg-orange-500/10 p-4">
            <p className="text-sm font-black text-orange-50">Orange Boost: +30% click/passive production.</p>
            <p className="mt-1 text-xs text-orange-100">20-second boost active while timer lasts.</p>
          </section>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="grid gap-4">
          <article className="rounded-3xl border border-lime-300/30 bg-lime-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-100">total</p>
            <p className="mt-1 text-4xl font-black text-white">{formatLimesLabel(state?.limeCount || 0)}</p>
            <p className="mt-2 text-xs text-lime-100/90">
              {saveStatus || "Saved"}
            </p>
            {offlineGains > 0.1 ? (
              <p className="mt-2 text-xs text-zinc-200">
                While you were gone, the lime produced {formatLimeNumber(offlineGains)} limes.
              </p>
            ) : null}
          </article>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Limes / click" value={formatRate(limesPerClick)} />
            <Stat label="Limes / second" value={formatRate(limesPerSecond)} />
            <Stat label="Total clicks" value={formatLimeNumber(state?.totalClicks || 0)} />
            <Stat label="Lifetime limes" value={formatLimeNumber(state?.totalLimesEarned || 0)} />
          </div>

          <div className="relative flex items-center justify-center rounded-3xl border border-white/12 bg-black/30 p-5">
            <button
              type="button"
              onClick={handleClickLime}
              className="group relative flex h-52 w-52 touch-manipulation items-center justify-center rounded-full border border-lime-300/25 bg-lime-500/15 shadow-[0_0_34px_rgba(132,204,22,0.22)] transition hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-lime-300/30"
            >
              {!imageFailed && currentImage ? (
                <img
                  src={currentImage}
                  alt="lime"
                  className="h-44 w-44 select-none object-contain drop-shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                  onError={handleImageError}
                  draggable={false}
                />
              ) : (
                <span className="inline-flex h-36 w-36 items-center justify-center rounded-full border border-lime-300/35 bg-lime-500/15 text-5xl">
                  🍋
                </span>
              )}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-lime-200/0 transition group-active:bg-lime-200/20" />
            </button>
            {floatingBursts.map((burst) => (
              <motion.span
                key={burst.id}
                initial={{ opacity: 0, y: 0, x: burst.x }}
                animate={{ opacity: 1, y: -42, x: burst.x + 6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.58, ease: "easeOut" }}
                className="pointer-events-none absolute text-sm font-black text-lime-100"
                style={{ transform: `translate(${burst.x}px, ${burst.y}px)` }}
              >
                {burst.value}
              </motion.span>
            ))}
          </div>

          <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
            {showResetConfirm ? (
              <div className="grid gap-3">
                <p className="text-sm text-red-50">Reset lime progress? Your friend will feel less productive.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setShowResetConfirm(false);
                    }}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/30"
                  >
                    Reset Lime
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-2 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                  >
                    Keep The Citrus
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20 focus:outline-none focus:ring-4 focus:ring-red-300/30"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset Lime Progress
                </button>
                <button
                  type="button"
                  onClick={onToggleLimevements}
                  className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-500/10 px-3 py-2 text-xs font-black text-lime-100 transition hover:bg-lime-500/20 focus:outline-none focus:ring-4 focus:ring-lime-300/25"
                >
                  <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                  Limevements
                </button>
              </div>
            )}
          </div>

          {limevementsOpen ? (
            <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
              <LimevementsPanel state={limevementsState} />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-zinc-200">
            <ShoppingCart className="h-4 w-4 text-lime-100" aria-hidden="true" />
            Upgrade Shop
          </h3>
          <div className="mt-3 grid gap-3">
            {upgrades.map((upgrade) => (
              <article key={upgrade.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-white">{upgrade.name}</h4>
                    <p className="text-xs text-zinc-400">Level {upgrade.level}</p>
                  </div>
                  <span className="rounded-full border border-lime-300/30 bg-lime-500/10 px-3 py-1 text-xs font-black text-lime-100">
                    Cost: {formatLimeNumber(upgrade.cost)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-200">{upgrade.description}</p>
                <p className="mt-1 text-xs text-zinc-400">{upgrade.effect}</p>
                <button
                  type="button"
                  disabled={!upgrade.affordable}
                  onClick={() => onPurchaseUpgrade(upgrade.id)}
                  className={cx(
                    "mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-4",
                    upgrade.affordable
                      ? "border-lime-300/30 bg-lime-500/15 text-lime-50 hover:bg-lime-500/25 focus:ring-lime-300/25"
                      : "cursor-not-allowed border-white/10 bg-zinc-900 text-zinc-500 focus:ring-zinc-500/20",
                  )}
                >
                  Buy Upgrade
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
      </div>
    </FloatingWindow>
  );
}
