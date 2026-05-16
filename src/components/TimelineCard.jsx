import { FileText, Film, Gamepad2, GripVertical, Images, Link2, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import BrokenMediaPlaceholder from "./BrokenMediaPlaceholder";
import { fallbackTagStyle, tagStyles } from "../data/tagStyles";
import { cx } from "../utils/helpers";
import { getMediaUrl, isImageMedia, isVideoMedia } from "../utils/mediaUtils";

function MediaPreviewTile({ item }) {
  const [failed, setFailed] = useState(false);
  const mediaUrl = getMediaUrl(item);

  return (
    <div className="h-28 min-w-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
      {failed || item.broken || !mediaUrl ? (
        <BrokenMediaPlaceholder fileName={item.fileName} compact />
      ) : isImageMedia(item) ? (
        <img
          src={mediaUrl}
          alt={item.caption || item.fileName || "Timeline evidence preview"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : isVideoMedia(item) ? (
        <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.18),transparent_34%),rgba(9,9,11,0.94)] text-sky-50">
          <div className="text-center">
            <Film className="mx-auto h-7 w-7" aria-hidden="true" />
            <p className="mt-2 text-[0.65rem] font-black uppercase tracking-widest">Video</p>
          </div>
        </div>
      ) : (
        <BrokenMediaPlaceholder fileName={item.fileName} compact />
      )}
    </div>
  );
}

function MediaPreview({ media = [] }) {
  const previewItems = media.slice(0, 3);
  const moreCount = Math.max(0, media.length - previewItems.length);

  if (!previewItems.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-sky-300/25 bg-black/30">
      <div className="grid gap-3 p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {previewItems.map((item) => (
            <MediaPreviewTile key={item.id || item.fileName} item={item} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-500/10 px-3 py-1 text-xs font-black text-sky-50">
            <Images className="h-4 w-4" aria-hidden="true" />
            {media.length} evidence file{media.length === 1 ? "" : "s"}
          </div>
          {moreCount ? <p className="text-xs font-bold text-red-100">+{moreCount} more in the incident file</p> : null}
        </div>
      </div>
    </div>
  );
}

export default function TimelineCard({ disaster, index, onEdit, onDelete, onOpenDetail, dragMode = false }) {
  const mediaCount = Array.isArray(disaster.media) ? disaster.media.length : 0;
  const media = Array.isArray(disaster.media) ? disaster.media : [];

  function openDetail() {
    if (!dragMode) onOpenDetail?.(disaster.id);
  }

  function handleCardKeyDown(event) {
    if (event.target.closest?.("button,a,input,textarea,select")) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openDetail();
  }

  function handleActionClick(event, action) {
    event.stopPropagation();
    action(disaster.id);
  }

  return (
    <motion.article
      layout
      className="group relative"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
    >
      <div className="absolute -left-[1.7rem] top-7 h-4 w-4 rounded-full border-2 border-zinc-950 bg-red-200 shadow-lg shadow-red-500/40 md:-left-[2.05rem]" />

      <div
        role={dragMode ? undefined : "button"}
        tabIndex={dragMode ? undefined : 0}
        onClick={openDetail}
        onKeyDown={handleCardKeyDown}
        className="overflow-hidden rounded-[1.6rem] border border-white/15 bg-zinc-900/80 p-5 text-left shadow-lg shadow-black/25 backdrop-blur transition hover:border-red-300/40 hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/20 focus-within:border-red-300/40 md:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            {dragMode ? (
              <div className="mt-1 inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-500/15 text-sky-50">
                <GripVertical className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Drag handle</span>
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-red-100">Year {disaster.year}</p>
              <h3 className="mt-1 text-2xl font-black leading-tight text-white">{disaster.title}</h3>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:max-w-[58%] lg:justify-end">
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-zinc-50">
              <Gamepad2 className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className="truncate">{disaster.source}</span>
            </span>
            <span className={cx("max-w-full rounded-full border px-3 py-1 text-sm font-black", tagStyles[disaster.tag] || fallbackTagStyle)}>
              <span className="block truncate">{disaster.tag}</span>
            </span>
            {mediaCount ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-sky-300/25 bg-sky-500/10 px-3 py-1 text-sm font-black text-sky-50">
                <Images className="h-4 w-4 flex-none" aria-hidden="true" />
                {mediaCount} media
              </span>
            ) : null}

            <div className="flex max-w-0 min-w-0 flex-nowrap items-center justify-start gap-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-w-[14rem] group-hover:opacity-100 group-focus-within:max-w-[14rem] group-focus-within:opacity-100 lg:justify-end">
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onEdit)}
                className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                aria-label={`Edit ${disaster.title}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={(event) => handleActionClick(event, onDelete)}
                className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full border border-red-300/30 bg-red-500/15 px-3 py-1 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-red-300/25"
                aria-label={`Delete ${disaster.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 leading-7 text-zinc-100">{disaster.summary}</p>

        {mediaCount ? <MediaPreview media={media} /> : null}

        {disaster.directConnections?.length ? (
          <div className="mt-4 rounded-2xl border border-sky-300/25 bg-sky-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-sky-100">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Directly Connected To
            </div>
            <div className="flex flex-wrap gap-2">
              {disaster.directConnections.map((game) => (
                <span
                  key={game}
                  className="rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-sm font-black text-sky-50"
                >
                  {game}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {disaster.connections?.length ? (
          <div className="mt-4 rounded-2xl border border-white/15 bg-black/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-200">
              <FileText className="h-4 w-4 text-fuchsia-200" aria-hidden="true" />
              Optional Connection Notes
            </div>
            <ul className="space-y-2 text-sm text-zinc-100">
              {disaster.connections.map((note) => (
                <li key={note} className="flex gap-2 leading-6">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-fuchsia-200" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
