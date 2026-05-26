import { motion } from "framer-motion";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculateFruitUpgradeCost,
  canAffordFruitUpgrade,
} from "../services/clickers/fruitClickerMath";
import { getFruitCount, getFruitTotalEarned } from "../services/clickers/fruitClickerStorage";
import { formatLimeNumber, formatRate } from "../utils/numberFormat";
import { cx } from "../utils/helpers";

function Stat({ label, value }) {
  return (
    <article className="rounded-2xl border border-white/12 bg-black/25 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </article>
  );
}

function buildImageCandidates(game, rareVariantEnabled) {
  const assets = game?.imageAssets || {};
  const primary = [assets.localSrc, assets.fallbackLocalSrc, assets.rawGithubSrc].filter(Boolean);
  if (!rareVariantEnabled || !assets.rareVariant) return primary;
  const rare = assets.rareVariant;
  return [rare.localSrc, rare.fallbackLocalSrc, rare.rawGithubSrc, ...primary].filter(Boolean);
}

function currencyLabel(game, value) {
  return `${formatLimeNumber(value)} ${game?.currencyName || "fruit"}`;
}

export default function FruitClickerPanel({
  game,
  state,
  perClick,
  perSecond,
  saveStatus = "Saved",
  offlineGains = 0,
  onClickFruit,
  onPurchaseUpgrade,
  utilityChildren = null,
  onReset = null,
  resetLabel = "Reset Progress",
  resetConfirmText = "Reset this fruit progress?",
  rareVariantEnabled = false,
  isUpgradeMaxed,
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [floatingBursts, setFloatingBursts] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const imageCandidates = useMemo(() => buildImageCandidates(game, rareVariantEnabled), [game, rareVariantEnabled]);
  const currentImage = imageCandidates[imageIndex] || "";
  const count = getFruitCount(game.id, state);
  const totalEarned = getFruitTotalEarned(game.id, state);
  const upgrades = useMemo(
    () =>
      (game.upgrades || []).map((upgrade) => {
        const level = Number(state?.upgrades?.[upgrade.id] || 0);
        const maxed = isUpgradeMaxed?.(upgrade, state) || (
          upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel
        );
        return {
          ...upgrade,
          level,
          maxed,
          cost: calculateFruitUpgradeCost(game.id, upgrade, level, state),
          affordable: !maxed && canAffordFruitUpgrade(game.id, state, upgrade),
        };
      }),
    [game, isUpgradeMaxed, state],
  );

  function spawnFloatBurst() {
    const burst = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: Math.random() * 50 - 25,
      y: Math.random() * 24 - 12,
      value: `+${formatRate(perClick)}`,
    };
    setFloatingBursts((current) => [...current, burst]);
    window.setTimeout(() => {
      setFloatingBursts((current) => current.filter((entry) => entry.id !== burst.id));
    }, 600);
  }

  function handleClickFruit() {
    spawnFloatBurst();
    onClickFruit();
  }

  function handleImageError() {
    if (imageIndex < imageCandidates.length - 1) {
      setImageIndex((current) => current + 1);
      return;
    }
    setImageFailed(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <section className="grid gap-4">
        <article className="rounded-3xl border border-lime-300/30 bg-lime-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-100">total</p>
          <p className="mt-1 text-4xl font-black text-white">{currencyLabel(game, count)}</p>
          <p className="mt-2 text-xs text-lime-100/90">{saveStatus || "Saved"}</p>
          {offlineGains > 0.1 ? (
            <p className="mt-2 text-xs text-zinc-200">
              While you were gone, the {game.singularCurrencyName} produced {currencyLabel(game, offlineGains)}.
            </p>
          ) : null}
        </article>

        <div className="grid grid-cols-2 gap-3">
          <Stat label={`${game.currencyName} / click`} value={formatRate(perClick)} />
          <Stat label={`${game.currencyName} / second`} value={formatRate(perSecond)} />
          <Stat label="Total clicks" value={formatLimeNumber(state?.totalClicks || 0)} />
          <Stat label={`Lifetime ${game.currencyName}`} value={formatLimeNumber(totalEarned)} />
        </div>

        <div className="relative flex items-center justify-center rounded-3xl border border-white/12 bg-black/30 p-5">
          <button
            type="button"
            onClick={handleClickFruit}
            className="group relative flex h-52 w-52 touch-manipulation items-center justify-center rounded-full border border-lime-300/25 bg-lime-500/15 shadow-[0_0_34px_rgba(132,204,22,0.22)] transition hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-4 focus:ring-lime-300/30"
          >
            {!imageFailed && currentImage ? (
              <img
                src={currentImage}
                alt={game.name}
                className="h-44 w-44 select-none object-contain drop-shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                onError={handleImageError}
                draggable={false}
              />
            ) : (
              <span className="inline-flex h-36 w-36 items-center justify-center rounded-full border border-lime-300/35 bg-lime-500/15 px-4 text-center text-2xl font-black uppercase tracking-[0.18em] text-lime-100">
                {game.imageAssets?.fallbackLabel || game.name}
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

        {(onReset || utilityChildren) ? (
          <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
            {showResetConfirm ? (
              <div className="grid gap-3">
                <p className="text-sm text-red-50">{resetConfirmText}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onReset?.();
                      setShowResetConfirm(false);
                    }}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/30"
                  >
                    {resetLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="rounded-xl border border-white/15 bg-zinc-900 px-4 py-2 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                  >
                    Keep The Fruit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {onReset ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20 focus:outline-none focus:ring-4 focus:ring-red-300/30"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {resetLabel}
                  </button>
                ) : null}
                {utilityChildren}
              </div>
            )}
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
                  {upgrade.maxed ? "Owned" : `Cost: ${formatLimeNumber(upgrade.cost)}`}
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
                {upgrade.maxed ? "Owned" : "Buy Upgrade"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
