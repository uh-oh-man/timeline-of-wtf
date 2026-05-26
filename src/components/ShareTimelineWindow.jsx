import { Cloud, Share2, Users, Vault } from "lucide-react";
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

function DebugItem({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold text-zinc-100">{String(value ?? "unknown")}</p>
    </div>
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
  onKickGuest,
  persistentSessions = [],
  onForgetPersistentSession,
  onViewCachedSession,
  onTryReconnectSession,
  onSaveSessionAsLocalCopy,
  peerMode = "host",
  onPeerModeChange,
  debugState = null,
  adminMode = false,
}) {
  const [editingGuestId, setEditingGuestId] = useState("");
  const editingGuest = useMemo(
    () => guests.find((guest) => guest.guestId === editingGuestId) || null,
    [editingGuestId, guests],
  );
  const connected = shareStatus?.connectionState === "connected";

  return (
    <FloatingWindow
      title="Share Timeline"
      subtitle="Invite code, response code, Connect. No backend ritual circle required."
      onClose={onClose}
      widthClass="max-w-6xl"
      zIndexClass="z-[66]"
      bodyClassName="bg-zinc-950 p-4 md:p-5"
    >
      <div className="grid gap-4">
        <section className="overflow-hidden rounded-3xl border border-sky-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.22),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(24,24,27,0.86))] p-4 shadow-2xl shadow-black/35">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-100">Peer Session</p>
              <h2 className="mt-1 text-2xl font-black text-white">
                {shareStatus?.boundTimelineName || "Pick a timeline, then make the browsers shake hands."}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                Share is live browser-to-browser. The session binds to the selected timeline, so switching your own view later will not drag guests into private nonsense.
              </p>
            </div>
            <span
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em]",
                connected
                  ? "border-emerald-300/35 bg-emerald-500/15 text-emerald-50"
                  : "border-white/15 bg-zinc-900/80 text-zinc-300",
              )}
            >
              {connected ? "Connected" : shareStatus?.connectionState || "Idle"}
            </span>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
          <div className="grid gap-4">
            <Section
              icon={Share2}
              title="Selected Timeline"
              subtitle="This is the one guests get. Not whatever you click after sharing starts."
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

            <Section icon={Cloud} title="Start / Connect" subtitle="Host invite -> guest response -> host clicks Connect. That is the whole spell.">
              <div className="mb-3 flex flex-wrap gap-2">
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
                    {mode === "host" ? "Host" : "Join"}
                  </button>
                ))}
              </div>
              <PeerInviteFlow {...inviteFlowProps} />
              {debugState ? (
                <details
                  open={Boolean(adminMode)}
                  className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/75 p-3 text-zinc-200"
                >
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-zinc-300">
                    Connection Debug
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <DebugItem label="role" value={debugState.role} />
                    <DebugItem label="connectionState" value={debugState.connectionState} />
                    <DebugItem label="iceConnectionState" value={debugState.iceConnectionState} />
                    <DebugItem label="signalingState" value={debugState.signalingState} />
                    <DebugItem label="iceGatheringState" value={debugState.iceGatheringState} />
                    <DebugItem label="dataChannel readyState" value={debugState.dataChannelState} />
                    <DebugItem label="hasLocalDescription" value={debugState.hasLocalDescription ? "yes" : "no"} />
                    <DebugItem label="hasRemoteDescription" value={debugState.hasRemoteDescription ? "yes" : "no"} />
                    <DebugItem label="answerApplied" value={debugState.answerApplied ? "yes" : "no"} />
                    <DebugItem label="peerVerified" value={debugState.peerVerified ? "yes" : "no"} />
                    <DebugItem label="candidates gathered" value={debugState.candidatesGathered} />
                    <DebugItem label="generation time ms" value={debugState.generationTimeMs} />
                    <DebugItem label="connection attempt ms" value={debugState.connectionAttemptTimeMs} />
                    <DebugItem label="last error" value={debugState.lastError || "none"} />
                    <DebugItem label="candidate warning" value={debugState.iceWarning || "none"} />
                  </div>
                </details>
              ) : null}
            </Section>
          </div>

          <div className="grid gap-4">
            <Section icon={Users} title="Guests" subtitle="Kick buttons and permissions live here. No junk drawer.">
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
                        <div className="flex flex-wrap gap-2">
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
                          <button
                            type="button"
                            onClick={() => onKickGuest?.(guest.guestId)}
                            className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20 focus:outline-none focus:ring-4 focus:ring-red-300/25"
                          >
                            Kick
                          </button>
                        </div>
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

            <Section icon={Vault} title="Cached Shares" subtitle="Last-seen snapshots, if permission allowed them.">
              {persistentSessions.length ? (
                <div className="grid gap-2">
                  {persistentSessions.map((session) => (
                    <article key={session.sessionId} className="rounded-2xl border border-white/12 bg-zinc-900/70 p-3">
                      <p className="text-sm font-black text-white">{session.timelineName}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Host: {session.hostName} | Last seen: {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : "unknown"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => onViewCachedSession?.(session.sessionId)} className="rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-black text-zinc-100 transition hover:bg-zinc-800">View Cached</button>
                        <button type="button" onClick={() => onTryReconnectSession?.(session.sessionId)} className="rounded-xl border border-sky-300/25 bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/25">Try Reconnect</button>
                        <button type="button" onClick={() => onSaveSessionAsLocalCopy?.(session.sessionId)} className="rounded-xl border border-emerald-300/25 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-500/25">Save as Local Timeline</button>
                        <button type="button" onClick={() => onForgetPersistentSession?.(session.sessionId)} className="rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20">Forget</button>
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
        </div>
      </div>
    </FloatingWindow>
  );
}
