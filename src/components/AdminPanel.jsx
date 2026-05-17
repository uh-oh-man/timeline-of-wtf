import { AnimatePresence, motion } from "framer-motion";
import { BookMarked, CloudLightning, Database, Download, Eye, FileWarning, FolderOpen, GitBranch, Megaphone, ShieldCheck, Sparkles, Trash2, Trophy, Upload } from "lucide-react";
import { useState } from "react";
import FloatingWindow from "./FloatingWindow";

export default function AdminPanel({
  onClose,
  onOpenAchievements,
  onOpenLore,
  onOpenNodeWeb,
  onShowTos,
  onTriggerCaptcha,
  onTriggerAd,
  onTriggerOrb,
  onEnterExampleMode,
  onExitExampleMode,
  onLoadExampleMediaFolder,
  onExportTimeline,
  onImportTimeline,
  onReset,
  onSimulateRemoteUpdate,
  exampleMode,
  counts,
}) {
  const [confirmWipe, setConfirmWipe] = useState(false);

  return (
    <FloatingWindow
      title="Admin Panel"
      subtitle="Dev access granted. Please do not sue the buttons."
      onClose={onClose}
      widthClass="max-w-3xl"
      zIndexClass="z-[58]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
      closeOnOutsideClick={false}
      closeOnEscape={false}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/15 bg-black/30 p-4">
          <Database className="h-6 w-6 text-sky-200" aria-hidden="true" />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-zinc-400">Disasters</p>
          <p className="text-2xl font-black text-white">{counts.disasters}</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-black/30 p-4">
          <Trophy className="h-6 w-6 text-yellow-100" aria-hidden="true" />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-zinc-400">Achievements</p>
          <p className="text-2xl font-black text-white">{counts.achievements}</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-black/30 p-4">
          <ShieldCheck className="h-6 w-6 text-red-100" aria-hidden="true" />
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-zinc-400">Mode</p>
          <p className="text-2xl font-black text-white">{counts.mode || (exampleMode ? "Example" : "Local")}</p>
        </div>
      </div>

      {onSimulateRemoteUpdate ? (
        <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-cyan-100">Mock Sync Tools</p>
          <p className="mt-2 text-sm leading-6 text-zinc-200">
            Test live shared timeline updates without calling a real server. The server is imaginary, but the anxiety is real.
          </p>
          <button
            type="button"
            onClick={onSimulateRemoteUpdate}
            className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-500/15 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-500/25 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
          >
            <CloudLightning className="h-4 w-4" aria-hidden="true" />
            Simulate Remote Update
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenAchievements}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Show Ledger + Secrets
        </button>
        <button
          type="button"
          onClick={onOpenLore}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/25 bg-cyan-500/15 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-500/25 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
        >
          <BookMarked className="h-4 w-4" aria-hidden="true" />
          Website Lore Ledger
        </button>
        <button
          type="button"
          onClick={onOpenNodeWeb}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          Open Node Web
        </button>
        <button
          type="button"
          onClick={onShowTos}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200/25 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
        >
          <FileWarning className="h-4 w-4" aria-hidden="true" />
          Show ToS Bar
        </button>
        <button
          type="button"
          onClick={onTriggerCaptcha}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-200/25 bg-yellow-300/10 px-4 py-3 text-sm font-black text-yellow-50 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-4 focus:ring-yellow-300/25"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Trigger CAPTCHA
        </button>
        <button
          type="button"
          onClick={onTriggerAd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-200/25 bg-fuchsia-500/10 px-4 py-3 text-sm font-black text-fuchsia-50 transition hover:bg-fuchsia-500/20 focus:outline-none focus:ring-4 focus:ring-fuchsia-300/25"
        >
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          Trigger Ad
        </button>
        <button
          type="button"
          onClick={onTriggerOrb}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200/25 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Trigger Orb
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-sky-300/20 bg-sky-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-sky-100">Example Timeline Controls</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <motion.button
            type="button"
            onClick={exampleMode ? onExitExampleMode : onEnterExampleMode}
            layout
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            {exampleMode ? "Exit Example Mode" : "View Example Timeline"}
          </motion.button>
          <AnimatePresence>
            {exampleMode ? (
              <motion.button
                type="button"
                onClick={onLoadExampleMediaFolder}
                layout
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                initial={{ opacity: 0, width: 0, x: 18 }}
                animate={{ opacity: 1, width: "auto", x: 0 }}
                exit={{ opacity: 0, width: 0, x: 18 }}
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                Load Example Media Folder
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/15 bg-black/25 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Data Management</p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          Backup and restore timeline evidence with .uhoh files. Photos/videos are not included yet because the archive
          refuses to lie about file magic.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportTimeline}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Timeline (.uhoh)
          </button>
          <button
            type="button"
            onClick={onImportTimeline}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/25 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import Timeline (.uhoh)
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-red-300/25 bg-red-500/10 p-4">
        <p className="text-sm leading-6 text-zinc-100">
          {confirmWipe
            ? "This will wipe your local timeline, achievements, secrets, settings, and app data like a BIOS update with anger issues. Continue?"
            : "Wipe only clears this app's namespaced localStorage keys. It does not touch unrelated browser storage."}
        </p>
        {confirmWipe ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
            >
              Wipe It
            </button>
            <button
              type="button"
              onClick={() => setConfirmWipe(false)}
              className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              Abort Wipe
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Wipe Website Data
          </button>
        )}
      </div>
    </FloatingWindow>
  );
}
