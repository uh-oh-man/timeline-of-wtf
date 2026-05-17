import { createId, uniqueByName } from "../../utils/helpers";
import { normalizeEventAccentColor } from "../../utils/colorUtils";

export const LOCAL_TIMELINE_INDEX_KEY = "twtaf:timelineIndex";
export const ACTIVE_LOCAL_TIMELINE_ID_KEY = "twtaf:activeTimelineId";
export const SINGLE_TIMELINE_MIGRATED_KEY = "twtaf:migratedSingleTimeline";

const OLD_KEYS = {
  events: "twtaf:events",
  tags: "twtaf:tags",
  plannedGames: "twtaf:plannedGames",
};

const LEGACY_KEYS = {
  events: "twotf.disasters",
  tags: "twotf.tags",
  plannedGames: "twotf.plannedGames",
};

export function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function nowIso() {
  return new Date().toISOString();
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

function loadRaw(primaryKey, legacyKey = null) {
  if (!canUseStorage()) return null;
  const primary = window.localStorage.getItem(primaryKey);
  if (primary !== null) return primary;
  return legacyKey ? window.localStorage.getItem(legacyKey) : null;
}

function loadList(key, fallback = [], legacyKey = null) {
  const parsed = safeParse(loadRaw(key, legacyKey), fallback);
  return Array.isArray(parsed) ? parsed : fallback;
}

function saveList(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

function removeKey(key) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
}

export function timelineStorageKey(timelineId, bucket) {
  return `twtaf:timeline:${timelineId}:${bucket}`;
}

function normalizeTimelineMetadata(timeline, index = 0) {
  const createdAt = timeline?.createdAt || nowIso();
  return {
    id: String(timeline?.id || (index === 0 ? "local-main" : `local-${createId()}`)),
    name: String(timeline?.name || (index === 0 ? "Local Timeline" : "Local Timeline Copy")),
    type: "local",
    createdAt,
    updatedAt: timeline?.updatedAt || createdAt,
    lastOpenedAt: timeline?.lastOpenedAt || createdAt,
    ...(timeline?.description ? { description: String(timeline.description) } : {}),
    ...(timeline?.color ? { color: String(timeline.color) } : {}),
  };
}

export function normalizeTimelineEvent(event, index = 0) {
  const normalized = normalizeEventAccentColor(event || {});

  return {
    ...normalized,
    id: normalized.id || createId(),
    year: String(normalized.year || ""),
    title: String(normalized.title || ""),
    source: String(normalized.source || normalized.game || ""),
    tag: String(normalized.tag || ""),
    summary: String(normalized.summary || ""),
    connections: Array.isArray(normalized.connections) ? normalized.connections : [],
    directConnections: Array.isArray(normalized.directConnections) ? normalized.directConnections : [],
    media: Array.isArray(normalized.media) ? normalized.media : [],
    sortOrder: Number.isFinite(Number(normalized.sortOrder)) ? Number(normalized.sortOrder) : index,
    createdAt: normalized.createdAt || nowIso(),
    updatedAt: normalized.updatedAt || normalized.createdAt || nowIso(),
  };
}

function readTimelineIndexRaw() {
  if (!canUseStorage()) return [];
  const parsed = safeParse(window.localStorage.getItem(LOCAL_TIMELINE_INDEX_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeTimelineIndex(index) {
  saveList(LOCAL_TIMELINE_INDEX_KEY, index.map(normalizeTimelineMetadata));
}

function readActiveId() {
  if (!canUseStorage()) return "local-main";
  return window.localStorage.getItem(ACTIVE_LOCAL_TIMELINE_ID_KEY) || "local-main";
}

function writeActiveId(timelineId) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_LOCAL_TIMELINE_ID_KEY, timelineId);
}

export function ensureLocalTimelineStorage() {
  if (!canUseStorage()) {
    return {
      timelines: [normalizeTimelineMetadata({ id: "local-main", name: "Local Timeline" })],
      activeTimelineId: "local-main",
    };
  }

  const existingIndex = readTimelineIndexRaw();
  if (existingIndex.length > 0) {
    const timelines = existingIndex.map(normalizeTimelineMetadata);
    const activeId = timelines.some((timeline) => timeline.id === readActiveId()) ? readActiveId() : timelines[0].id;
    writeTimelineIndex(timelines);
    writeActiveId(activeId);
    return { timelines, activeTimelineId: activeId };
  }

  const createdAt = nowIso();
  const defaultTimeline = normalizeTimelineMetadata({
    id: "local-main",
    name: "Local Timeline",
    createdAt,
    updatedAt: createdAt,
    lastOpenedAt: createdAt,
  });
  const oldEvents = loadList(OLD_KEYS.events, [], LEGACY_KEYS.events).map(normalizeTimelineEvent);
  const oldTags = loadList(OLD_KEYS.tags, [], LEGACY_KEYS.tags);
  const oldPlannedGames = loadList(OLD_KEYS.plannedGames, [], LEGACY_KEYS.plannedGames);

  writeTimelineIndex([defaultTimeline]);
  writeActiveId(defaultTimeline.id);
  saveEvents(defaultTimeline.id, oldEvents);
  saveTags(defaultTimeline.id, oldTags);
  savePlannedGames(defaultTimeline.id, oldPlannedGames);
  window.localStorage.setItem(SINGLE_TIMELINE_MIGRATED_KEY, "true");

  return {
    timelines: [defaultTimeline],
    activeTimelineId: defaultTimeline.id,
  };
}

export function getTimelines() {
  return ensureLocalTimelineStorage().timelines;
}

export function getActiveTimelineId() {
  return ensureLocalTimelineStorage().activeTimelineId;
}

export function getActiveTimeline() {
  const { timelines, activeTimelineId } = ensureLocalTimelineStorage();
  return timelines.find((timeline) => timeline.id === activeTimelineId) || timelines[0];
}

export function setActiveTimeline(timelineId) {
  const timelines = getTimelines();
  const target = timelines.find((timeline) => timeline.id === timelineId);
  if (!target) return getActiveTimeline();

  const openedAt = nowIso();
  const nextTimelines = timelines.map((timeline) =>
    timeline.id === timelineId ? { ...timeline, lastOpenedAt: openedAt, updatedAt: timeline.updatedAt || openedAt } : timeline,
  );
  writeTimelineIndex(nextTimelines);
  writeActiveId(timelineId);
  return nextTimelines.find((timeline) => timeline.id === timelineId);
}

export function listEvents(timelineId = getActiveTimelineId()) {
  return loadList(timelineStorageKey(timelineId, "events"), []).map(normalizeTimelineEvent);
}

export function saveEvents(timelineId, events) {
  saveList(timelineStorageKey(timelineId, "events"), (events || []).map(normalizeTimelineEvent));
  touchTimeline(timelineId);
}

export function listTags(timelineId = getActiveTimelineId(), defaultTags = []) {
  const storedTags = loadList(timelineStorageKey(timelineId, "tags"), []);
  return uniqueByName([...defaultTags, ...storedTags]);
}

export function saveTags(timelineId, tags) {
  saveList(timelineStorageKey(timelineId, "tags"), tags);
  touchTimeline(timelineId);
}

export function listPlannedGames(timelineId = getActiveTimelineId(), defaultPlannedGames = []) {
  const stored = loadList(timelineStorageKey(timelineId, "plannedGames"), null);
  return Array.isArray(stored) ? stored : defaultPlannedGames;
}

export function savePlannedGames(timelineId, plannedGames) {
  saveList(timelineStorageKey(timelineId, "plannedGames"), plannedGames);
  touchTimeline(timelineId);
}

export function touchTimeline(timelineId) {
  if (!timelineId || !canUseStorage()) return;
  const updatedAt = nowIso();
  const timelines = readTimelineIndexRaw().map(normalizeTimelineMetadata);
  if (!timelines.length) return;
  writeTimelineIndex(
    timelines.map((timeline) => (timeline.id === timelineId ? { ...timeline, updatedAt } : timeline)),
  );
}

export function createTimeline(name = "New Local Timeline", data = {}) {
  const timelines = getTimelines();
  const createdAt = nowIso();
  const timeline = normalizeTimelineMetadata({
    id: `local-${createId()}`,
    name: String(name || "New Local Timeline").trim() || "New Local Timeline",
    createdAt,
    updatedAt: createdAt,
    lastOpenedAt: createdAt,
  });

  writeTimelineIndex([...timelines, timeline]);
  writeActiveId(timeline.id);
  saveEvents(timeline.id, data.events || []);
  saveTags(timeline.id, data.tags || []);
  savePlannedGames(timeline.id, data.plannedGames || []);
  return timeline;
}

export function renameTimeline(timelineId, name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return getActiveTimeline();

  const timelines = getTimelines();
  const updatedAt = nowIso();
  const nextTimelines = timelines.map((timeline) =>
    timeline.id === timelineId ? { ...timeline, name: cleanName, updatedAt } : timeline,
  );
  writeTimelineIndex(nextTimelines);
  return nextTimelines.find((timeline) => timeline.id === timelineId) || getActiveTimeline();
}

function cloneEventsForTimeline(events) {
  const idMap = new Map();

  return (events || []).map((event, index) => {
    const nextId = createId();
    idMap.set(event.id, nextId);

    return normalizeTimelineEvent({
      ...event,
      id: nextId,
      sortOrder: Number.isFinite(Number(event.sortOrder)) ? Number(event.sortOrder) : index,
      media: Array.isArray(event.media)
        ? event.media.map((media, mediaIndex) => ({
            ...media,
            id: media.id ? `${media.id}-copy-${createId()}` : createId(),
            disasterId: nextId,
            order: Number.isFinite(Number(media.order)) ? Number(media.order) : mediaIndex,
          }))
        : [],
      createdAt: event.createdAt || nowIso(),
      updatedAt: nowIso(),
    });
  });
}

export function duplicateTimeline(timelineId) {
  const timelines = getTimelines();
  const sourceTimeline = timelines.find((timeline) => timeline.id === timelineId) || getActiveTimeline();
  if (!sourceTimeline) return null;

  return createTimeline(`${sourceTimeline.name} Clone`, {
    events: cloneEventsForTimeline(listEvents(sourceTimeline.id)),
    tags: listTags(sourceTimeline.id),
    plannedGames: listPlannedGames(sourceTimeline.id),
  });
}

export function deleteTimeline(timelineId) {
  const timelines = getTimelines();
  if (timelines.length <= 1) {
    return {
      deleted: false,
      reason: "last-timeline",
      activeTimeline: timelines[0],
      timelines,
    };
  }

  const nextTimelines = timelines.filter((timeline) => timeline.id !== timelineId);
  if (nextTimelines.length === timelines.length) {
    return {
      deleted: false,
      reason: "missing",
      activeTimeline: getActiveTimeline(),
      timelines,
    };
  }

  removeKey(timelineStorageKey(timelineId, "events"));
  removeKey(timelineStorageKey(timelineId, "tags"));
  removeKey(timelineStorageKey(timelineId, "plannedGames"));
  removeKey(timelineStorageKey(timelineId, "settings"));
  writeTimelineIndex(nextTimelines);

  const activeId = readActiveId();
  const nextActive = activeId === timelineId ? nextTimelines[0] : nextTimelines.find((timeline) => timeline.id === activeId) || nextTimelines[0];
  writeActiveId(nextActive.id);

  return {
    deleted: true,
    activeTimeline: nextActive,
    timelines: nextTimelines,
  };
}

export function getStatus() {
  return {
    mode: "local",
    label: "Stored in this browser",
    detail: "Fast, private, and capable of vanishing if you anger storage.",
  };
}
