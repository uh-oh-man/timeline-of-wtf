function slugifyForFileName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureUhohExtension(fileName) {
  const trimmed = String(fileName || "").trim();
  if (!trimmed) return ".uhoh";
  return trimmed.toLowerCase().endsWith(".uhoh") ? trimmed : `${trimmed}.uhoh`;
}

export function sanitizeWindowsFileName(fileName) {
  return String(fileName || "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toSafeUhohFileName(fileName, fallbackFileName) {
  const fallback = sanitizeWindowsFileName(ensureUhohExtension(fallbackFileName)) || "timeline-export.uhoh";
  const withExtension = ensureUhohExtension(fileName);
  const sanitized = sanitizeWindowsFileName(withExtension);
  if (!sanitized || sanitized === ".uhoh") return fallback;
  return sanitized.toLowerCase().endsWith(".uhoh") ? sanitized : `${sanitized}.uhoh`;
}

export function buildTimestampedFallbackFileName(date = new Date(), prefix = "timeline-export") {
  const pad = (value) => String(value).padStart(2, "0");
  const safePrefix = sanitizeWindowsFileName(slugifyForFileName(prefix)) || "timeline-export";
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `${safePrefix}-${stamp}-${time}.uhoh`;
}

export function buildAutoFileNameFromTimelineName(timelineName, date = new Date()) {
  const base = slugifyForFileName(timelineName) || "timeline-export";
  return buildTimestampedFallbackFileName(date, base);
}
