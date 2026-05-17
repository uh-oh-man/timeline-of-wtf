import { AlertTriangle, ArchiveRestore, FileJson, Merge, X } from "lucide-react";
import { useState } from "react";
import FloatingWindow from "./FloatingWindow";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export default function ImportPreviewWindow({ importResult, onMerge, onReplace, onCancel }) {
  const [confirmReplace, setConfirmReplace] = useState(false);

  if (!importResult?.valid) return null;

  const { summary, warnings } = importResult;

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
            <FileJson className="mt-1 h-6 w-6 flex-none text-sky-100" aria-hidden="true" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-sky-100">Detected Archive</p>
              <h3 className="mt-1 text-2xl font-black text-white">{summary.appName}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-200">
                Created: {summary.createdAt || "unknown, which is rude"} | Export version: {summary.exportVersion} |
                Storage version: {summary.storageVersion}
              </p>
              <p className="mt-2 text-sm leading-6 text-yellow-100">
                Media included: {summary.mediaIncluded ? "claimed, but unsupported here" : "no"}.
                Photos/videos are not imported yet.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Disasters" value={summary.eventCount} />
          <Stat label="Tags" value={summary.tagCount} />
          <Stat label="Future Games" value={summary.plannedGameCount} />
        </div>

        {warnings.length ? (
          <section className="rounded-3xl border border-yellow-200/25 bg-yellow-300/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-yellow-100">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Compatibility Warnings
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

        {confirmReplace ? (
          <section className="rounded-3xl border border-red-300/30 bg-red-500/10 p-4">
            <p className="text-sm font-bold leading-6 text-red-50">
              This will replace your current local timeline. Export a backup first unless you enjoy emotional damage.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onReplace}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
              >
                <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                Replace Timeline
              </button>
              <button
                type="button"
                onClick={() => setConfirmReplace(false)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                Abort Before Regret
              </button>
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onMerge}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <Merge className="h-4 w-4" aria-hidden="true" />
              Merge Import
            </button>
            <button
              type="button"
              onClick={() => setConfirmReplace(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
            >
              <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
              Replace Current Timeline
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel Before The Timeline Gets Ideas
            </button>
          </div>
        )}
      </div>
    </FloatingWindow>
  );
}
