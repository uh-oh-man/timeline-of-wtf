import { FileText, Gamepad2, GitBranch, Link2, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import BrokenMediaPlaceholder from "./BrokenMediaPlaceholder";
import FloatingWindow from "./FloatingWindow";
import MediaLightbox from "./MediaLightbox";
import { fallbackTagStyle, tagStyles } from "../data/tagStyles";
import { getEventAccentColor } from "../utils/colorUtils";
import { cx } from "../utils/helpers";
import { formatFileSize, getMediaUrl, isImageMedia, isVideoMedia } from "../utils/mediaUtils";

function MediaTile({ media, onOpen }) {
  const [failed, setFailed] = useState(media.storage === "broken");

  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-2xl border border-white/12 bg-black/30 text-left transition hover:border-sky-200/40 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
    >
      <div className="aspect-video bg-zinc-950">
        {failed || media.broken || !getMediaUrl(media) ? (
          <BrokenMediaPlaceholder fileName={media.fileName} />
        ) : isImageMedia(media) ? (
          <img
            src={getMediaUrl(media)}
            alt={media.caption || media.fileName || "Timeline evidence"}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : isVideoMedia(media) ? (
          <video
            src={getMediaUrl(media)}
            controls
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          >
            <track kind="captions" />
          </video>
        ) : (
          <BrokenMediaPlaceholder fileName={media.fileName} />
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-black text-white">{media.fileName || "Unnamed evidence"}</p>
        <p className="text-xs text-zinc-300">
          {media.width && media.height ? `${media.width} x ${media.height}` : "dimensions unknown"} -{" "}
          {formatFileSize(media.fileSize)}
        </p>
        {media.caption ? <p className="text-xs leading-5 text-zinc-400">{media.caption}</p> : null}
      </div>
    </button>
  );
}

export default function DisasterDetailWindow({
  disaster,
  onClose,
  onEdit,
  onDelete,
  onOpenNodeWeb,
  canEdit = true,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!disaster) return null;

  const media = Array.isArray(disaster.media) ? disaster.media : [];
  const hasConnections = disaster.directConnections?.length > 0;
  const accentColor = getEventAccentColor(disaster);

  function handleEdit() {
    onClose();
    onEdit(disaster.id);
  }

  function handleDelete() {
    onDelete(disaster.id);
  }

  function handleOpenNodeWeb() {
    onOpenNodeWeb();
  }

  return (
    <FloatingWindow
      title={disaster.title}
      subtitle="Official incident file. Confidence level: rude."
      onClose={onClose}
      widthClass="max-w-5xl"
      zIndexClass="z-[56]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-100">Year {disaster.year}</p>
            <div className="mt-2 h-1 w-28 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 18px ${accentColor}66` }} />
            <h2 className="mt-1 text-3xl font-black leading-tight text-white">{disaster.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-zinc-50">
              <Gamepad2 className="h-4 w-4 flex-none" aria-hidden="true" />
              {disaster.source}
            </span>
            <span className={cx("rounded-full border px-3 py-1 text-sm font-black", tagStyles[disaster.tag] || fallbackTagStyle)}>
              {disaster.tag}
            </span>
          </div>
        </div>

        <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-zinc-300">Summary</p>
          <p className="mt-2 leading-7 text-zinc-100">{disaster.summary}</p>
        </section>

        {hasConnections ? (
          <section className="rounded-3xl border border-sky-300/25 bg-sky-500/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-sky-100">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Directly Connected Games
            </div>
            <div className="flex flex-wrap gap-2">
              {disaster.directConnections.map((game) => (
                <span key={game} className="rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-sm font-black text-sky-50">
                  {game}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {disaster.connections?.length ? (
          <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-300">
              <FileText className="h-4 w-4 text-red-100" aria-hidden="true" />
              Optional Connection Notes
            </div>
            <ul className="space-y-2 text-sm text-zinc-100">
              {disaster.connections.map((note) => (
                <li key={note} className="flex gap-2 leading-6">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-sky-200" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {media.length ? (
          <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-zinc-300">Media Evidence</p>
                <p className="mt-1 text-xs text-zinc-400">Original-ish files. The archive is pretending to have standards.</p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-zinc-100">
                {media.length} file{media.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid max-h-[34rem] gap-3 overflow-auto pr-1 md:grid-cols-2">
              {media.map((item) => (
                <MediaTile
                  key={item.id}
                  media={item}
                  onOpen={() => setLightboxIndex(media.findIndex((mediaItem) => mediaItem.id === item.id))}
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit Disaster
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete Disaster
              </button>
            </>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-yellow-200/25 bg-yellow-300/10 px-4 py-3 text-sm font-black text-yellow-50">
              View-only until fake credentials stop being fake enough.
            </span>
          )}
          {hasConnections ? (
            <button
              type="button"
              onClick={handleOpenNodeWeb}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              Open Node Web
            </button>
          ) : null}
        </div>
      </div>
      <AnimatePresence>
        {lightboxIndex !== null ? (
          <MediaLightbox
            mediaItems={media}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null}
      </AnimatePresence>
    </FloatingWindow>
  );
}
