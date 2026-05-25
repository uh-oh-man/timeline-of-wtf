import { Cloud, MessageCircle, Share2, Users, Vault } from "lucide-react";
import { useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import PeerInviteFlow from "./PeerInviteFlow";
import PeerGuestPermissions from "./PeerGuestPermissions";
import { clonePeerPermissions, defaultPeerPermissions, summarizePeerPermissions } from "../data/peerPermissions";
import { cx } from "../utils/helpers";

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
      <div className="mb-3 flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-sky-100" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-zinc-400">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ShareTimelineWindow({
  onClose,
  localTimelines = [],
  sharedTimelineId = "",
  onSharedTimelineChange,
  shareStatus = {},
  inviteFlowProps = {},
  guests = [],
  onUpdateGuestPermissions,
  persistentSessions = [],
  onForgetPersistentSession,
  onViewCachedSession,
  onTryReconnectSession,
  onSaveSessionAsLocalCopy,
  chatMessages = [],
  chatDraft = "",
  onChatDraftChange,
  onSendChatMessage,
  peerMode = "host",
  onPeerModeChange,
}) {
  const [editingGuestId, setEditingGuestId] = useState("");
  const editingGuest = useMemo(
    () => guests.find((guest) => guest.guestId === editingGuestId) || null,
    [editingGuestId, guests],
  );

  return (
    <FloatingWindow
      title="Share Timeline"
      subtitle="Manual peer sync and shared chaos. Live-only unless cached mode is enabled."
      onClose={onClose}
      widthClass="max-w-6xl"
      zIndexClass="z-[66]"
      bodyClassName="bg-zinc-950 p-4 md:p-5"
    >
      <div className="grid gap-4">
        <Section
          icon={Share2}
          title="Selected Timeline"
          subtitle="Sharing binds to one timeline identity, not your current view after session start."
        >
          <label className="grid gap-2 text-sm text-zinc-200">
            <span className="font-black text-white">Timeline to share</span>
            <select
              value={sharedTimelineId}
              onChange={(event) => onSharedTimelineChange?.(event.target.value)}
              className="min-h-11 rounded-2xl border border-white/15 bg-zinc-900/90 px-3 py-2 text-sm text-white focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              {localTimelines.map((timeline) => (
                <option key={timeline.id} value={timeline.id}>
                  {timeline.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-zinc-400">
            {shareStatus?.boundTimelineName
              ? `Sharing: ${shareStatus.boundTimelineName}. Currently viewing can differ safely.`
              : "No active bound timeline yet."}
          </p>
        </Section>

        <Section icon={Cloud} title="Peer Invite Flow" subtitle="Host offer code → guest answer code → connected">
          <div className="mb-3 flex gap-2">
            {["host", "join"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPeerModeChange?.(mode)}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                  peerMode === mode
                    ? "border-sky-200/35 bg-sky-500/20 text-sky-50"
                    : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
                )}
              >
                {mode === "host" ? "Host Session" : "Join Session"}
              </button>
            ))}
          </div>
          <PeerInviteFlow {...inviteFlowProps} />
        </Section>

        <Section icon={Users} title="Connected Guests" subtitle="Per-guest permissions are host-authoritative.">
          {guests.length ? (
            <div className="grid gap-3">
              {guests.map((guest) => (
                <article key={guest.guestId} className="rounded-2xl border border-white/12 bg-zinc-900/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-white">{guest.displayName || "Guest"}</p>
                      <p className="text-xs text-zinc-400">
                        {guest.connectionState || "unknown"} | {summarizePeerPermissions(guest.permissions || defaultPeerPermissions)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingGuestId((current) => (current === guest.guestId ? "" : guest.guestId))}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-xs font-black transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                        editingGuestId === guest.guestId
                          ? "border-sky-200/35 bg-sky-500/20 text-sky-50"
                          : "border-white/15 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
                      )}
                    >
                      {editingGuestId === guest.guestId ? "Hide Access" : "Edit Access"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-zinc-900/65 px-3 py-3 text-sm text-zinc-300">
              No guests connected yet.
            </p>
          )}

          {editingGuest ? (
            <div className="mt-4">
              <PeerGuestPermissions
                guest={editingGuest}
                onChange={(nextPermissions) => onUpdateGuestPermissions?.(editingGuest.guestId, clonePeerPermissions(nextPermissions))}
              />
            </div>
          ) : null}
        </Section>

        <Section icon={MessageCircle} title="Live-Only Chat" subtitle="Messages are not stored. Closing this window may drop visible chat history.">
          <div className="grid gap-2">
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/12 bg-zinc-900/65 p-3">
              {chatMessages.length ? (
                <div className="grid gap-2">
                  {chatMessages.map((message) => (
                    <article key={message.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                      <p className="text-xs text-zinc-400">{message.fromName || "Unknown"} • {new Date(message.sentAt).toLocaleTimeString()}</p>
                      <p className="mt-1 text-sm text-zinc-100">{message.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No live messages yet.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={chatDraft}
                onChange={(event) => onChatDraftChange?.(event.target.value)}
                className="min-h-11 flex-1 rounded-2xl border border-white/15 bg-zinc-900/85 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
                placeholder="Live-only chat message..."
              />
              <button
                type="button"
                onClick={onSendChatMessage}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-sm font-black text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
              >
                Send
              </button>
            </div>
          </div>
        </Section>

        <Section icon={Vault} title="Persistent Shared Timelines" subtitle="Cached viewing while host is offline (if allowed by permissions).">
          {persistentSessions.length ? (
            <div className="grid gap-2">
              {persistentSessions.map((session) => (
                <article key={session.sessionId} className="rounded-2xl border border-white/12 bg-zinc-900/70 p-3">
                  <p className="text-sm font-black text-white">{session.timelineName}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Host: {session.hostName} | Last seen: {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : "unknown"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onViewCachedSession?.(session.sessionId)}
                      className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800"
                    >
                      View Cached
                    </button>
                    <button
                      type="button"
                      onClick={() => onTryReconnectSession?.(session.sessionId)}
                      className="rounded-xl border border-sky-300/25 bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/25"
                    >
                      Try Reconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveSessionAsLocalCopy?.(session.sessionId)}
                      className="rounded-xl border border-emerald-300/25 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/25"
                    >
                      Save as Local Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => onForgetPersistentSession?.(session.sessionId)}
                      className="rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20"
                    >
                      Forget
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-zinc-900/65 px-3 py-3 text-sm text-zinc-300">
              No persistent shared timelines yet.
            </p>
          )}
        </Section>
      </div>
    </FloatingWindow>
  );
}
