import { Sparkles, X } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import {
  canAscendFruit,
  getAscensionCost,
  getAscensionMultiplier,
} from "../services/clickers/ascension";
import { getFruitCount } from "../services/clickers/fruitClickerStorage";
import { formatLimeNumber } from "../utils/numberFormat";

export default function FruitAscensionWindow({
  games = [],
  statesByGameId = {},
  selectedGameId = "",
  onSelectGame,
  onAscend,
  onClose,
}) {
  const selectedGame = games.find((game) => game.id === selectedGameId) || games[0];
  const selectedState = selectedGame ? statesByGameId[selectedGame.id] : null;
  const selectedCanAscend = selectedGame ? canAscendFruit(selectedGame.id, statesByGameId) : false;

  return (
    <FloatingWindow
      title="Ascension"
      subtitle="Prestige reset, but make it produce."
      onClose={onClose}
      widthClass="max-w-4xl"
      zIndexClass="z-[72]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
      closeOnOutsideClick={false}
    >
      <div className="grid gap-4">
        <section className="rounded-3xl border border-amber-300/25 bg-amber-500/10 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-amber-100">Warning</p>
          <p className="mt-2 text-sm leading-6 text-zinc-100">
            Ascension resets all fruit counts, run earnings, clicks, upgrades, active boosts, and fruit events.
            Unlocks and ascension levels stay. The selected fruit gets +1 ascension level.
          </p>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          {games.map((game) => {
            const state = statesByGameId[game.id] || {};
            const level = Number(state.ascensionLevel || 0);
            const currentMultiplier = getAscensionMultiplier(state);
            const nextMultiplier = Math.pow(2, level + 1);
            const cost = getAscensionCost(game.id, state);
            const count = getFruitCount(game.id, state);
            const active = selectedGameId === game.id;
            const affordable = canAscendFruit(game.id, statesByGameId);

            return (
              <button
                key={game.id}
                type="button"
                onClick={() => onSelectGame?.(game.id)}
                className={`rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300/25 ${
                  active
                    ? "border-amber-200/40 bg-amber-500/15"
                    : "border-white/12 bg-black/25 hover:bg-zinc-900/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{game.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                      Level {level} | x{formatLimeNumber(currentMultiplier)} now | x{formatLimeNumber(nextMultiplier)} next
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${
                    affordable
                      ? "border-lime-300/30 bg-lime-500/10 text-lime-100"
                      : "border-white/15 bg-zinc-900 text-zinc-400"
                  }`}
                  >
                    {affordable ? "Ready" : "Not enough"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-300">
                  Current {game.currencyName}: {formatLimeNumber(count)}
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Ascension cost: {formatLimeNumber(cost)} {game.currencyName}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
          <button
            type="button"
            disabled={!selectedCanAscend}
            onClick={() => selectedGame && onAscend?.(selectedGame.id)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/15 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-500/25 focus:outline-none focus:ring-4 focus:ring-amber-300/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Ascend {selectedGame?.name || "Fruit"} and Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        </div>

        {!selectedCanAscend && selectedGame ? (
          <p className="text-xs leading-5 text-zinc-400">
            {selectedGame.name} needs {formatLimeNumber(getAscensionCost(selectedGame.id, selectedState || {}))} {selectedGame.currencyName}
            before the reset button is legally allowed to ruin your afternoon.
          </p>
        ) : null}
      </div>
    </FloatingWindow>
  );
}
