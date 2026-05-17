import { Flame, GitBranch, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cx } from "../utils/helpers";

export default function Header({
  onAddDisaster,
  onOpenNodeWeb,
  adminMode = false,
  onSecretBadgeClick,
  onAdminLongPress,
  canEdit = true,
  readOnlyReason = "",
}) {
  const BadgeElement = "button";
  const [holdingBadge, setHoldingBadge] = useState(false);
  const holdTimer = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(holdTimer.current);
  }, []);

  function clearBadgeHold() {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHoldingBadge(false);
  }

  function startBadgeHold() {
    clearBadgeHold();
    setHoldingBadge(true);
    holdTimer.current = window.setTimeout(() => {
      setHoldingBadge(false);
      if (adminMode) {
        onSecretBadgeClick?.();
      } else {
        onAdminLongPress?.();
      }
    }, adminMode ? 2000 : 4500);
  }

  function handleAddDisaster() {
    if (!canEdit) {
      window.alert(readOnlyReason || "This timeline is view-only. The archive has locked the pens.");
      return;
    }
    onAddDisaster();
  }

  return (
    <motion.section
      className="relative overflow-hidden rounded-[1.8rem] border border-white/15 bg-zinc-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BadgeElement
        type="button"
        onClick={adminMode ? onSecretBadgeClick : undefined}
        onPointerDown={startBadgeHold}
        onPointerUp={clearBadgeHold}
        onPointerLeave={clearBadgeHold}
        onPointerCancel={clearBadgeHold}
        title={adminMode ? "Triple-tap or long-press for the ledger." : "Long-press to convince the archive you are admin."}
        className={cx(
          "relative mb-5 inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-50 transition focus:outline-none focus:ring-4",
          adminMode
            ? "cursor-help hover:border-red-200/45 hover:bg-red-500/10 hover:text-red-50 focus:ring-red-300/25"
            : "cursor-help hover:border-sky-200/45 hover:bg-sky-500/25 focus:ring-sky-300/25",
          holdingBadge ? "shadow-[0_0_28px_rgba(34,211,238,0.38)]" : "",
        )}
      >
        <motion.span
          className="absolute inset-y-0 left-0 bg-cyan-300/20"
          initial={false}
          animate={{ width: holdingBadge ? "100%" : "0%" }}
          transition={{ duration: holdingBadge ? (adminMode ? 2 : 4.5) : 0.12, ease: "linear" }}
          aria-hidden="true"
        />
        <Flame className="h-4 w-4" aria-hidden="true" />
        <span className="relative">Officially unofficial canon. Legally stupid.</span>
      </BadgeElement>

      <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
        The Timeline of
        <span className="block bg-gradient-to-r from-cyan-200 via-indigo-200 to-red-300 bg-clip-text text-transparent">
          What The Fuck
        </span>
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-100 md:text-lg">
        A cursed lore archive for games, bad theories, inside jokes, and whatever your friend said at 2 AM that somehow became canon.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleAddDisaster}
          disabled={!canEdit}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-red-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-950/50 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-sky-300/30 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
          Add New Disaster
        </button>
        <button
          type="button"
          onClick={onOpenNodeWeb}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/80 px-5 py-4 text-base font-black text-zinc-50 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          <GitBranch className="h-5 w-5" aria-hidden="true" />
          Open Node Web
        </button>
      </div>
    </motion.section>
  );
}
