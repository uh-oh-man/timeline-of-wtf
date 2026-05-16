import { FileWarning, ScrollText } from "lucide-react";
import { useMemo, useRef } from "react";
import FloatingWindow from "./FloatingWindow";
import JokeButton from "./JokeButton";
import { tosCoreSections, tosOptionalSections } from "../data/tosLongSections";

function shuffledSections() {
  const optional = [...tosOptionalSections].sort(() => Math.random() - 0.5).slice(0, 7);
  return [...tosCoreSections, ...optional].map((section, index) => ({ ...section, number: index + 1 }));
}

export default function LongTosWindow({ onAccept, onJokeClose, onClose, onScrolledBottom }) {
  const sections = useMemo(() => shuffledSections(), []);
  const didHitBottom = useRef(false);

  function handleScroll(event) {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (!didHitBottom.current && distanceFromBottom < 72) {
      didHitBottom.current = true;
      onScrolledBottom();
    }
  }

  return (
    <FloatingWindow
      title="Lore Terms Of Service"
      subtitle="946 pages compressed into one legally haunted window."
      onClose={onClose}
      widthClass="max-w-4xl"
      zIndexClass="z-[59]"
      bodyClassName="bg-zinc-950 p-0"
    >
      <div className="border-b border-white/10 bg-black/25 p-5">
        <div className="flex gap-3">
          <FileWarning className="mt-1 h-6 w-6 flex-none text-red-100" aria-hidden="true" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.26em] text-sky-100">Compliance Theater</p>
            <p className="mt-2 text-sm leading-6 text-zinc-100">
              By pretending to read this, you agree that the timeline may locally remember lore crimes, fake legal
              confidence, and any theory yelled with enough conviction.
            </p>
          </div>
        </div>
      </div>

      <div onScroll={handleScroll} className="max-h-[58vh] space-y-4 overflow-auto p-5">
        {sections.map((section) => (
          <section key={`${section.number}-${section.title}`} className="rounded-2xl border border-white/10 bg-zinc-900/55 p-4">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-sky-100" aria-hidden="true" />
              <h3 className="text-sm font-black uppercase tracking-widest text-white">
                {section.number}. {section.title}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-zinc-200">{section.body}</p>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Subsection {section.number}.B: Violations may result in vibes-based enforcement, dramatic sighing, or a
              strongly worded sticky note.
            </p>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 bg-black/25 p-5 sm:flex-row">
        <JokeButton
          type="button"
          onClick={onAccept}
          reactionType="bureaucratic"
          className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
        >
          Accept Without Reading
        </JokeButton>
        <JokeButton
          type="button"
          onClick={onJokeClose}
          reactionType="petty"
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          I Read Exactly None Of That
        </JokeButton>
        <JokeButton
          type="button"
          onClick={onJokeClose}
          reactionType="dramatic"
          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          Send To My Friend&apos;s Lawyer
        </JokeButton>
      </div>
    </FloatingWindow>
  );
}
