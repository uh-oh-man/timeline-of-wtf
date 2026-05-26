import { MessageCircle, Send } from "lucide-react";

export default function PeerLiveChatPanel({
  messages = [],
  draft = "",
  onDraftChange,
  onSend,
  connected = false,
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-black/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-sky-100">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Live Chat
        </h3>
        <span className="rounded-full border border-white/10 bg-zinc-900 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-zinc-300">
          {connected ? "Live only" : "Disconnected"}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-400">Peer chat is encrypted with the session and is not stored.</p>
      <div className="mt-3 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/65 p-3">
        {messages.length ? (
          <div className="grid gap-2">
            {messages.map((message) => (
              <article key={message.id} className="rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2">
                <p className="text-xs text-zinc-400">
                  {message.fromName || "Peer"} | {message.sentAt ? new Date(message.sentAt).toLocaleTimeString() : "now"}
                </p>
                <p className="mt-1 overflow-wrap-anywhere text-sm text-zinc-100">{message.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No live messages yet. The citrus channel is quiet.</p>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(event) => onDraftChange?.(event.target.value)}
          disabled={!connected}
          className="min-h-11 flex-1 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-55"
          placeholder={connected ? "Send live nonsense..." : "Connect to a peer first"}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!connected || !draft.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </button>
      </div>
    </section>
  );
}
