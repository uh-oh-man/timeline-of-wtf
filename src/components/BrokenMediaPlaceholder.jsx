import { ImageOff } from "lucide-react";
import { useMemo } from "react";
import { brokenMediaMessages } from "../data/brokenMediaMessages";
import { pickRandom } from "../utils/helpers";

export default function BrokenMediaPlaceholder({ fileName, compact = false }) {
  const message = useMemo(() => pickRandom(brokenMediaMessages), []);

  return (
    <div className={`grid place-items-center rounded-2xl border border-sky-300/25 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_80%_90%,rgba(220,38,38,0.16),transparent_34%),rgba(9,9,11,0.92)] text-center shadow-inner shadow-black/50 ${compact ? "min-h-24 p-3" : "min-h-44 p-5"}`}>
      <div>
        <div className={`mx-auto inline-flex items-center justify-center rounded-2xl border border-red-200/30 bg-red-500/10 text-red-100 ${compact ? "h-9 w-9" : "h-12 w-12"}`}>
          <ImageOff className={compact ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
        </div>
        <p className="mt-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-sky-100">Evidence Missing</p>
        {compact ? null : <p className="mt-2 text-sm font-bold leading-6 text-zinc-100">{message}</p>}
        {fileName ? <p className="mt-1 truncate text-xs text-zinc-400">{fileName}</p> : null}
        {compact ? null : (
          <p className="mt-3 text-[0.7rem] font-semibold text-zinc-500">
            This may not actually be your fault. The website has chosen violence.
          </p>
        )}
      </div>
    </div>
  );
}
