import { BookMarked, Bot, Keyboard, Sparkles, Wrench } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import { creatureLore, microReactionCatalog } from "../data/websiteLore";
import { secretRegistry } from "../data/secretRegistry";

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 text-sky-100" aria-hidden="true" />
        <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default function WebsiteLoreLedger({
  onClose,
  onOpenAchievements,
  onOpenNodeWeb,
  onShowTos,
  onTriggerCaptcha,
  onTriggerAd,
  onTriggerOrb,
}) {
  return (
    <FloatingWindow
      title="Website Lore Ledger"
      subtitle="Internal nonsense registry. Do not cite in court."
      onClose={onClose}
      widthClass="max-w-5xl"
      zIndexClass="z-[61]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
    >
      <div className="grid gap-4">
        <Section icon={Keyboard} title="Known Typed Secrets / Secret Registry">
          <div className="grid gap-3 md:grid-cols-2">
            {secretRegistry.map((secret) => (
              <article key={secret.id} className="rounded-2xl border border-sky-200/20 bg-sky-500/10 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-full border border-white/15 bg-zinc-950 px-3 py-1 text-sm font-black text-sky-50">
                    {secret.trigger}
                  </code>
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">
                    {secret.requiresAdmin ? "Admin-only" : secret.category}
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-white">{secret.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">{secret.description}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section icon={Bot} title="Website Creature Lore">
          <div className="grid gap-3 md:grid-cols-2">
            {creatureLore.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-zinc-900/65 p-3">
                <h4 className="font-black text-white">{item.title}</h4>
                <p className="mt-1 text-sm leading-6 text-zinc-300">{item.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section icon={Sparkles} title="Micro-Reaction Catalog">
          <div className="flex flex-wrap gap-2">
            {microReactionCatalog.map((reaction) => (
              <span
                key={reaction}
                className="rounded-full border border-red-200/25 bg-red-500/10 px-3 py-1 text-sm font-black text-red-50"
              >
                {reaction}
              </span>
            ))}
          </div>
        </Section>

        <Section icon={Wrench} title="Admin Tools">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={onOpenAchievements}
              className="rounded-2xl border border-sky-200/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              Open Achievements
            </button>
            <button
              type="button"
              onClick={onOpenAchievements}
              className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              Show Known Secrets
            </button>
            <button
              type="button"
              onClick={onShowTos}
              className="rounded-2xl border border-red-200/25 bg-red-500/15 px-4 py-3 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
            >
              Show ToS
            </button>
            <button
              type="button"
              onClick={onOpenNodeWeb}
              className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              Open Node Web
            </button>
            <button
              type="button"
              onClick={onTriggerCaptcha}
              className="rounded-2xl border border-yellow-200/25 bg-yellow-300/10 px-4 py-3 text-sm font-black text-yellow-50 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-4 focus:ring-yellow-300/25"
            >
              Trigger CAPTCHA
            </button>
            <button
              type="button"
              onClick={onTriggerAd}
              className="rounded-2xl border border-fuchsia-200/25 bg-fuchsia-500/10 px-4 py-3 text-sm font-black text-fuchsia-50 transition hover:bg-fuchsia-500/20 focus:outline-none focus:ring-4 focus:ring-fuchsia-300/25"
            >
              Trigger Ad
            </button>
            <button
              type="button"
              onClick={onTriggerOrb}
              className="rounded-2xl border border-cyan-200/25 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-4 focus:ring-cyan-300/25"
            >
              Trigger Orb
            </button>
          </div>
        </Section>

        <Section icon={BookMarked} title="Future Hidden Things">
          <p className="text-sm leading-6 text-zinc-300">
            Any future secret triggers should be added to secretRegistry.js so this ledger can display them without
            needing custom UI surgery.
          </p>
        </Section>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex gap-3">
            <BookMarked className="mt-1 h-5 w-5 flex-none text-red-100" aria-hidden="true" />
            <p className="text-sm leading-6 text-zinc-300">
              This ledger is about website behavior/lore. User-created timeline stories are human-made unless the user
              intentionally imports demo/example content.
            </p>
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
}
