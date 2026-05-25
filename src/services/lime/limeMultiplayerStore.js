import { createDefaultLimeState, normalizeLimeState } from "./limeStorage";

const LIME_MULTIPLAYER_SESSIONS_KEY = "twtaf:limeMultiplayerSessions";
const ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY = "twtaf:activeLimeMultiplayerSessionId";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function sessionId() {
  return `lime_mp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSession(session) {
  const source = session && typeof session === "object" ? session : {};
  const createdAt = source.createdAt || nowIso();
  return {
    id: String(source.id || sessionId()),
    name: String(source.name || "Lime Session"),
    mode: "peer",
    hostUserId: String(source.hostUserId || "local-user"),
    hostName: String(source.hostName || "Host"),
    createdAt,
    updatedAt: String(source.updatedAt || createdAt),
    lastOpenedAt: String(source.lastOpenedAt || createdAt),
    state: normalizeLimeState(source.state || createDefaultLimeState()),
    peers: Array.isArray(source.peers) ? source.peers : [],
    revision: Number.isFinite(Number(source.revision)) ? Number(source.revision) : 0,
    lastSyncedAt: String(source.lastSyncedAt || source.updatedAt || createdAt),
  };
}

export function loadLimeMultiplayerSessions() {
  if (!canUseStorage()) return [];
  const parsed = safeParse(window.localStorage.getItem(LIME_MULTIPLAYER_SESSIONS_KEY), []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeSession);
}

export function saveLimeMultiplayerSessions(sessions = []) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    LIME_MULTIPLAYER_SESSIONS_KEY,
    JSON.stringify(Array.isArray(sessions) ? sessions.map(normalizeSession) : []),
  );
}

export function createLimeMultiplayerSession({
  name = "Lime Session",
  hostUserId = "local-user",
  hostName = "Host",
  state = createDefaultLimeState(),
} = {}) {
  const next = normalizeSession({
    id: sessionId(),
    name,
    hostUserId,
    hostName,
    state,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastOpenedAt: nowIso(),
    revision: 0,
  });
  const sessions = loadLimeMultiplayerSessions();
  saveLimeMultiplayerSessions([next, ...sessions.filter((session) => session.id !== next.id)]);
  setActiveLimeMultiplayerSessionId(next.id);
  return next;
}

export function upsertLimeMultiplayerSession(session) {
  const normalized = normalizeSession(session);
  const sessions = loadLimeMultiplayerSessions();
  saveLimeMultiplayerSessions([normalized, ...sessions.filter((item) => item.id !== normalized.id)]);
  return normalized;
}

export function getActiveLimeMultiplayerSessionId() {
  if (!canUseStorage()) return "";
  return String(window.localStorage.getItem(ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY) || "");
}

export function setActiveLimeMultiplayerSessionId(sessionIdValue) {
  if (!canUseStorage()) return;
  if (!sessionIdValue) {
    window.localStorage.removeItem(ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY);
    return;
  }
  window.localStorage.setItem(ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY, String(sessionIdValue));
}

export function clearLimeMultiplayerSessions() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LIME_MULTIPLAYER_SESSIONS_KEY);
  window.localStorage.removeItem(ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY);
}

export { LIME_MULTIPLAYER_SESSIONS_KEY, ACTIVE_LIME_MULTIPLAYER_SESSION_ID_KEY };
