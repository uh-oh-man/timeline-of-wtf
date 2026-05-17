export const MOCK_AUTH_SESSION_KEY = "twtaf:mockAuthSession";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(raw, fallback = null) {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) || fallback;
  } catch {
    return fallback;
  }
}

export function loadMockAuthSession() {
  if (!canUseStorage()) return null;
  const session = safeParse(window.localStorage.getItem(MOCK_AUTH_SESSION_KEY), null);
  if (!session || typeof session !== "object") return null;

  return {
    username: String(session.username || "Unknown Bureaucrat"),
    role: String(session.role || "viewer"),
    canEditRealTimeline: Boolean(session.canEditRealTimeline),
    createdAt: session.createdAt || new Date().toISOString(),
  };
}

export function saveMockAuthSession(session) {
  if (!canUseStorage()) return;
  if (!session) {
    window.localStorage.removeItem(MOCK_AUTH_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(
    MOCK_AUTH_SESSION_KEY,
    JSON.stringify({
      username: String(session.username || "Unknown Bureaucrat"),
      role: String(session.role || "viewer"),
      canEditRealTimeline: Boolean(session.canEditRealTimeline),
      createdAt: session.createdAt || new Date().toISOString(),
    }),
  );
}

export function createMockSession(username) {
  const cleanUsername = String(username || "").trim();
  const editorPattern = /\b(admin|editor|uh oh|timeline)\b/i;
  const canEditRealTimeline = editorPattern.test(cleanUsername);

  return {
    username: cleanUsername || "Suspicious Viewer",
    role: canEditRealTimeline ? "mock-editor" : "mock-viewer",
    canEditRealTimeline,
    createdAt: new Date().toISOString(),
  };
}
