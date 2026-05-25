import { BookMarked, Bot, Keyboard, Smartphone } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import { creatureLore } from "../data/websiteLore";
import { secretRegistry } from "../data/secretRegistry";
import { cx } from "../utils/helpers";

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

export default function WebsiteLoreHelper({
  onClose,
  knownSecretIds = [],
  adminMode = false,
  limeUnlocked = false,
}) {
  const knownSecrets = new Set(knownSecretIds);
  const discoveredSecretCount = secretRegistry.filter((secret) => knownSecrets.has(secret.id)).length;

  return (
    <FloatingWindow
      title="Website Lore Helper"
      subtitle="Hidden feature map. You still had to find the map, so calm down."
      onClose={onClose}
      widthClass="max-w-5xl"
      zIndexClass="z-[61]"
      bodyClassName="bg-zinc-950 p-5 md:p-6"
    >
      <div className="grid gap-4">
        <Section icon={Keyboard} title="Known Typed Secrets">
          <p className="mb-3 rounded-2xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-xs font-black text-sky-50">
            {discoveredSecretCount} / {secretRegistry.length} discovered.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {secretRegistry.map((secret) => {
              const discovered = knownSecrets.has(secret.id);
              const visible = adminMode || discovered;

              return (
                <article
                  key={secret.id}
                  className={cx(
                    "rounded-2xl border p-3",
                    discovered ? "border-sky-200/25 bg-sky-500/10" : "border-white/10 bg-zinc-900/60",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-full border border-white/15 bg-zinc-950 px-3 py-1 text-sm font-black text-sky-50">
                      {visible ? secret.trigger : "???"}
                    </code>
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {discovered ? "Discovered" : adminMode ? "Admin Preview" : "Unknown"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-black text-white">
                    {visible ? secret.title : "Undiscovered input"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">
                    {visible ? secret.description : "The archive knows something you do not. Annoying, isn't it?"}
                  </p>
                </article>
              );
            })}
          </div>
        </Section>

        <Section icon={Smartphone} title="Touch / Phone Access">
          <div className="grid gap-3 text-sm leading-6 text-zinc-200">
            <p>
              Some hidden features are usually triggered by typing secret words. On phones/touchscreens, use gestures instead.
            </p>
            <p>
              Admin mode: long-press the title badge{" "}
              <span className="font-black text-sky-100">Officially unofficial canon. Legally stupid.</span> for about 4-5 seconds.
              Hold until the progress glow completes. Releasing early cancels.
            </p>
            <p>
              Website Lore Helper: once Admin mode is active, long-press that same badge for about 2 seconds or triple-tap it.
            </p>
            <p>
              Orb: long-press the background idle orb for about 1.2-2 seconds to trigger panic mode.
            </p>
            <p>
              Achievements: tap <span className="font-black text-sky-100">Canon level</span> in the footer 5 times within about 4 seconds.
            </p>
            <p>
              Hidden popups you can trigger through discovered/admin shortcuts: ID popup, fake ads, ToS, CAPTCHA, orb, and achievements.
            </p>
            {adminMode || limeUnlocked ? (
              <p className="rounded-2xl border border-lime-300/25 bg-lime-500/10 px-3 py-2 text-xs text-lime-100">
                lime unlock: click/tap the orb while it is fleeing in foreground escape mode.
              </p>
            ) : null}
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

        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4">
          <div className="flex gap-3">
            <BookMarked className="mt-1 h-5 w-5 flex-none text-red-100" aria-hidden="true" />
            <p className="text-sm leading-6 text-zinc-300">
              This helper is about website behavior/lore. User-created timeline stories are human-made unless demo/example content is intentionally imported.
            </p>
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
}
