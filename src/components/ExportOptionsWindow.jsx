import { AlertTriangle, Archive, FileText, Image, RefreshCcw, X } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import { formatFileSize } from "../utils/mediaUtils";
import {
  MEDIA_SIZE_DANGER_BYTES,
  MEDIA_SIZE_WARNING_BYTES,
} from "../utils/exportImport";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

export default function ExportOptionsWindow({
  summary,
  progress,
  busyMode = "",
  timelineName,
  fileName,
  currentTimelineName,
  onTimelineNameChange,
  onFileNameChange,
  onMatchFileNameToTimeline,
  onUseCurrentTimelineName,
  onExportDataOnly,
  onExportWithMedia,
  onExportLegacy,
  discoveredMiniGames = [],
  selectedMiniGameSaveIds = [],
  onToggleMiniGameSave,
  onSelectAllMiniGameSaves,
  onClearMiniGameSaves,
  onCancel,
}) {
  const mediaCount = Number(summary?.mediaCount || 0);
  const mediaBytes = Number(summary?.mediaBytes || 0);
  const disasterCount = Number(summary?.disasterCount || 0);
  const sizeWarning = mediaBytes >= MEDIA_SIZE_WARNING_BYTES;
  const sizeDanger = mediaBytes >= MEDIA_SIZE_DANGER_BYTES;

  return (
    <FloatingWindow
      title="Export Timeline"
      subtitle="Choose how cursed this .uhoh package should be."
      onClose={onCancel}
      widthClass="max-w-4xl"
      zIndexClass="z-[67]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
      closeOnOutsideClick={!busyMode}
      closeOnEscape={!busyMode}
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Disasters" value={disasterCount} />
          <Stat label="Media Files" value={mediaCount} />
          <Stat label="Media Size" value={formatFileSize(mediaBytes)} />
        </div>

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">Export Naming</p>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-2 text-sm text-zinc-200">
              <span className="font-black text-white">Timeline name in export</span>
              <input
                type="text"
                value={timelineName}
                onChange={(event) => onTimelineNameChange(event.target.value)}
                disabled={Boolean(busyMode)}
                className="min-h-11 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-60"
                placeholder="Main Canon Timeline"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onUseCurrentTimelineName}
                disabled={Boolean(busyMode)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-60"
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Use Current Timeline Name
              </button>
              <span className="text-xs text-zinc-400">
                Current: {currentTimelineName || "Local Timeline"}
              </span>
            </div>
            <label className="grid gap-2 text-sm text-zinc-200">
              <span className="font-black text-white">Export file name</span>
              <input
                type="text"
                value={fileName}
                onChange={(event) => onFileNameChange(event.target.value)}
                disabled={Boolean(busyMode)}
                className="min-h-11 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-60"
                placeholder="timeline-export-2026-05-24-1430.uhoh"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onMatchFileNameToTimeline}
                disabled={Boolean(busyMode)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/20 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-60"
              >
                Match File Name To Timeline
              </button>
              <span className="text-xs text-zinc-400">`.uhoh` is auto-appended if missing.</span>
            </div>
          </div>
        </section>

        {discoveredMiniGames.length ? (
          <section className="rounded-3xl border border-lime-300/20 bg-lime-500/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-100">Include Game Saves</p>
                <p className="mt-1 text-sm leading-6 text-zinc-200">
                  Optional. Timeline backups do not include fruit economies unless you say so.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSelectAllMiniGameSaves}
                  disabled={Boolean(busyMode)}
                  className="rounded-xl border border-lime-300/25 bg-lime-500/10 px-3 py-2 text-xs font-black text-lime-100 transition hover:bg-lime-500/20 disabled:opacity-60"
                >
                  Include All
                </button>
                <button
                  type="button"
                  onClick={onClearMiniGameSaves}
                  disabled={Boolean(busyMode)}
                  className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-60"
                >
                  Include None
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {discoveredMiniGames.map((game) => {
                const checked = selectedMiniGameSaveIds.includes(game.id);
                return (
                  <label
                    key={game.id}
                    className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                      checked
                        ? "border-lime-300/35 bg-lime-500/15 text-lime-50"
                        : "border-white/10 bg-zinc-900/70 text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <span>
                      <span className="block font-black">{game.name} save</span>
                      <span className="text-xs text-zinc-400">Stored separately from timeline events.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={Boolean(busyMode)}
                      onChange={() => onToggleMiniGameSave?.(game.id)}
                      className="h-5 w-5 accent-lime-300"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {sizeWarning ? (
          <section className={`rounded-3xl border p-4 ${sizeDanger ? "border-red-300/35 bg-red-500/12" : "border-yellow-200/25 bg-yellow-300/10"}`}>
            <div className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest ${sizeDanger ? "text-red-100" : "text-yellow-100"}`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {sizeDanger ? "Very Large Export" : "Large Export"}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              {sizeDanger
                ? "Estimated media size is over 1 GB. This export may fail in-browser if memory gets cranky."
                : "Estimated media size is over 250 MB. This export may be chunky and slower to generate."}
            </p>
          </section>
        ) : null}

        {progress?.active ? (
          <section className="rounded-3xl border border-sky-300/25 bg-sky-500/10 p-4">
            <p className="text-sm font-black uppercase tracking-widest text-sky-100">
              {progress.phase === "media" ? "Packing Media..." : "Building Archive..."}
            </p>
            <p className="mt-2 text-sm text-zinc-100">
              {progress.currentFile || "Preparing files..."}
            </p>
            <p className="mt-2 text-xs font-bold text-sky-50">
              {Number.isFinite(Number(progress.percent)) ? `${Math.round(progress.percent)}%` : "Working..."}
            </p>
          </section>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={onExportDataOnly}
            disabled={Boolean(busyMode)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Export Data Only
          </button>
          <button
            type="button"
            onClick={onExportWithMedia}
            disabled={Boolean(busyMode)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-50 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Image className="h-4 w-4" aria-hidden="true" />
            Export With Photos/Videos
          </button>
          <button
            type="button"
            onClick={onExportLegacy}
            disabled={Boolean(busyMode)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-3 text-sm font-black text-yellow-50 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-4 focus:ring-yellow-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Export Legacy Text .uhoh
          </button>
        </div>

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4 text-sm leading-6 text-zinc-200">
          <p>Data-only export creates a modern ZIP .uhoh package without media files.</p>
          <p className="mt-2">Legacy text export is mostly for debugging. Photos/videos are not included.</p>
          <p className="mt-2">Export with media includes blobs from IndexedDB and may produce a chunky file.</p>
        </section>

        <div className="flex justify-end border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={Boolean(busyMode)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    </FloatingWindow>
  );
}
