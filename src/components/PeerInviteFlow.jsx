import { Copy, Link2, PlugZap, Shield, UserRound } from "lucide-react";
import { cx } from "../utils/helpers";

function InputLabel({ title, children }) {
  return (
    <label className="grid gap-2 text-sm text-zinc-200">
      <span className="font-black text-white">{title}</span>
      {children}
    </label>
  );
}

function Pill({ label, tone = "neutral" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        tone === "good"
          ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-100"
          : tone === "warn"
            ? "border-amber-300/35 bg-amber-500/15 text-amber-100"
            : "border-white/15 bg-zinc-900/70 text-zinc-300",
      )}
    >
      {label}
    </span>
  );
}

export default function PeerInviteFlow({
  mode = "host",
  connectionState = "disconnected",
  displayName = "",
  passphrase = "",
  inviteCode = "",
  answerCode = "",
  statusMessage = "",
  waitingForAnswer = false,
  onDisplayNameChange,
  onPassphraseChange,
  onInviteCodeChange,
  onAnswerCodeChange,
  onStartHost,
  onGenerateAnswer,
  onApplyAnswer,
  onCopyInviteCode,
  onCopyAnswerCode,
  onDisconnect,
}) {
  const connected = connectionState === "connected";
  const isHost = mode === "host";

  return (
    <div className="grid gap-4">
      <article className="rounded-3xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-50">
        Peer Sync is live-only. Both users must keep the page open. No backend is storing this session. Export a .uhoh backup if you care about what just happened.
      </article>

      <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill label={`Mode: ${isHost ? "Host" : "Join"}`} />
          <Pill
            label={connected ? "Connected" : "Disconnected"}
            tone={connected ? "good" : waitingForAnswer ? "warn" : "neutral"}
          />
        </div>
        {statusMessage ? <p className="mt-3 text-xs text-zinc-300">{statusMessage}</p> : null}
      </article>

      <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <InputLabel title="Display name">
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              <input
                type="text"
                value={displayName}
                onChange={(event) => onDisplayNameChange?.(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-white/15 bg-zinc-900/85 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                placeholder={isHost ? "Host name" : "Guest name"}
              />
            </div>
          </InputLabel>

          <InputLabel title="Security key / passphrase">
            <div className="relative">
              <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              <input
                type="text"
                value={passphrase}
                onChange={(event) => onPassphraseChange?.(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-white/15 bg-zinc-900/85 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                placeholder="Shared key with your friend"
              />
            </div>
          </InputLabel>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          This key encrypts the peer session. If your friend types a different key, the timeline will pretend it does not know them.
        </p>
      </article>

      {isHost ? (
        <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200">Start Peer Sync Session</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStartHost}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              <PlugZap className="h-4 w-4" aria-hidden="true" />
              Start Peer Sync Session
            </button>
            {connected ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-2 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
              >
                Disconnect
              </button>
            ) : null}
          </div>

          <InputLabel title="Invite code (send this to your friend)">
            <textarea
              value={inviteCode}
              onChange={(event) => onInviteCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Host offer code appears here"
            />
          </InputLabel>
          <button
            type="button"
            onClick={onCopyInviteCode}
            disabled={!inviteCode}
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Invite Code
          </button>

          <InputLabel title="Paste friend&apos;s answer code">
            <textarea
              value={answerCode}
              onChange={(event) => onAnswerCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Paste guest answer code here"
            />
          </InputLabel>
          <button
            type="button"
            onClick={onApplyAnswer}
            disabled={!answerCode}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-50 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-300/25 disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Paste Friend&apos;s Answer Code
          </button>
        </article>
      ) : (
        <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200">Join Sync Session</p>
          <InputLabel title="Host invite code">
            <textarea
              value={inviteCode}
              onChange={(event) => onInviteCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Paste host invite code"
            />
          </InputLabel>
          <button
            type="button"
            onClick={onGenerateAnswer}
            disabled={!inviteCode}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-50"
          >
            <PlugZap className="h-4 w-4" aria-hidden="true" />
            Generate Answer Code
          </button>

          <InputLabel title="Answer code (send back to host)">
            <textarea
              value={answerCode}
              onChange={(event) => onAnswerCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Generated guest answer code"
            />
          </InputLabel>
          <button
            type="button"
            onClick={onCopyAnswerCode}
            disabled={!answerCode}
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy Answer Code
          </button>
        </article>
      )}
    </div>
  );
}
