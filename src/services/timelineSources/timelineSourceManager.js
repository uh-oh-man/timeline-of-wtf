import * as exampleTimelineSource from "./exampleTimelineSource";
import * as localTimelineSource from "./localTimelineSource";
import * as mockSyncedTimelineSource from "./mockSyncedTimelineSource";

export const SOURCE_TYPES = {
  LOCAL: "local",
  SYNCED_MOCK: "synced_mock",
  EXAMPLE: "example",
};

export const SELECTED_TIMELINE_SOURCE_KEY = "twtaf:selectedTimelineSource";

const SOURCE_LABELS = {
  [SOURCE_TYPES.LOCAL]: "Local Timeline",
  [SOURCE_TYPES.SYNCED_MOCK]: "Shared Timeline",
  [SOURCE_TYPES.EXAMPLE]: "Example Timeline",
};

export const timelineSources = {
  [SOURCE_TYPES.LOCAL]: localTimelineSource,
  [SOURCE_TYPES.SYNCED_MOCK]: mockSyncedTimelineSource,
  [SOURCE_TYPES.EXAMPLE]: exampleTimelineSource,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function normalizeTimelineSource(source) {
  return Object.values(SOURCE_TYPES).includes(source) ? source : SOURCE_TYPES.LOCAL;
}

export function loadSelectedTimelineSource() {
  if (!canUseStorage()) return SOURCE_TYPES.LOCAL;
  return normalizeTimelineSource(window.localStorage.getItem(SELECTED_TIMELINE_SOURCE_KEY));
}

export function saveSelectedTimelineSource(source) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SELECTED_TIMELINE_SOURCE_KEY, normalizeTimelineSource(source));
}

export function getTimelineSource(source) {
  return timelineSources[normalizeTimelineSource(source)] || localTimelineSource;
}

export function getSourceLabel(source) {
  return SOURCE_LABELS[normalizeTimelineSource(source)] || SOURCE_LABELS[SOURCE_TYPES.LOCAL];
}

export function getTimelineSourceStatus(source) {
  return getTimelineSource(source).getStatus?.() || {
    mode: normalizeTimelineSource(source),
    label: getSourceLabel(source),
    detail: "The archive knows this source exists and is choosing to be vague about it.",
  };
}

export function canEditTimelineSource(source, mockAuthSession = null) {
  const normalized = normalizeTimelineSource(source);
  if (normalized === SOURCE_TYPES.LOCAL || normalized === SOURCE_TYPES.EXAMPLE) return true;
  if (normalized === SOURCE_TYPES.SYNCED_MOCK) return Boolean(mockAuthSession?.canEditRealTimeline);
  return false;
}

export function getReadOnlyReason(source, mockAuthSession = null) {
  const normalized = normalizeTimelineSource(source);
  if (canEditTimelineSource(normalized, mockAuthSession)) return "";
  if (normalized === SOURCE_TYPES.SYNCED_MOCK && !mockAuthSession) {
    return "Shared Timeline is view-only until the archive recognizes your face. Or at least your fake login.";
  }
  if (normalized === SOURCE_TYPES.SYNCED_MOCK) {
    return "This fake account can look at the official nonsense, but cannot legally poke it yet.";
  }
  return "This timeline source is view-only because bureaucracy found a chair.";
}
