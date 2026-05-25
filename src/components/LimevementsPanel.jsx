import { CheckCircle2, Lock } from "lucide-react";
import { limevements } from "../data/limevements";
import { cx } from "../utils/helpers";

export default function LimevementsPanel({ state }) {
  const unlocked = state?.unlocked || {};
  const unlockedAt = state?.unlockedAt || {};

  return (
    <section className="grid gap-3">
      <p className="text-xs text-zinc-400">
        Limevements unlocked: {Object.keys(unlocked).filter((key) => unlocked[key]).length} / {limevements.length}
      </p>
      <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
        {limevements.map((item) => {
          const isUnlocked = Boolean(unlocked[item.id]);
          return (
            <article
              key={item.id}
              className={cx(
                "rounded-2xl border p-3",
                isUnlocked ? "border-lime-300/30 bg-lime-500/10" : "border-white/10 bg-zinc-900/60",
              )}
            >
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-lime-100" aria-hidden="true" />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                )}
                <p className="text-sm font-black text-white">{isUnlocked ? item.title : "???"}</p>
              </div>
              <p className="mt-1 text-xs text-zinc-300">{isUnlocked ? item.description : "Undiscovered limevement."}</p>
              {isUnlocked && unlockedAt[item.id] ? (
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-zinc-500">
                  Unlocked {new Date(unlockedAt[item.id]).toLocaleString()}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
