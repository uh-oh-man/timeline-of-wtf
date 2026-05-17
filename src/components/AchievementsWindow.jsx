import { Keyboard, Lock, Trophy } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import { achievements } from "../data/achievements";
import { secretRegistry } from "../data/secretRegistry";
import { cx } from "../utils/helpers";

export default function AchievementsWindow({ unlockedIds, knownSecretIds = [], adminMode = false, onClose }) {
  const unlocked = new Set(unlockedIds);
  const knownSecrets = new Set(knownSecretIds);
  const unlockedCount = achievements.filter((achievement) => unlocked.has(achievement.id)).length;
  const discoveredSecretCount = secretRegistry.filter((secret) => knownSecrets.has(secret.id)).length;

  return (
    <FloatingWindow
      title="Classified Achievement Ledger"
      subtitle="Definitely not tracking you. Relax."
      onClose={onClose}
      widthClass="max-w-4xl"
      zIndexClass="z-[55]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/15 bg-black/30 p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-100" aria-hidden="true" />
          <div>
            <p className="text-sm font-black text-white">
              {unlockedCount} / {achievements.length} unlocked
            </p>
            <p className="text-xs text-zinc-300">
              Stored locally in your browser because the timeline remembers. Unfortunately.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {achievements.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.id);
          const showSecret = achievement.hidden && !isUnlocked;

          return (
            <article
              key={achievement.id}
              className={cx(
                "rounded-3xl border p-4 transition",
                isUnlocked
                  ? "border-yellow-200/35 bg-yellow-300/10 text-zinc-100"
                  : "border-white/10 bg-zinc-900/65 text-zinc-400",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cx(
                    "mt-1 rounded-2xl border p-2",
                    isUnlocked
                      ? "border-yellow-200/35 bg-yellow-300/15 text-yellow-100"
                      : "border-white/10 bg-black/25 text-zinc-500",
                  )}
                >
                  {isUnlocked ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className={cx("font-black", isUnlocked ? "text-white" : "text-zinc-300")}>
                    {showSecret ? "???" : achievement.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6">
                    {showSecret
                      ? "Classified until you accidentally do something stupid enough."
                      : achievement.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-5 rounded-3xl border border-sky-300/25 bg-sky-500/10 p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-sky-100" aria-hidden="true" />
            <div>
              <h3 className="font-black text-white">Known Forbidden Inputs</h3>
              <p className="text-xs leading-5 text-zinc-300">
                Local-only secret history. The keyboard remembers because that is apparently where we are now.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-sky-200/25 bg-black/25 px-3 py-1 text-xs font-black text-sky-50">
            {discoveredSecretCount} / {secretRegistry.length} discovered
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {secretRegistry.map((secret) => {
            const discovered = knownSecrets.has(secret.id);
            const visible = adminMode || discovered;

            return (
              <article
                key={secret.id}
                className={cx(
                  "rounded-2xl border p-3",
                  discovered
                    ? "border-sky-200/30 bg-black/25 text-zinc-100"
                    : "border-white/10 bg-zinc-900/55 text-zinc-400",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="rounded-full border border-white/15 bg-zinc-950 px-3 py-1 text-sm font-black text-sky-50">
                    {visible ? secret.trigger : "???"}
                  </code>
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-zinc-400">
                    {discovered ? "Discovered" : adminMode ? "Admin Preview" : "Unknown"}
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-white">
                  {visible ? secret.title : "Undiscovered input"}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">
                  {visible ? secret.description : "The archive knows something you do not. Annoying, isn't it?"}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </FloatingWindow>
  );
}
