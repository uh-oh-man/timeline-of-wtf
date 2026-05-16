import { BadgeDollarSign } from "lucide-react";
import FloatingWindow from "./FloatingWindow";
import JokeButton from "./JokeButton";

export default function FakeAdWindow({ ad, onClose }) {
  if (!ad) return null;

  return (
    <FloatingWindow
      title={ad.title}
      subtitle={ad.sponsor}
      onClose={onClose}
      widthClass="max-w-md"
      zIndexClass="z-[54]"
      overlay={false}
      initialPosition={{ x: 120, y: -20 }}
      bodyClassName="bg-zinc-950 p-5"
    >
      <div className="rounded-3xl border border-red-300/25 bg-red-500/10 p-4">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-200/35 bg-yellow-300/15 px-3 py-1 text-xs font-black uppercase text-yellow-100">
          <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
          {ad.badge}
        </div>
        <p className="text-sm leading-6 text-zinc-100">{ad.body}</p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-200">
          {ad.bulletPoints.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-fuchsia-200" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">{ad.tinyDisclaimer}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <JokeButton
          type="button"
          onClick={onClose}
          reactionType="happy"
          className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
        >
          {ad.cta}
        </JokeButton>
        <JokeButton
          type="button"
          onClick={onClose}
          reactionType="orbTouched"
          className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          Report Ad To The Orb
        </JokeButton>
      </div>
    </FloatingWindow>
  );
}
