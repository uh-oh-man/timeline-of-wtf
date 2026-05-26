import { AlertTriangle, ArchiveRestore, FileArchive, Merge, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import { miniGameRegistryById } from "../data/miniGameRegistry";
import { formatFileSize } from "../utils/mediaUtils";
import { uniqueByName } from "../utils/helpers";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ensureUniqueTimelineName(baseName, existingNames = []) {
  const cleanBase = String(baseName || "").trim() || "Imported Timeline";
  const known = new Set(uniqueByName(existingNames).map((name) => name.toLowerCase()));
  if (!known.has(cleanBase.toLowerCase())) return cleanBase;

  let counter = 1;
  let candidate = `${cleanBase} (Imported)`;
  while (known.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${cleanBase} (Imported ${counter})`;
  }
  return candidate;
}

function getMiniGameLocalStatus(gameId) {
  const game = miniGameRegistryById[gameId];
  if (!game || typeof window === "undefined") return { discovered: false, hasSave: false };
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

function summarizeMiniGameSave(save) {
  const state = save?.state || {};
  const count = state.limeCount ?? state.appleCount ?? state.blueberryCount ?? state.charrieCount ?? state.count;
  const bits = [];
  if (Number.isFinite(Number(count))) bits.push(`count ${Number(count).toLocaleString()}`);
  if (Number.isFinite(Number(state.totalClicks))) bits.push(`${Number(state.totalClicks).toLocaleString()} clicks`);
  if (Number.isFinite(Number(state.ascensionLevel))) bits.push(`ascension ${Number(state.ascensionLevel)}`);
  return bits.length ? bits.join(" | ") : "stats unavailable";
}

export default function ImportPreviewWindow({
  importResult,
  currentTimelineName = "Local Timeline",
  existingTimelineNames = [],
  matchingTimeline = null,
  onImportAsNew,
  onMerge,
  onMergeExisting,
  onUpdateExisting,
  onReplace,
  onCancel,
}) {
  const [mode, setMode] = useState("new");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [replaceNamingMode, setReplaceNamingMode] = useState("keep-current");
  const [timelineName, setTimelineName] = useState("");
  const [customReplaceName, setCustomReplaceName] = useState("");
  const summary = importResult?.summary || {};
  const warnings = importResult?.warnings || [];
  const miniGameSaves = importResult?.miniGameSaves?.saves || [];
  const hasValidImport = Boolean(importResult?.valid && importResult?.summary);
  const formatLabel = summary.format === "modern-zip" ? "Modern ZIP .uhoh" : "Legacy Text .uhoh";
  const hasMatchingTimelineByCode = Boolean(matchingTimeline?.id && summary.timelineCode);

  const suggestedNewTimelineName = useMemo(() => {
    const importedName = String(summary.timelineName || "Imported Timeline").trim() || "Imported Timeline";
    if (summary.isExampleExport) {
      return ensureUniqueTimelineName("Example Timeline Imported", existingTimelineNames);
    }
    return ensureUniqueTimelineName(importedName, existingTimelineNames);
  }, [existingTimelineNames, summary.isExampleExport, summary.timelineName]);

  useEffect(() => {
    if (!hasValidImport) return;
    setTimelineName(suggestedNewTimelineName);
    setCustomReplaceName(String(summary.timelineName || currentTimelineName || "Local Timeline"));
    setMode(hasMatchingTimelineByCode ? "update-existing" : "new");
  }, [currentTimelineName, hasMatchingTimelineByCode, hasValidImport, suggestedNewTimelineName, summary.isExampleExport, summary.timelineName]);

  if (!hasValidImport) return null;

  const replaceTargetName = replaceNamingMode === "keep-current"
    ? currentTimelineName
    : replaceNamingMode === "use-imported"
      ? String(summary.timelineName || "Imported Timeline")
      : customReplaceName;

  function runImportAction() {
    if (hasMatchingTimelineByCode) {
      if (mode === "merge-existing") {
        onMergeExisting?.({ timelineId: matchingTimeline.id });
        return;
      }
      if (mode === "new-copy") {
        onImportAsNew({ timelineName, importAsNewCopy: true });
        return;
      }
      onUpdateExisting?.({ timelineId: matchingTimeline.id });
      return;
    }

    if (mode === "merge") {
      onMerge();
      return;
    }

    if (mode === "new") {
      onImportAsNew({ timelineName });
      return;
    }

    if (!confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    onReplace({
      namingMode: replaceNamingMode,
      customName: replaceNamingMode === "custom" ? customReplaceName : "",
    });
  }

  return (
    <FloatingWindow
      title="Import Preview"
      subtitle="The archive sniffed the file. It has opinions."
      onClose={onCancel}
      widthClass="max-w-4xl"
      zIndexClass="z-[64]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
      closeOnOutsideClick={false}
      closeOnEscape={false}
    >
      <div className="grid gap-5">
        <section className="rounded-3xl border border-sky-300/25 bg-sky-500/10 p-4">
          <div className="flex gap-3">
            <FileArchive className="mt-1 h-6 w-6 flex-none text-sky-100" aria-hidden="true" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-sky-100">{formatLabel}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{summary.appName}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                App ID: {summary.appId} | Type: {summary.appType} | Purpose: {summary.filePurpose}
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-200">
                Created: {summary.createdAt || "unknown"} | Export version: {summary.exportVersion} | Storage version: {summary.storageVersion}
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-200">
                Timeline: {summary.timelineName || "Imported Timeline"} | Type: {summary.timelineType || "local"}
              </p>
              {summary.timelineCode ? (
                <p className="mt-1 text-xs leading-6 text-zinc-300">
                  Timeline code: {summary.timelineCode} {summary.packageId ? `| Package ID: ${summary.packageId}` : ""}
                </p>
              ) : null}
              {summary.isExampleExport ? (
                <p className="mt-2 rounded-2xl border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-sm font-black text-amber-50">
                  This file is an Example Timeline export.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Disasters" value={summary.eventCount} />
          <Stat label="Tags" value={summary.tagCount} />
          <Stat label="Future Games" value={summary.plannedGameCount} />
        </div>

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-300">Media</p>
          <p className="mt-2 text-sm leading-6 text-zinc-100">
            Included: {summary.mediaIncluded ? "yes" : "no"} | Count: {summary.mediaCount} | Size: {formatFileSize(summary.totalMediaBytes)}
          </p>
        </section>

        {Number(summary.miniGameSaveCount || 0) > 0 ? (
          <section className="rounded-3xl border border-lime-300/25 bg-lime-500/10 p-4">
            <p className="text-sm font-black uppercase tracking-widest text-lime-100">Game Saves Included</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              This package contains {summary.miniGameSaveCount} mini-game save{summary.miniGameSaveCount === 1 ? "" : "s"}.
            </p>
            {miniGameSaves.length ? (
              <div className="mt-3 grid gap-2">
                {miniGameSaves.map((save) => {
                  const localStatus = getMiniGameLocalStatus(save.gameId);
                  return (
                    <article key={save.gameId} className="rounded-2xl border border-white/12 bg-zinc-950/55 p-3">
                      <p className="text-sm font-black text-white">{save.gameName || save.gameId}</p>
                      <p className="mt-1 text-xs text-zinc-300">
                        Exported: {save.exportedAt || "unknown"} | Local discovery: {localStatus.discovered ? "yes" : "no"} | Local save: {localStatus.hasSave ? "yes" : "no"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{summarizeMiniGameSave(save)}</p>
                      {!localStatus.discovered ? (
                        <p className="mt-2 text-xs font-bold text-amber-100">
                          Importing this save through Import Game Save will unlock {save.gameName || save.gameId} on this browser.
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-sm leading-6 text-zinc-200">
                Games: {summary.includedMiniGames?.length ? summary.includedMiniGames.join(", ") : "unknown"}
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-zinc-400">
              Timeline import will not silently overwrite these saves. Use Import Game Save from Timeline Manager for Skip / Merge / Replace choices.
            </p>
          </section>
        ) : null}

        {warnings.length ? (
          <section className="rounded-3xl border border-yellow-200/25 bg-yellow-300/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-yellow-100">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Warnings
            </div>
            <ul className="space-y-2 text-sm leading-6 text-yellow-50">
              {warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-yellow-100" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-300">Import Mode</p>
          {hasMatchingTimelineByCode ? (
            <div className="mt-3 grid gap-3">
              <p className="rounded-2xl border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-50">
                This file appears to belong to an existing timeline: <span className="font-black">{matchingTimeline.name}</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMode("update-existing")}
                  className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "update-existing" ? "border-red-300/35 bg-red-500/15 text-red-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
                >
                  Update Existing Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setMode("merge-existing")}
                  className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "merge-existing" ? "border-sky-300/35 bg-sky-500/15 text-sky-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
                >
                  Merge Into Existing Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new-copy")}
                  className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "new-copy" ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
                >
                  Import as New Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setMode("new");
                  setConfirmReplace(false);
                }}
                className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "new" ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
              >
                Import as New Local Timeline
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("merge");
                  setConfirmReplace(false);
                }}
                className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "merge" ? "border-sky-300/35 bg-sky-500/15 text-sky-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
              >
                Merge Into Current Timeline
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("replace");
                  setConfirmReplace(false);
                }}
                className={`rounded-2xl border px-3 py-2 text-sm font-black transition ${mode === "replace" ? "border-red-300/35 bg-red-500/15 text-red-50" : "border-white/12 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800"}`}
              >
                Replace Current Timeline
              </button>
            </div>
          )}

          {mode === "new" || mode === "new-copy" ? (
            <label className="mt-3 grid gap-2 text-sm text-zinc-200">
              <span className="font-black text-white">Timeline name after import</span>
              <input
                type="text"
                value={timelineName}
                onChange={(event) => setTimelineName(event.target.value)}
                className="min-h-11 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-emerald-300/25"
              />
            </label>
          ) : null}

          {mode === "merge" ? (
            <p className="mt-3 rounded-2xl border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-50">
              Merging into current timeline: <span className="font-black">{currentTimelineName}</span>
            </p>
          ) : null}
          {mode === "merge-existing" && matchingTimeline ? (
            <p className="mt-3 rounded-2xl border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-50">
              Merging into matching timeline: <span className="font-black">{matchingTimeline.name}</span>
            </p>
          ) : null}

          {mode === "replace" ? (
            <div className="mt-3 grid gap-3">
              <p className="text-sm text-zinc-200">Timeline name after replace:</p>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="replace-name-mode"
                  checked={replaceNamingMode === "keep-current"}
                  onChange={() => setReplaceNamingMode("keep-current")}
                />
                Keep current timeline name ({currentTimelineName})
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="replace-name-mode"
                  checked={replaceNamingMode === "use-imported"}
                  onChange={() => setReplaceNamingMode("use-imported")}
                />
                Use imported timeline name ({summary.timelineName || "Imported Timeline"})
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="radio"
                  name="replace-name-mode"
                  checked={replaceNamingMode === "custom"}
                  onChange={() => setReplaceNamingMode("custom")}
                />
                Custom name
              </label>
              {replaceNamingMode === "custom" ? (
                <input
                  type="text"
                  value={customReplaceName}
                  onChange={(event) => setCustomReplaceName(event.target.value)}
                  className="min-h-11 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-red-300/25"
                  placeholder="Custom timeline name"
                />
              ) : null}
              <p className="text-xs text-zinc-400">
                Replace target name preview: {replaceTargetName || "Local Timeline"}
              </p>
            </div>
          ) : null}
        </section>

        {confirmReplace && mode === "replace" ? (
          <section className="rounded-3xl border border-red-300/30 bg-red-500/10 p-4">
            <p className="text-sm font-bold leading-6 text-red-50">
              This will replace your current timeline data. The old data is not auto-recoverable unless you exported first.
            </p>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
          <button
            type="button"
            onClick={runImportAction}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition focus:outline-none focus:ring-4 ${mode === "new" || mode === "new-copy"
              ? "border border-emerald-300/30 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/25 focus:ring-emerald-300/25"
              : mode === "merge" || mode === "merge-existing"
                ? "border border-sky-300/30 bg-sky-500/15 text-sky-50 hover:bg-sky-500/25 focus:ring-sky-300/25"
                : "border border-red-300/30 bg-red-500/15 text-red-50 hover:bg-red-500/25 focus:ring-red-300/25"
              }`}
          >
            {mode === "new" || mode === "new-copy" ? <Plus className="h-4 w-4" aria-hidden="true" /> : mode === "merge" || mode === "merge-existing" ? <Merge className="h-4 w-4" aria-hidden="true" /> : <ArchiveRestore className="h-4 w-4" aria-hidden="true" />}
            {mode === "new" || mode === "new-copy"
              ? "Import as New Local Timeline"
              : mode === "merge"
                ? "Merge Into Current Timeline"
                : mode === "merge-existing"
                  ? "Merge Into Existing Timeline"
                : mode === "update-existing"
                  ? "Update Existing Timeline"
                  : confirmReplace
                  ? "Confirm Replace Timeline"
                  : "Replace Current Timeline"}
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
