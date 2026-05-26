import { Copy, Link2, PlugZap, Shield, UserRound } from "lucide-react";
import { cx } from "../utils/helpers";
import PeerPingPongLoader from "./PeerPingPongLoader";

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
  busyMode = "",
  answerAccepted = false,
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
  const busy = Boolean(busyMode);
  const showReset = Boolean(inviteCode || answerCode || busy || connectionState !== "disconnected");
  const busyLabel = busyMode === "invite"
    ? "Generating invite code..."
    : busyMode === "answer"
      ? "Generating response code..."
      : busyMode === "connect"
        ? "Connecting peer..."
        : "Working...";

  return (
    <div className="grid gap-4">
      <article className="rounded-3xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-50">
        Peer Sync is live-only. Both users must keep the page open. No backend is storing this session. Export a .uhoh backup if you care about what just happened.
      </article>

      <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill label={`Mode: ${isHost ? "Host" : "Join"}`} />
          <Pill
            label={connected ? "Connected" : waitingForAnswer ? "Waiting" : "Not connected"}
            tone={connected ? "good" : waitingForAnswer ? "warn" : "neutral"}
          />
        </div>
        {statusMessage ? <p className="mt-3 text-xs text-zinc-300">{statusMessage}</p> : null}
        {busy ? (
          <div className="mt-3">
            <PeerPingPongLoader state={busyMode === "connect" ? "connecting" : "ping"} label={busyLabel} />
          </div>
        ) : null}
        {connectionState === "connected" && !busy ? (
          <div className="mt-3">
            <PeerPingPongLoader state="connected" label="Peer verified. The ball made it back." />
          </div>
        ) : null}
        {connectionState === "failed" ? (
          <div className="mt-3">
            <PeerPingPongLoader state="failed" label="Connection failed. The ball has left the premises." />
          </div>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">Use the buttons in order. Copy the whole code. Yes, the code is ugly. No, you did not break it by looking at it.</p>
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
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200">1. Start host session</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStartHost}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-wait disabled:opacity-60"
            >
              <PlugZap className="h-4 w-4" aria-hidden="true" />
              {busyMode === "invite" ? "Generating Invite..." : "Start Peer Sync Session"}
            </button>
            {showReset ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-2 text-sm font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
              >
                {connected ? "Disconnect" : "Reset Pairing"}
              </button>
            ) : null}
          </div>

          <InputLabel title="2. Invite Code - send this to your friend">
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

          <InputLabel title="3. Response Code - paste it here">
            <textarea
              value={answerCode}
              onChange={(event) => onAnswerCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Paste guest response code here"
            />
          </InputLabel>
          <button
            type="button"
            onClick={onApplyAnswer}
            disabled={!answerCode || busy || answerAccepted || connected}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-sm font-black text-emerald-50 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-4 focus:ring-emerald-300/25 disabled:opacity-50"
          >
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {busyMode === "connect" ? "Connecting..." : answerAccepted ? "Response Accepted" : "Connect"}
          </button>
        </article>
      ) : (
        <article className="rounded-3xl border border-white/12 bg-black/25 p-4">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200">Join Sync Session</p>
          <p className="mb-3 text-xs text-zinc-400">Paste the host invite, click Generate Response Code, then send the response code back. The host still has to click Connect on their side because WebRTC is needy like that.</p>
          <InputLabel title="1. Host invite code">
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
            disabled={!inviteCode || busy}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-50"
          >
            <PlugZap className="h-4 w-4" aria-hidden="true" />
            {busyMode === "answer" ? "Generating Response..." : "Generate Response Code"}
          </button>

          <InputLabel title="2. Response Code - send back to host">
            <textarea
              value={answerCode}
              onChange={(event) => onAnswerCodeChange?.(event.target.value)}
              className="min-h-32 w-full rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              placeholder="Generated guest response code"
            />
          </InputLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyAnswerCode}
              disabled={!answerCode}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy Response Code
            </button>
            {showReset ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs font-black text-red-50 transition hover:bg-red-500/25 focus:outline-none focus:ring-4 focus:ring-red-300/25"
              >
                Reset Pairing
              </button>
            ) : null}
          </div>
        </article>
      )}
    </div>
  );
}
