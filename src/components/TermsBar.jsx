import { FileWarning } from "lucide-react";
import JokeButton from "./JokeButton";

export default function TermsBar({ message, onAccept, onReview, onDismiss }) {
  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-zinc-950/88 p-4 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <FileWarning className="mt-1 h-5 w-5 flex-none text-red-100" aria-hidden="true" />
          <div>
            <p className="text-sm leading-6 text-zinc-100">{message.text}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:flex-none">
          <JokeButton
            type="button"
            onClick={onAccept}
            reactionType="bureaucratic"
            className="rounded-2xl bg-red-500 px-4 py-3 text-xs font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35"
          >
            {message.buttons.accept}
          </JokeButton>
          <JokeButton
            type="button"
            onClick={onReview}
            reactionType="dramatic"
            className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-xs font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-yellow-300/25"
          >
            {message.buttons.review}
          </JokeButton>
          <JokeButton
            type="button"
            onClick={onDismiss}
            reactionType="petty"
            className="rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-xs font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            {message.buttons.blame}
          </JokeButton>
        </div>
      </div>
    </div>
  );
}
