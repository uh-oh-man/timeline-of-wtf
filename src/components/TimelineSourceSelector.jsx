import { Check, Cloud, Copy, FlaskConical, HardDrive, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SOURCE_TYPES, getSourceLabel } from "../services/timelineSources/timelineSourceManager";
import { cx } from "../utils/helpers";

function SourceDescription({ children }) {
  return <p className="mt-1 text-xs leading-5 text-zinc-300">{children}</p>;
}

function TimelineActionButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-zinc-100 transition focus:outline-none focus:ring-4",
        danger
          ? "border-red-300/25 bg-red-500/10 hover:bg-red-500/20 focus:ring-red-300/25"
          : "border-white/12 bg-zinc-900/80 hover:bg-zinc-800 focus:ring-sky-300/25",
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default function TimelineSourceSelector({
  selectedSource,
  localTimelines,
  activeLocalTimelineId,
  activeTimelineName,
  sourceStatus,
  onSelectSource,
  onSwitchLocalTimeline,
  onCreateLocalTimeline,
  onRenameLocalTimeline,
  onDuplicateLocalTimeline,
  onDeleteLocalTimeline,
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (panelRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function createTimeline() {
    const name = window.prompt("Name this fresh crime scene:", "Test Timeline");
    if (!name?.trim()) return;
    onCreateLocalTimeline(name.trim());
    setOpen(false);
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

  const label = selectedSource === SOURCE_TYPES.LOCAL
    ? activeTimelineName || "Local Timeline"
    : getSourceLabel(selectedSource);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-12 items-center gap-3 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-2 text-left text-white shadow-lg shadow-black/20 transition hover:border-sky-200/35 hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        aria-expanded={open}
      >
        {selectedSource === SOURCE_TYPES.LOCAL ? (
          <HardDrive className="h-5 w-5 text-sky-100" aria-hidden="true" />
        ) : selectedSource === SOURCE_TYPES.SYNCED_MOCK ? (
          <Cloud className="h-5 w-5 text-red-100" aria-hidden="true" />
        ) : (
          <FlaskConical className="h-5 w-5 text-amber-100" aria-hidden="true" />
        )}
        <span>
          <span className="block text-xs font-black uppercase tracking-[0.24em] text-zinc-400">Viewing</span>
          <span className="block text-2xl font-black leading-tight">{label}</span>
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-3 w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/98 p-3 text-zinc-100 shadow-2xl shadow-black/60 backdrop-blur">
          <section className="p-2">
            <p className="text-xs font-black uppercase tracking-widest text-sky-100">Local Timelines</p>
            <SourceDescription>
              Stored in this browser. Fast, private, and capable of vanishing if you anger storage.
            </SourceDescription>
            <div className="mt-3 grid gap-2">
              {localTimelines.map((timeline) => {
                const active = selectedSource === SOURCE_TYPES.LOCAL && timeline.id === activeLocalTimelineId;
                return (
                  <div
                    key={timeline.id}
                    className={cx(
                      "grid gap-2 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1fr)_auto]",
                      active ? "border-sky-300/40 bg-sky-500/15" : "border-white/10 bg-black/25",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSource(SOURCE_TYPES.LOCAL);
                        onSwitchLocalTimeline(timeline.id);
                        setOpen(false);
                      }}
                      className="min-h-11 min-w-0 text-left focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                    >
                      <span className="flex items-center gap-2 text-sm font-black text-white">
                        {active ? <Check className="h-4 w-4 text-sky-100" aria-hidden="true" /> : null}
                        <span className="truncate">{timeline.name}</span>
                      </span>
                      <span className="mt-1 block text-xs text-zinc-400">
                        {timeline.lastOpenedAt ? `Last opened ${new Date(timeline.lastOpenedAt).toLocaleString()}` : "Local archive slot"}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <TimelineActionButton label="Rename timeline" icon={Pencil} onClick={() => renameTimeline(timeline)} />
                      <TimelineActionButton label="Duplicate timeline" icon={Copy} onClick={() => onDuplicateLocalTimeline(timeline.id)} />
                      <TimelineActionButton label="Delete timeline" icon={Trash2} danger onClick={() => deleteTimeline(timeline)} />
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={createTimeline}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Local Timeline
              </button>
            </div>
          </section>

          <section className="border-t border-white/10 p-2 pt-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-100">Shared Timelines</p>
            <button
              type="button"
              onClick={() => {
                onSelectSource(SOURCE_TYPES.SYNCED_MOCK);
                setOpen(false);
              }}
              className={cx(
                "mt-3 w-full rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-red-300/25",
                selectedSource === SOURCE_TYPES.SYNCED_MOCK
                  ? "border-red-300/40 bg-red-500/15"
                  : "border-white/10 bg-black/25 hover:bg-white/5",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-black text-white">
                <Cloud className="h-4 w-4 text-red-100" aria-hidden="true" />
                Shared Timeline / Real Timeline
              </span>
              <SourceDescription>
                Shared backend timeline. The official disaster archive, assuming the server is not crying.
              </SourceDescription>
              <p className="mt-2 rounded-xl border border-yellow-200/20 bg-yellow-300/10 px-3 py-2 text-xs font-black text-yellow-50">
                {sourceStatus?.label || "Mock sync active"}. Backend not connected. This is a cardboard cutout with confidence.
              </p>
            </button>
          </section>

          <section className="border-t border-white/10 p-2 pt-4">
            <p className="text-xs font-black uppercase tracking-widest text-amber-100">Example</p>
            <button
              type="button"
              onClick={() => {
                onSelectSource(SOURCE_TYPES.EXAMPLE);
                setOpen(false);
              }}
              className={cx(
                "mt-3 w-full rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-4 focus:ring-amber-300/25",
                selectedSource === SOURCE_TYPES.EXAMPLE
                  ? "border-amber-300/40 bg-amber-400/15"
                  : "border-white/10 bg-black/25 hover:bg-white/5",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-black text-white">
                <FlaskConical className="h-4 w-4 text-amber-100" aria-hidden="true" />
                Example Timeline
              </span>
              <SourceDescription>
                Fake demo nonsense. Edits evaporate when the archive gets bored.
              </SourceDescription>
            </button>
          </section>

          <div className="border-t border-white/10 p-2 pt-3 text-[0.68rem] font-black uppercase tracking-[0.22em] text-zinc-500">
            <MoreHorizontal className="mr-2 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
            Future friend timelines get their own drawer when the server stops pretending.
          </div>
        </div>
      ) : null}
    </div>
  );
}
