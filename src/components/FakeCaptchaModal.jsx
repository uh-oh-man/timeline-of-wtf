import { Check, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import FloatingWindow from "./FloatingWindow";
import JokeButton from "./JokeButton";
import { cx } from "../utils/helpers";

export default function FakeCaptchaModal({ variant, onComplete, closeOnOutsideClick = true }) {
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState([]);
  const [phraseTouched, setPhraseTouched] = useState(false);
  const [jokeReaction, setJokeReaction] = useState("");

  if (!variant) return null;

  const hasInteracted =
    variant.type === "grid" ? selected.length > 0 : variant.type === "phrase" ? phraseTouched : checked;

  function complete() {
    onComplete(variant.achievementId || "captcha_done");
  }

  return (
    <FloatingWindow
      title={variant.title}
      subtitle={variant.subtitle}
      onClose={complete}
      closeOnOutsideClick={closeOnOutsideClick}
      widthClass="max-w-lg"
      zIndexClass="z-[65]"
      bodyClassName="bg-zinc-950 p-5"
    >
      <div className="rounded-3xl border border-white/15 bg-black/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-red-100">
          <ShieldQuestion className="h-5 w-5" aria-hidden="true" />
          Verification Required
        </div>
        <p className="text-sm leading-6 text-zinc-100">{variant.text}</p>

        {variant.type === "checkbox" ? (
          <button
            type="button"
            onClick={() => setChecked(true)}
            className={cx(
              "mt-4 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
              checked
                ? "border-sky-300/45 bg-sky-500/15 text-sky-50"
                : "border-white/15 bg-zinc-900/80 text-zinc-100 hover:bg-white/10",
            )}
          >
            <span className="grid h-5 w-5 place-items-center rounded border border-white/30 bg-black/30">
              {checked ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
            </span>
            {variant.checkboxLabel}
          </button>
        ) : null}

        {variant.type === "grid" ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {variant.labels.map((label) => {
              const active = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current.includes(label)
                        ? current.filter((item) => item !== label)
                        : [...current, label],
                    )
                  }
                  className={cx(
                    "min-h-20 rounded-2xl border p-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                    active
                      ? "border-fuchsia-200/50 bg-fuchsia-500/20 text-fuchsia-50"
                      : "border-white/15 bg-zinc-900/80 text-zinc-100 hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        {variant.type === "phrase" ? (
          <div className="mt-4">
            <input
              onChange={() => setPhraseTouched(true)}
              onFocus={() => setPhraseTouched(true)}
              className="w-full rounded-2xl border border-white/15 bg-zinc-900/95 px-4 py-3 text-zinc-50 caret-red-300 outline-none placeholder:text-zinc-300 focus:border-red-300/50 focus:ring-4 focus:ring-red-400/30"
              placeholder="I will not abuse time travel"
            />
            <p className="mt-2 text-xs text-zinc-400">{variant.smallText}</p>
          </div>
        ) : null}

        {hasInteracted ? (
          <p className="mt-4 rounded-2xl border border-yellow-200/25 bg-yellow-300/10 p-3 text-sm font-bold text-yellow-50">
            {variant.response}
          </p>
        ) : null}

        {jokeReaction ? (
          <p className="mt-4 rounded-2xl border border-sky-200/25 bg-sky-500/10 p-3 text-sm font-bold text-sky-50">
            {jokeReaction}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <JokeButton
          type="button"
          onClick={complete}
          reactionType="bureaucratic"
          className="w-full rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300/35 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!hasInteracted && variant.type !== "phrase"}
        >
          {variant.button}
        </JokeButton>
        {variant.jokeButton ? (
          <JokeButton
            type="button"
            onClick={() => setJokeReaction(variant.jokeReaction)}
            reactionType={variant.jokeReactionType}
            delayClose={false}
            className="w-full rounded-2xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm font-black text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            {variant.jokeButton}
          </JokeButton>
        ) : null}
      </div>
    </FloatingWindow>
  );
}
