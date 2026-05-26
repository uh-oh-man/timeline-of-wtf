import { ArchiveRestore, Merge, SkipForward, X } from "lucide-react";
import { useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import { miniGameRegistryById } from "../data/miniGameRegistry";
import { cx } from "../utils/helpers";

function getLocalStatus(gameId) {
  const game = miniGameRegistryById[gameId];
  if (!game || typeof window === "undefined") {
    return {
      discovered: false,
      hasSave: false,
    };
  }

  const rawSave = window.localStorage.getItem(game.saveKey);
  let parsedSave = null;
  try {
    parsedSave = rawSave ? JSON.parse(rawSave) : null;
  } catch {
    parsedSave = null;
  }

  return {
    discovered: window.localStorage.getItem(game.discoveredKey) === "true" || Boolean(parsedSave?.unlocked),
    hasSave: Boolean(rawSave),
  };
}

function summarizeSave(save) {
  const state = save?.state || {};
  const count = state.limeCount ?? state.appleCount ?? state.blueberryCount ?? state.charrieCount ?? state.count;
  const totalClicks = state.totalClicks;
  const ascensionLevel = state.ascensionLevel;
  const bits = [];
  if (Number.isFinite(Number(count))) bits.push(`count ${Number(count).toLocaleString()}`);
  if (Number.isFinite(Number(totalClicks))) bits.push(`${Number(totalClicks).toLocaleString()} clicks`);
  if (Number.isFinite(Number(ascensionLevel))) bits.push(`ascension ${Number(ascensionLevel)}`);
  return bits.length ? bits.join(" | ") : "No quick stats available";
}

function ModeButton({ mode, active, onClick, children }) {
  const Icon = mode === "merge" ? Merge : mode === "replace" ? ArchiveRestore : SkipForward;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-4",
        active
          ? "border-lime-300/35 bg-lime-500/15 text-lime-50 focus:ring-lime-300/25"
          : "border-white/12 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 focus:ring-sky-300/25",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </button>
  );
}

export default function MiniGameSaveImportWindow({ importResult, onApply, onCancel }) {
  const saves = useMemo(() => importResult?.saves || [], [importResult]);
  const [modes, setModes] = useState(() =>
    Object.fromEntries(
      saves.map((save) => {
        const localStatus = getLocalStatus(save.gameId);
        return [save.gameId, localStatus.hasSave ? "merge" : "replace"];
      }),
    ),
  );

  if (!saves.length) return null;

  function setMode(gameId, mode) {
    setModes((current) => ({
      ...current,
      [gameId]: mode,
    }));
  }

  return (
    <FloatingWindow
      title="Import Game Save"
      subtitle="Fruit economies are serious business, unfortunately."
      onClose={onCancel}
      widthClass="max-w-4xl"
      zIndexClass="z-[68]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
      closeOnOutsideClick={false}
      closeOnEscape={false}
    >
      <div className="grid gap-4">
        <section className="rounded-3xl border border-lime-300/25 bg-lime-500/10 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-lime-100">Detected Game Saves</p>
          <p className="mt-2 text-sm leading-6 text-zinc-200">
            Choose what happens for each save. Merge uses max/union rules, never addition, because backup duplication is how fruit capitalism wins.
          </p>
        </section>

        <div className="grid gap-3">
          {saves.map((save) => {
            const localStatus = getLocalStatus(save.gameId);
            const game = miniGameRegistryById[save.gameId];
            const currentMode = modes[save.gameId] || "skip";
            return (
              <article key={save.gameId} className="rounded-3xl border border-white/12 bg-black/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{save.gameName || game?.name || save.gameId}</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Exported: {save.exportedAt || "unknown"} | Local discovery: {localStatus.discovered ? "yes" : "no"} | Local save: {localStatus.hasSave ? "yes" : "no"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-200">{summarizeSave(save)}</p>
                    {!localStatus.discovered ? (
                      <p className="mt-2 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-50">
                        Importing this will unlock {save.gameName || game?.name || save.gameId} on this browser.
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-white/15 bg-zinc-900 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
                    {save.gameId}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ModeButton mode="skip" active={currentMode === "skip"} onClick={() => setMode(save.gameId, "skip")}>
                    Skip
                  </ModeButton>
                  <ModeButton mode="merge" active={currentMode === "merge"} onClick={() => setMode(save.gameId, "merge")}>
                    Merge
                  </ModeButton>
                  <ModeButton mode="replace" active={currentMode === "replace"} onClick={() => setMode(save.gameId, "replace")}>
                    {localStatus.discovered ? "Replace" : "Import / Unlock"}
                  </ModeButton>
                </div>
              </article>
            );
          })}
        </div>

        {importResult?.warnings?.length ? (
          <section className="rounded-3xl border border-yellow-200/25 bg-yellow-300/10 p-4 text-sm text-yellow-50">
            {importResult.warnings.join(" ")}
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={() => onApply?.(modes)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-lime-300/30 bg-lime-500/15 px-4 py-3 text-sm font-black text-lime-50 transition hover:bg-lime-500/25 focus:outline-none focus:ring-4 focus:ring-lime-300/25"
          >
            Apply Game Save Choices
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    </FloatingWindow>
  );
}
