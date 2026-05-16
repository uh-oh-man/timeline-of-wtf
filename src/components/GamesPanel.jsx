import { CalendarPlus, ListChecks, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cx } from "../utils/helpers";

export default function GamesPanel({ gameStats, plannedGames, onAddPlannedGame, onRemovePlannedGame }) {
  const [activeTab, setActiveTab] = useState("current");
  const [draft, setDraft] = useState("");

  const totalEvents = useMemo(
    () => gameStats.reduce((sum, game) => sum + game.count, 0),
    [gameStats],
  );

  function submitPlannedGame(event) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;

    onAddPlannedGame(value);
    setDraft("");
  }

  return (
    <aside className="rounded-[1.8rem] border border-white/15 bg-zinc-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-2xl font-black text-white">
            <ListChecks className="h-6 w-6 text-fuchsia-200" aria-hidden="true" />
            Games In This Mess
          </div>
          <p className="mt-2 text-sm text-zinc-200">
            {gameStats.length ? `${gameStats.length} games, ${totalEvents} documented bad ideas.` : "No games yet. Suspiciously peaceful."}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/15 bg-black/30 p-1">
        {["current", "future"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cx(
              "rounded-xl px-3 py-2 text-sm font-black capitalize transition focus:outline-none focus:ring-4 focus:ring-red-300/25",
              activeTab === tab ? "bg-red-500 text-white" : "text-zinc-200 hover:bg-white/10 hover:text-white",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "current" ? (
        <div className="grid max-h-80 gap-3 overflow-y-auto pr-1 lg:max-h-[360px]">
          {gameStats.length ? (
            gameStats.map((game) => (
              <div
                key={game.name}
                className="flex items-center justify-between gap-3 rounded-3xl border border-white/15 bg-black/30 p-4"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">{game.name}</div>
                  <div className="mt-1 text-xs text-zinc-300">
                    First known year: {game.firstYear || "classified"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-red-300/40 bg-red-500/20 px-3 py-1 text-xs font-black text-red-50">
                  {game.count} {game.count === 1 ? "event" : "events"}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-3xl border border-white/15 bg-black/30 p-5 text-sm leading-6 text-zinc-100">
              No games yet. The timeline is empty, peaceful, and frankly suspicious.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={submitPlannedGame} className="flex gap-3">
            <label className="sr-only" htmlFor="planned-game">
              Future game
            </label>
            <input
              id="planned-game"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-4 text-sm text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-300 focus:border-red-300/50 focus:ring-4 focus:ring-red-400/30"
              placeholder="Future game to play..."
            />
            <button
              type="submit"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
              aria-label="Add future game"
            >
              <CalendarPlus className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>

          <div className="grid max-h-80 gap-3 overflow-y-auto pr-1 lg:max-h-[360px]">
            {plannedGames.length ? (
              plannedGames.map((game, index) => (
                <div
                  key={`${game}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-white/15 bg-black/30 p-4"
                >
                  <span className="min-w-0 truncate text-sm font-bold text-white">{game}</span>
                  <button
                    type="button"
                    onClick={() => onRemovePlannedGame(index)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-200 transition hover:bg-red-500/20 hover:text-red-100 focus:outline-none focus:ring-4 focus:ring-red-300/25"
                    aria-label={`Remove ${game}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-white/15 bg-black/30 p-5 text-sm leading-6 text-zinc-100">
                Future games cleared. The archive is pretending that restraint exists.
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
