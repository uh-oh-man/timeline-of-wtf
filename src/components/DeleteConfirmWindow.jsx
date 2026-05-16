import { ShieldAlert } from "lucide-react";
import FloatingWindow from "./FloatingWindow";

export default function DeleteConfirmWindow({ disaster, onCancel, onConfirm }) {
  return (
    <FloatingWindow
      title="Evidence Disposal Request"
      subtitle="The archive would like a signed confession."
      onClose={onCancel}
      widthClass="max-w-lg"
      zIndexClass="z-[62]"
      bodyClassName="bg-zinc-950 p-5"
      closeOnOutsideClick={false}
      closeOnEscape={false}
    >
      <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-5">
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 h-6 w-6 flex-none text-red-100" aria-hidden="true" />
          <div>
            <p className="text-lg font-black text-white">Delete this disaster?</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              The timeline will deny knowing it. Evidence marked for suspicious evaporation:
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-black text-red-50">
              {disaster?.title || "Unknown disaster"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
          >
            Delete Evidence
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            Abort Cover-Up
          </button>
        </div>
      </div>
    </FloatingWindow>
  );
}
