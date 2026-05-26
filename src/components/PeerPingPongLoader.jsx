import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cx } from "../utils/helpers";

export default function PeerPingPongLoader({ state = "connecting", label = "Connecting peer..." }) {
  const reducedMotion = useReducedMotion();
  const failed = state === "failed";
  const connected = state === "connected";

  return (
    <div className="rounded-2xl border border-white/12 bg-zinc-950/75 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-sky-100">{label}</p>
        {connected ? <CheckCircle2 className="h-4 w-4 text-emerald-200" aria-hidden="true" /> : null}
        {failed ? <XCircle className="h-4 w-4 text-red-200" aria-hidden="true" /> : null}
      </div>
      <div className="mt-3 flex h-12 items-center justify-between rounded-xl border border-white/10 bg-black/35 px-4">
        <motion.span
          className={cx(
            "h-8 w-1.5 rounded-full",
            failed ? "bg-red-200/60" : connected ? "bg-emerald-200" : "bg-sky-200",
          )}
          animate={reducedMotion || connected || failed ? {} : { y: [-5, 5, -5] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative h-7 flex-1">
          {reducedMotion ? (
            <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-1/2 rounded-full bg-sky-200/70" />
            </span>
          ) : (
            <motion.span
              className={cx(
                "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-[0_0_18px_rgba(125,211,252,0.55)]",
                failed ? "bg-red-300" : connected ? "bg-emerald-200" : "bg-white",
              )}
              animate={
                failed
                  ? { x: ["45%", "45%"], y: [0, 12], opacity: [1, 0.2] }
                  : connected
                    ? { x: "48%", scale: [1, 1.5, 1], opacity: 1 }
                    : { x: ["0%", "96%", "0%"] }
              }
              transition={failed || connected ? { duration: 0.55 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        <motion.span
          className={cx(
            "h-8 w-1.5 rounded-full",
            failed ? "bg-red-200/60" : connected ? "bg-emerald-200" : "bg-red-200",
          )}
          animate={reducedMotion || connected || failed ? {} : { y: [5, -5, 5] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
