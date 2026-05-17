import { AnimatePresence, Reorder } from "framer-motion";
import { Clock, Gamepad2, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TimelineCard from "./TimelineCard";
import TimelineToast from "./TimelineToast";
import { futureDragWarnings, sameYearDragWarnings } from "../data/timelineWarnings";
import { groupDisastersByYear, pickRandom } from "../utils/helpers";

function TimelineShell({ children, dragMode, onToggleDragMode, canReorder, sourceSelector, readOnlyReason }) {
  return (
    <section className="mt-2" aria-label="Main timeline">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {sourceSelector || (
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-sky-200" aria-hidden="true" />
            <h2 className="text-3xl font-black text-white">Main Timeline</h2>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleDragMode}
          disabled={!canReorder}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
          {dragMode ? "Exit Drag Mode" : "Timeline Drag Mode"}
        </button>
      </div>
      {dragMode ? (
        <p className="mb-5 rounded-3xl border border-sky-300/25 bg-sky-500/10 p-4 text-sm font-bold text-sky-50">
          Drag mode is active. You can reorder disasters only inside the same year. Time border control is watching.
        </p>
      ) : null}
      {readOnlyReason ? (
        <p className="mb-5 rounded-3xl border border-yellow-200/25 bg-yellow-300/10 p-4 text-sm font-bold text-yellow-50">
          {readOnlyReason}
        </p>
      ) : null}
      {children}
    </section>
  );
}

export default function Timeline({
  disasters,
  totalCount,
  onEdit,
  onDelete,
  onOpenDetail,
  onReorderYear,
  sourceSelector,
  recentChanges = {},
  canEdit = true,
  readOnlyReason = "",
}) {
  const [dragMode, setDragMode] = useState(false);
  const [timelineToast, setTimelineToast] = useState("");
  const timelineToastTimer = useRef(null);
  const hasTimeline = totalCount > 0;
  const groupedDisasters = groupDisastersByYear(disasters);

  useEffect(() => {
    return () => window.clearTimeout(timelineToastTimer.current);
  }, []);

  function showTimelineToast(message) {
    setTimelineToast(message);
    window.clearTimeout(timelineToastTimer.current);
    timelineToastTimer.current = window.setTimeout(() => setTimelineToast(""), 3200);
  }

  function handleDragEnd(year, info) {
    if (!dragMode) return;
    if (Math.abs(info.offset.y) < 170) return;

    const numericYear = Number(String(year).match(/-?\d+/)?.[0]);
    const currentYear = new Date().getFullYear();

    showTimelineToast(
      Number.isFinite(numericYear) && numericYear >= currentYear
        ? pickRandom(futureDragWarnings)
        : pickRandom(sameYearDragWarnings),
    );
  }

  if (!hasTimeline) {
    return (
      <TimelineShell
        dragMode={dragMode}
        onToggleDragMode={() => setDragMode((current) => !current)}
        canReorder={false}
        sourceSelector={sourceSelector}
        readOnlyReason={readOnlyReason}
      >
        <section className="rounded-[1.6rem] border border-white/15 bg-zinc-900/75 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <Gamepad2 className="mx-auto h-12 w-12 text-red-200" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black text-white">No timeline disasters yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-100">
            Hit Add New Disaster and start documenting the chaos. Clean slate. Horrifying potential.
          </p>
        </section>
      </TimelineShell>
    );
  }

  if (!disasters.length) {
    return (
      <TimelineShell
        dragMode={dragMode}
        onToggleDragMode={() => setDragMode((current) => !current)}
        canReorder={false}
        sourceSelector={sourceSelector}
        readOnlyReason={readOnlyReason}
      >
        <section className="rounded-[1.6rem] border border-white/15 bg-zinc-900/75 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <h2 className="text-2xl font-black text-white">No matching disasters</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-100">
            The archive found nothing. Either the theory is too powerful or the spelling is acting suspicious.
          </p>
        </section>
      </TimelineShell>
    );
  }

  return (
    <TimelineShell
      dragMode={dragMode}
      onToggleDragMode={() => setDragMode((current) => !current)}
      canReorder={canEdit && disasters.length > 1}
      sourceSelector={sourceSelector}
      readOnlyReason={readOnlyReason}
    >
      <AnimatePresence>{timelineToast ? <TimelineToast message={timelineToast} /> : null}</AnimatePresence>
      <div className="relative pl-5 md:pl-8">
        <div className="absolute bottom-0 left-2 top-0 w-px bg-gradient-to-b from-sky-300 via-indigo-300 to-red-300 md:left-3" />
        <div className="grid gap-7">
          {groupedDisasters.map((group) => (
            <section key={group.year} className="grid gap-3">
              {dragMode ? (
                <div className="ml-1 text-xs font-black uppercase tracking-[0.28em] text-sky-100">
                  Same-year reorder zone: {group.year}
                </div>
              ) : null}
              {dragMode ? (
                <Reorder.Group
                  axis="y"
                  values={group.disasters}
                  onReorder={(nextItems) => onReorderYear(group.year, nextItems.map((item) => item.id))}
                  className="grid gap-5"
                >
                  {group.disasters.map((disaster, index) => (
                    <Reorder.Item
                      key={disaster.id}
                      value={disaster}
                      as="div"
                      className="list-none"
                      onDragEnd={(_, info) => handleDragEnd(group.year, info)}
                    >
                      <TimelineCard
                        disaster={disaster}
                        index={index}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onOpenDetail={onOpenDetail}
                        dragMode
                        changeState={recentChanges[disaster.id]?.type}
                        changeOrigin={recentChanges[disaster.id]?.origin}
                        canEdit={canEdit}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <div className="grid gap-5">
                  <AnimatePresence mode="popLayout">
                    {group.disasters.map((disaster, index) => (
                      <TimelineCard
                        key={disaster.id}
                        disaster={disaster}
                        index={index}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onOpenDetail={onOpenDetail}
                        changeState={recentChanges[disaster.id]?.type}
                        changeOrigin={recentChanges[disaster.id]?.origin}
                        canEdit={canEdit}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </TimelineShell>
  );
}
