import { Flame, GitBranch, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cx } from "../utils/helpers";

export default function Header({ onAddDisaster, onOpenNodeWeb, adminMode = false, onSecretBadgeClick }) {
  const BadgeElement = adminMode ? "button" : "div";

  return (
    <motion.section
      className="relative overflow-hidden rounded-[1.8rem] border border-white/15 bg-zinc-900/75 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BadgeElement
        type={adminMode ? "button" : undefined}
        onClick={adminMode ? onSecretBadgeClick : undefined}
        title={adminMode ? "Restricted stamp feels slightly clickable." : undefined}
        className={cx(
          "mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-50",
          adminMode
            ? "cursor-help transition hover:border-red-200/45 hover:bg-red-500/10 hover:text-red-50 focus:outline-none focus:ring-4 focus:ring-red-300/25"
            : "",
        )}
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        Officially unofficial canon. Legally stupid.
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
          onClick={onAddDisaster}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-red-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-red-950/50 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-sky-300/30"
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
