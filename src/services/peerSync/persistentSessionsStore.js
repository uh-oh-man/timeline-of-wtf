const PEER_PERSISTENT_SESSIONS_KEY = "twtaf:peerPersistentSessions";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSession(session) {
  const source = session && typeof session === "object" ? session : {};
  return {
    sessionId: String(source.sessionId || ""),
    hostName: String(source.hostName || "Host"),
    timelineName: String(source.timelineName || "Shared Timeline"),
    timelineCode: String(source.timelineCode || ""),
    guestDisplayName: String(source.guestDisplayName || "Guest"),
    lastSeenAt: String(source.lastSeenAt || ""),
    lastSyncedAt: String(source.lastSyncedAt || source.lastSeenAt || ""),
    permissions: source.permissions && typeof source.permissions === "object" ? source.permissions : {},
    cachedTimelineSnapshot: source.cachedTimelineSnapshot || null,
    encrypted: Boolean(source.encrypted),
    status: String(source.status || "cached"),
  };
}

export function loadPersistentPeerSessions() {
  if (!canUseStorage()) return [];
  const parsed = safeParse(window.localStorage.getItem(PEER_PERSISTENT_SESSIONS_KEY), []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeSession).filter((session) => session.sessionId);
}

export function savePersistentPeerSessions(sessions = []) {
  if (!canUseStorage()) return;
  const normalized = Array.isArray(sessions) ? sessions.map(normalizeSession).filter((session) => session.sessionId) : [];
  window.localStorage.setItem(PEER_PERSISTENT_SESSIONS_KEY, JSON.stringify(normalized));
}

export function upsertPersistentPeerSession(session) {
  const normalized = normalizeSession(session);
  if (!normalized.sessionId) return null;
  const existing = loadPersistentPeerSessions();
  const next = [
    normalized,
    ...existing.filter((item) => item.sessionId !== normalized.sessionId),
  ];
  savePersistentPeerSessions(next);
  return normalized;
}

export function removePersistentPeerSession(sessionId) {
  const existing = loadPersistentPeerSessions();
  const next = existing.filter((session) => session.sessionId !== sessionId);
  savePersistentPeerSessions(next);
}

export function clearPersistentPeerSessions() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PEER_PERSISTENT_SESSIONS_KEY);
}

export { PEER_PERSISTENT_SESSIONS_KEY };
