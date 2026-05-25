const TIMELINE_CODE_RE = /^TWT-AF-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EVENT_CODE_RE = /^EVT-[A-Z0-9]{6}-[A-Z0-9]{6}$/;
const PACKAGE_ID_RE = /^pkg_[a-z0-9]{10,}$/;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInt(maxExclusive) {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function randomChunk(size) {
  let out = "";
  for (let index = 0; index < size; index += 1) {
    out += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return out;
}

export function normalizeTimelineCode(input) {
  const value = String(input || "").trim().toUpperCase();
  return TIMELINE_CODE_RE.test(value) ? value : "";
}

export function isValidTimelineCode(input) {
  return Boolean(normalizeTimelineCode(input));
}

export function generateTimelineCode() {
  return `TWT-AF-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
}

export function generateEventCode() {
  return `EVT-${randomChunk(6)}-${randomChunk(6)}`;
}

export function generatePackageId() {
  const now = Date.now().toString(36);
  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return `pkg_${now}${rand}`.replace(/[^a-z0-9_]/gi, "").toLowerCase();
}

export function isValidEventCode(input) {
  return EVENT_CODE_RE.test(String(input || "").trim().toUpperCase());
}

export function isValidPackageId(input) {
  return PACKAGE_ID_RE.test(String(input || "").trim().toLowerCase());
}
