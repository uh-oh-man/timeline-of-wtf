import { ChevronRight, Clock3, Cloud, Database, FlaskConical, HardDrive } from "lucide-react";
import { SOURCE_TYPES } from "../services/timelineSources/timelineSourceManager";
import { cx } from "../utils/helpers";

function sourceIcon(sourceType) {
  if (sourceType === SOURCE_TYPES.SYNCED_MOCK) return Cloud;
  if (sourceType === SOURCE_TYPES.EXAMPLE) return FlaskConical;
  return HardDrive;
}

export default function TimelineManagerButton({ sourceType, activeTimelineName, onOpen }) {
  const Icon = sourceIcon(sourceType);
  const label = activeTimelineName || "Local Timeline";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cx(
        "inline-flex min-h-12 min-w-[15.5rem] items-center gap-3 rounded-full border border-white/20 bg-zinc-900/80 px-4 py-2 text-left text-white shadow-lg shadow-black/25 transition",
        "cursor-pointer hover:border-sky-200/35 hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/30 active:scale-[0.99]",
      )}
      aria-label={`Timeline Manager. Current timeline: ${label}`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/25 text-sky-100">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">Timeline Manager</span>
        <span className="block truncate text-sm font-black">Timeline: {label}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-zinc-300">
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
