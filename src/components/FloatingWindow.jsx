import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const floatingWindowStack = [];
const VIEWPORT_PADDING = 18;
const MIN_VISIBLE_X = 104;
const TITLE_BAR_SAFE_HEIGHT = 72;

function getViewportCorrection(rect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let x = 0;
  let y = 0;

  if (rect.width <= viewportWidth - VIEWPORT_PADDING * 2) {
    if (rect.left < VIEWPORT_PADDING) x = VIEWPORT_PADDING - rect.left;
    if (rect.right > viewportWidth - VIEWPORT_PADDING) x = viewportWidth - VIEWPORT_PADDING - rect.right;
  } else {
    if (rect.left > VIEWPORT_PADDING) x = VIEWPORT_PADDING - rect.left;
    if (rect.right < MIN_VISIBLE_X) x = MIN_VISIBLE_X - rect.right;
  }

  if (rect.left > viewportWidth - MIN_VISIBLE_X) x = viewportWidth - MIN_VISIBLE_X - rect.left;
  if (rect.right < MIN_VISIBLE_X) x = MIN_VISIBLE_X - rect.right;

  if (rect.top < VIEWPORT_PADDING) y = VIEWPORT_PADDING - rect.top;
  if (rect.top > viewportHeight - TITLE_BAR_SAFE_HEIGHT) {
    y = viewportHeight - TITLE_BAR_SAFE_HEIGHT - rect.top;
  }
  if (rect.bottom < VIEWPORT_PADDING + TITLE_BAR_SAFE_HEIGHT) {
    y = VIEWPORT_PADDING - rect.top;
  }

  return { x, y };
}

export default function FloatingWindow({
  title,
  subtitle,
  children,
  onClose,
  initialPosition = { x: 0, y: 0 },
  widthClass = "max-w-5xl",
  zIndexClass = "z-50",
  overlay = true,
  bodyClassName = "p-4",
  windowClassName = "",
  closeOnOutsideClick = true,
  closeOnEscape = true,
  keepInViewport = true,
}) {
  const dragControls = useDragControls();
  const windowRef = useRef(null);
  const windowId = useId();
  const [position, setPosition] = useState(initialPosition);
  const dragStartPosition = useRef(initialPosition);
  const dragStartRect = useRef(null);
  const lastRescueAt = useRef(0);

  useEffect(() => {
    floatingWindowStack.push(windowId);

    return () => {
      const index = floatingWindowStack.indexOf(windowId);
      if (index !== -1) floatingWindowStack.splice(index, 1);
    };
  }, [windowId]);

  useEffect(() => {
    if (!onClose || (!closeOnOutsideClick && !closeOnEscape)) return undefined;

    function isTopWindow() {
      return floatingWindowStack[floatingWindowStack.length - 1] === windowId;
    }

    function handlePointerDown(event) {
      if (!closeOnOutsideClick || !isTopWindow()) return;
      if (event.target?.closest?.("[data-twtaf-reaction-overlay]")) return;
      if (windowRef.current?.contains(event.target)) return;
      onClose();
      event.stopPropagation();
    }

    function handleKeyDown(event) {
      if (!closeOnEscape || !isTopWindow()) return;
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeOnEscape, closeOnOutsideClick, onClose, windowId]);

  function handleDragStart() {
    dragStartPosition.current = position;
    dragStartRect.current = windowRef.current?.getBoundingClientRect() || null;
  }

  function handleDragEnd(_, info) {
    const rect = windowRef.current?.getBoundingClientRect();
    const correction = keepInViewport && rect ? getViewportCorrection(rect) : { x: 0, y: 0 };
    const visualOffset = rect && dragStartRect.current
      ? {
          x: rect.left - dragStartRect.current.left,
          y: rect.top - dragStartRect.current.top,
        }
      : info.offset;
    const nextPosition = {
      x: dragStartPosition.current.x + visualOffset.x + correction.x,
      y: dragStartPosition.current.y + visualOffset.y + correction.y,
    };

    setPosition(nextPosition);

    if (Math.abs(correction.x) > 0.5 || Math.abs(correction.y) > 0.5) {
      const now = Date.now();
      if (now - lastRescueAt.current > 2200) {
        lastRescueAt.current = now;
        window.dispatchEvent(new window.CustomEvent("twtaf:window-rescued"));
      }
    }
  }

  return (
    <motion.div
      className={[
        "fixed inset-0 flex items-center justify-center p-4",
        zIndexClass,
        overlay ? "bg-black/75 backdrop-blur-sm" : "pointer-events-none",
      ].join(" ")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal={overlay ? "true" : "false"}
      aria-label={title}
    >
      <motion.div
        ref={windowRef}
        className={[
          "pointer-events-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[1.6rem] border border-white/20 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black",
          widthClass,
          windowClassName,
        ].join(" ")}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.96, x: initialPosition.x, y: initialPosition.y + 16 }}
        animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
        exit={{ opacity: 0, scale: 0.96, y: position.y + 16 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div
          className="flex cursor-grab touch-none items-center justify-between gap-3 border-b border-white/15 bg-zinc-900 px-5 py-4 active:cursor-grabbing"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-white">{title}</h2>
              {subtitle ? <p className="truncate text-xs text-zinc-300">{subtitle}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-100 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            aria-label={`Close ${title}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className={["min-h-0 overflow-auto bg-zinc-950", bodyClassName].join(" ")}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
