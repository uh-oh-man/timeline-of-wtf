import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import BrokenMediaPlaceholder from "./BrokenMediaPlaceholder";
import { formatFileSize, isImageMedia, isVideoMedia } from "../utils/mediaUtils";
import { useMediaObjectUrl } from "../services/media/useMediaObjectUrl";

export default function MediaLightbox({ mediaItems, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [failed, setFailed] = useState(false);
  const swipeStart = useRef(null);
  const media = mediaItems[index];
  const mediaUrl = useMediaObjectUrl(media);
  const hasMultiple = mediaItems.length > 1;

  useEffect(() => {
    setFailed(false);
  }, [index]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && hasMultiple) setIndex((current) => (current + 1) % mediaItems.length);
      if (event.key === "ArrowLeft" && hasMultiple) {
        setIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultiple, mediaItems.length, onClose]);

  if (!media) return null;

  function goNext() {
    setIndex((current) => (current + 1) % mediaItems.length);
  }

  function goPrevious() {
    setIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
  }

  function handlePointerUp(event) {
    if (!swipeStart.current || !hasMultiple) return;
    const deltaX = event.clientX - swipeStart.current.x;
    const deltaY = event.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX < 0) goNext();
    else goPrevious();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[92] flex items-center justify-center bg-black/86 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media evidence viewer"
    >
      <motion.div
        className="relative grid max-h-[94vh] w-[min(74rem,calc(100vw-2rem))] gap-4 overflow-hidden rounded-3xl border border-white/15 bg-zinc-950 p-4 shadow-2xl shadow-black"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerDownCapture={(event) => {
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={handlePointerUp}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-zinc-950/85 text-zinc-100 transition hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          aria-label="Close media viewer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="grid max-h-[70vh] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          {failed || media.broken || !mediaUrl ? (
            <BrokenMediaPlaceholder fileName={media.fileName} />
          ) : isImageMedia(media) ? (
            <img
              src={mediaUrl}
              alt={media.caption || media.fileName || "Timeline evidence"}
              onError={() => setFailed(true)}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : isVideoMedia(media) ? (
            <video
              src={mediaUrl}
              controls
              onError={() => setFailed(true)}
              className="max-h-[70vh] w-full object-contain"
            >
              <track kind="captions" />
            </video>
          ) : (
            <BrokenMediaPlaceholder fileName={media.fileName} />
          )}
        </div>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-zinc-950/85 text-zinc-100 transition hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              aria-label="Previous media"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-zinc-950/85 text-zinc-100 transition hover:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              aria-label="Next media"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-black text-white">{media.fileName || "Unnamed evidence"}</p>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-zinc-200">
              {index + 1} / {mediaItems.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {media.width && media.height ? `${media.width} x ${media.height}` : "dimensions unknown"} -{" "}
            {formatFileSize(media.fileSize)}
          </p>
          {media.caption ? <p className="mt-3 text-sm leading-6 text-zinc-100">{media.caption}</p> : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
