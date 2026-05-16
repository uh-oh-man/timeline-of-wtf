import { FolderOpen, ImagePlus } from "lucide-react";
import { useMemo } from "react";
import { exampleMediaConfig } from "../data/exampleMediaConfig";

const bannerMessages = [
  "ADMIN EXAMPLE MODE - viewing fake sample data. Your real timeline is safe. Probably more than we deserve.",
  "EXAMPLE MODE ACTIVE - these disasters are fake, but the judgment is real.",
  "ADMIN EXAMPLE MODE - temporary nonsense loaded. The real timeline is hiding under the bed.",
  "DEMO LORE ACTIVE - edits here evaporate like promises from a game publisher.",
];

export default function ExampleModeBanner({
  onExit,
  onLoadFolder,
  onSelectFiles,
  mediaCount,
  generatedMediaCount,
  mediaStatus,
  fileInputRef,
}) {
  const message = useMemo(() => bannerMessages[Math.floor(Math.random() * bannerMessages.length)], []);

  return (
    <section className="rounded-3xl border border-sky-300/30 bg-sky-500/10 p-4 text-sm font-bold text-sky-50 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p>{message}</p>
          <p className="mt-1 text-xs leading-5 text-sky-100/85">
            Edits here are session-only. Leave Example Mode and the archive will pretend this never happened.
          </p>
          <p className="mt-1 text-xs leading-5 text-sky-100/85">
            Demo/example timeline content was made by AI. Your real stories, jokes, and bad decisions are still human-made.
          </p>
          <p className="mt-2 break-all rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-200">
            Automatic media folder: {exampleMediaConfig.publicFolder} ({exampleMediaConfig.publicUrlBase})
          </p>
          {mediaStatus ? <p className="mt-2 text-xs text-zinc-200">{mediaStatus}</p> : null}
          {generatedMediaCount ? (
            <p className="mt-2 text-xs text-cyan-100">
              {generatedMediaCount} public example media file{generatedMediaCount === 1 ? "" : "s"} auto-loaded from the manifest.
            </p>
          ) : null}
          {mediaCount ? (
            <p className="mt-2 text-xs text-cyan-100">{mediaCount} manually selected media file{mediaCount === 1 ? "" : "s"} loaded for this session.</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={onLoadFolder}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-2 text-xs font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Load Example Media Folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-2 text-xs font-black text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Select Example Files
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-2 text-xs font-black text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            Exit Example Mode
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={exampleMediaConfig.allowedTypes.join(",")}
        multiple
        className="sr-only"
        onChange={onSelectFiles}
      />
    </section>
  );
}
