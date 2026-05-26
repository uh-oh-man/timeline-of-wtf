import {
  Check,
  Copy,
  Download,
  FileUp,
  FlaskConical,
  HardDrive,
  LoaderCircle,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import { SOURCE_TYPES } from "../services/timelineSources/timelineSourceManager";
import { cx } from "../utils/helpers";

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
      <h3 className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-300">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TimelineRowAction({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-4",
        danger
          ? "border-red-300/25 bg-red-500/10 text-red-50 hover:bg-red-500/20 focus:ring-red-300/30"
          : "border-white/15 bg-zinc-900/80 text-zinc-50 hover:bg-zinc-800 focus:ring-sky-300/25",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

export default function TimelineManagerWindow({
  onClose,
  selectedSource,
  activeTimelineMetadata,
  activeLocalTimelineId,
  localTimelines = [],
  syncStatus,
  canEditSharedTimeline,
  onSelectSource,
  onSwitchLocalTimeline,
  onCreateLocalTimeline,
  onRenameLocalTimeline,
  onDuplicateLocalTimeline,
  onDeleteLocalTimeline,
  onOpenExport,
  onOpenImport,
  onExportMiniGameSaves,
  onExportMiniGameSave,
  onImportMiniGameSaves,
  discoveredMiniGames = [],
  onOpenShareTimeline,
  onEnterExampleMode,
  onExitExampleMode,
  exampleMode,
  exampleLoadState,
  exampleSourceLabel,
  exampleFallbackNotice,
}) {
  const sourceLabel = selectedSource === SOURCE_TYPES.LOCAL
    ? "Local"
    : selectedSource === SOURCE_TYPES.SYNCED_MOCK
      ? "Synced / Mock"
      : "Example";

  function createTimeline() {
    const name = window.prompt("Name this fresh local timeline:", "New Local Timeline");
    if (!name?.trim()) return;
    onCreateLocalTimeline(name.trim());
  }

  function renameTimeline(timeline) {
    const name = window.prompt("Rename this local timeline:", timeline.name);
    if (!name?.trim()) return;
    onRenameLocalTimeline(timeline.id, name.trim());
  }

  function deleteTimeline(timeline) {
    const confirmed = window.confirm("Delete this local timeline? The archive will deny it ever existed.");
    if (!confirmed) return;
    onDeleteLocalTimeline(timeline.id);
  }

  const exampleLoading = exampleLoadState?.phase === "loading";
  const exampleButtonLabel = exampleMode
    ? "Leave Example Mode"
    : exampleLoading
      ? "Loading Example..."
      : "View Example Timeline";

  return (
    <FloatingWindow
      title="Timeline Manager"
      subtitle="Select, protect, import, export, and generally manage timeline chaos."
      onClose={onClose}
      widthClass="max-w-5xl"
      zIndexClass="z-[65]"
      bodyClassName="bg-zinc-950 p-4 md:p-5"
    >
      <div className="grid gap-4">
        <Section title="Current Timeline">
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-sky-300/30 bg-sky-500/10 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Name</p>
              <p className="mt-1 text-lg font-black text-white">{activeTimelineMetadata?.name || "Local Timeline"}</p>
            </article>
            <article className="rounded-2xl border border-white/15 bg-zinc-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Source</p>
              <p className="mt-1 text-lg font-black text-white">{sourceLabel}</p>
            </article>
          </div>
        </Section>

        <Section
          title="Local Timelines"
          subtitle="Stored in this browser. Fast, private, and capable of vanishing if storage gets moody."
        >
          <div className="grid gap-2">
            {localTimelines.map((timeline) => {
              const active = selectedSource === SOURCE_TYPES.LOCAL && timeline.id === activeLocalTimelineId;
              return (
                <article
                  key={timeline.id}
                  className={cx(
                    "grid gap-2 rounded-2xl border p-3 lg:grid-cols-[minmax(0,1fr)_auto]",
                    active ? "border-sky-300/35 bg-sky-500/12" : "border-white/10 bg-zinc-900/55",
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-black text-white">
                      {active ? <Check className="h-4 w-4 text-sky-100" aria-hidden="true" /> : null}
                      <span className="truncate">{timeline.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {timeline.updatedAt ? `Updated ${new Date(timeline.updatedAt).toLocaleString()}` : "No update timestamp"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {timeline.createdByName ? `Created by ${timeline.createdByName}` : "Created by you"}
                      {timeline.timelineCode ? ` • ${timeline.timelineCode}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <TimelineRowAction
                      label={active ? "Active" : "Switch"}
                      icon={HardDrive}
                      onClick={() => {
                        onSelectSource(SOURCE_TYPES.LOCAL);
                        onSwitchLocalTimeline(timeline.id);
                      }}
                    />
                    <TimelineRowAction label="Rename" icon={Pencil} onClick={() => renameTimeline(timeline)} />
                    <TimelineRowAction label="Duplicate" icon={Copy} onClick={() => onDuplicateLocalTimeline(timeline.id)} />
                    <TimelineRowAction label="Delete" icon={Trash2} danger onClick={() => deleteTimeline(timeline)} />
                  </div>
                </article>
              );
            })}
          </div>
          <button
            type="button"
            onClick={createTimeline}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Local Timeline
          </button>
        </Section>

        <Section title="Import / Export" subtitle="This is user data management, not an admin-only goblin lever.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Current Timeline
            </button>
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Import .uhoh Timeline
            </button>
            <button
              type="button"
              onClick={onOpenShareTimeline}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-50 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-300/25"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share Timeline
            </button>
            <button
              type="button"
              onClick={onExportMiniGameSaves}
              disabled={!discoveredMiniGames.length}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-lime-300/25 bg-lime-500/15 px-4 py-3 text-sm font-black text-lime-50 transition hover:bg-lime-500/25 focus:outline-none focus:ring-4 focus:ring-lime-300/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export Game Saves
            </button>
            <button
              type="button"
              onClick={onImportMiniGameSaves}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-300/25 bg-amber-500/15 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-500/25 focus:outline-none focus:ring-4 focus:ring-amber-300/25"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Import Game Save
            </button>
          </div>
          {discoveredMiniGames.length ? (
            <div className="mt-3 rounded-2xl border border-lime-300/15 bg-lime-500/10 p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-100">Discovered Game Saves</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {discoveredMiniGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => onExportMiniGameSave?.(game.id)}
                    className="rounded-xl border border-lime-300/25 bg-zinc-950/70 px-3 py-2 text-xs font-black text-lime-50 transition hover:bg-lime-500/15 focus:outline-none focus:ring-4 focus:ring-lime-300/25"
                  >
                    Export {game.name} Save
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              Game-save export appears after a mini-game is discovered.
            </p>
          )}
        </Section>

        <Section title="Peer / Mock Status">
          <div className="rounded-2xl border border-white/12 bg-zinc-900/65 p-3">
            <p className="text-sm font-black text-white">Backend not connected</p>
            <p className="mt-2 text-xs text-zinc-300">
              {syncStatus?.label || "Mock sync active"}. Timeline sharing uses the manual peer session instead of this dead tab.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {canEditSharedTimeline
                ? "Mock edit access is available for this account, but the old mock tab is hidden until it has real purpose."
                : "Use Share Timeline for live peer sync. No backend, no stuck active tab."}
            </p>
          </div>
        </Section>

        <Section title="Example Timeline">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={exampleMode ? onExitExampleMode : onEnterExampleMode}
              disabled={exampleLoading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/15 px-4 py-3 text-sm font-black text-amber-50 transition hover:bg-amber-400/25 focus:outline-none focus:ring-4 focus:ring-amber-300/25 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {exampleLoading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FlaskConical className="h-4 w-4" aria-hidden="true" />}
              {exampleButtonLabel}
            </button>
            {exampleMode ? (
              <button
                type="button"
                onClick={onOpenExport}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export Example Timeline
              </button>
            ) : null}
          </div>
          {exampleLoadState?.message ? <p className="mt-3 text-xs text-zinc-200">{exampleLoadState.message}</p> : null}
          {exampleSourceLabel ? <p className="mt-1 text-xs text-zinc-300">Example source: {exampleSourceLabel}</p> : null}
          {exampleFallbackNotice ? <p className="mt-1 text-xs text-amber-100">{exampleFallbackNotice}</p> : null}
        </Section>
      </div>
    </FloatingWindow>
  );
}
