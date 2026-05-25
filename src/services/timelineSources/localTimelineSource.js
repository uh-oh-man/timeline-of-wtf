import { createId, uniqueByName } from "../../utils/helpers";
import { normalizeEventAccentColor } from "../../utils/colorUtils";
import {
  generateEventCode,
  generateTimelineCode,
  normalizeTimelineCode,
} from "../../utils/identityCodes";

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

const DEFAULT_LOCAL_USER_ID = "local-user";
const DEFAULT_LOCAL_USER_NAME = "You";

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
  const updatedAt = timeline?.updatedAt || createdAt;
  const timelineCode = normalizeTimelineCode(timeline?.timelineCode) || generateTimelineCode();
  const createdByUserId = String(timeline?.createdByUserId || DEFAULT_LOCAL_USER_ID);
  const createdByName = String(timeline?.createdByName || DEFAULT_LOCAL_USER_NAME);
  const updatedByUserId = String(timeline?.updatedByUserId || createdByUserId);
  const updatedByName = String(timeline?.updatedByName || createdByName);
  const revision = Number.isFinite(Number(timeline?.revision)) ? Number(timeline.revision) : 0;

  return {
    id: String(timeline?.id || (index === 0 ? "local-main" : `local-${createId()}`)),
    timelineCode,
    name: String(timeline?.name || (index === 0 ? "Local Timeline" : "Local Timeline Copy")),
    type: "local",
    createdAt,
    updatedAt,
    lastOpenedAt: timeline?.lastOpenedAt || createdAt,
    createdByUserId,
    createdByName,
    updatedByUserId,
    updatedByName,
    revision,
    lineage: timeline?.lineage && typeof timeline.lineage === "object" ? timeline.lineage : {},
    importedByName: timeline?.importedByName ? String(timeline.importedByName) : "",
    importedAt: timeline?.importedAt ? String(timeline.importedAt) : "",
    copiedFromTimelineCode: timeline?.copiedFromTimelineCode ? String(timeline.copiedFromTimelineCode) : "",
    copiedFromTimelineName: timeline?.copiedFromTimelineName ? String(timeline.copiedFromTimelineName) : "",
    ...(timeline?.description ? { description: String(timeline.description) } : {}),
    ...(timeline?.color ? { color: String(timeline.color) } : {}),
  };
}

function normalizeTimelineMedia(media, timelineId, disasterId, index = 0) {
  const source = media && typeof media === "object" ? { ...media } : {};
  const id = source.id || createId();
  const fileSize = Number.isFinite(Number(source.fileSize)) ? Number(source.fileSize) : 0;
  const order = Number.isFinite(Number(source.order)) ? Number(source.order) : index;
  const width = Number.isFinite(Number(source.width)) ? Number(source.width) : null;
  const height = Number.isFinite(Number(source.height)) ? Number(source.height) : null;
  const now = nowIso();
  const storage = source.storage || (source.indexedDbKey ? "indexeddb" : source.src ? "external" : "missing-import-media");

  delete source.objectUrl;
  delete source.file;
  delete source.blob;
  delete source.packageBlob;

  return {
    ...source,
    id,
    timelineId: source.timelineId || timelineId || "",
    disasterId: disasterId || source.disasterId || "",
    fileName: String(source.fileName || "Unnamed evidence"),
    fileType: String(source.fileType || "application/octet-stream"),
    fileSize,
    width,
    height,
    caption: String(source.caption || ""),
    order,
    storage: storage === "session" ? "missing-import-media" : storage,
    ...(storage === "indexeddb" || source.indexedDbKey ? { indexedDbKey: source.indexedDbKey || id } : {}),
    createdAt: source.createdAt || now,
    updatedAt: source.updatedAt || source.createdAt || now,
    ...(source.storage === "session" ? { missing: true } : {}),
  };
}

export function normalizeTimelineEvent(event, index = 0, timelineId = "") {
  const normalized = normalizeEventAccentColor(event || {});
  const eventId = normalized.id || createId();
  const eventCode = String(normalized.eventCode || "").trim().toUpperCase() || generateEventCode();
  const createdAt = normalized.createdAt || nowIso();
  const updatedAt = normalized.updatedAt || createdAt || nowIso();
  const revision = Number.isFinite(Number(normalized.revision)) ? Number(normalized.revision) : 0;

  return {
    ...normalized,
    id: eventId,
    eventCode,
    year: String(normalized.year || ""),
    title: String(normalized.title || ""),
    source: String(normalized.source || normalized.game || ""),
    tag: String(normalized.tag || ""),
    summary: String(normalized.summary || ""),
    connections: Array.isArray(normalized.connections) ? normalized.connections : [],
    directConnections: Array.isArray(normalized.directConnections) ? normalized.directConnections : [],
    media: Array.isArray(normalized.media)
      ? normalized.media.map((media, mediaIndex) => normalizeTimelineMedia(media, timelineId, eventId, mediaIndex))
      : [],
    sortOrder: Number.isFinite(Number(normalized.sortOrder)) ? Number(normalized.sortOrder) : index,
    createdAt,
    updatedAt,
    revision,
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
  return loadList(timelineStorageKey(timelineId, "events"), []).map((event, index) =>
    normalizeTimelineEvent(event, index, timelineId),
  );
}

export function saveEvents(timelineId, events) {
  saveList(
    timelineStorageKey(timelineId, "events"),
    (events || []).map((event, index) => normalizeTimelineEvent(event, index, timelineId)),
  );
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
    timelines.map((timeline) => (timeline.id === timelineId
      ? {
          ...timeline,
          updatedAt,
          updatedByUserId: timeline.updatedByUserId || DEFAULT_LOCAL_USER_ID,
          updatedByName: timeline.updatedByName || DEFAULT_LOCAL_USER_NAME,
          revision: Number.isFinite(Number(timeline.revision)) ? Number(timeline.revision) + 1 : 1,
        }
      : timeline)),
  );
}

export function createTimeline(name = "New Local Timeline", data = {}) {
  const timelines = getTimelines();
  const createdAt = nowIso();
  let preferredId = String(data?.id || data?.timelineId || `local-${createId()}`);
  const existingIds = new Set(timelines.map((timeline) => timeline.id));
  while (existingIds.has(preferredId)) {
    preferredId = `local-${createId()}`;
  }
  const timeline = normalizeTimelineMetadata({
    id: preferredId,
    name: String(name || "New Local Timeline").trim() || "New Local Timeline",
    timelineCode: data?.timelineCode || generateTimelineCode(),
    createdAt,
    updatedAt: createdAt,
    lastOpenedAt: createdAt,
    createdByUserId: data?.createdByUserId || DEFAULT_LOCAL_USER_ID,
    createdByName: data?.createdByName || DEFAULT_LOCAL_USER_NAME,
    updatedByUserId: data?.updatedByUserId || data?.createdByUserId || DEFAULT_LOCAL_USER_ID,
    updatedByName: data?.updatedByName || data?.createdByName || DEFAULT_LOCAL_USER_NAME,
    importedByName: data?.importedByName || "",
    importedAt: data?.importedAt || "",
    copiedFromTimelineCode: data?.copiedFromTimelineCode || "",
    copiedFromTimelineName: data?.copiedFromTimelineName || "",
    lineage: data?.lineage && typeof data.lineage === "object" ? data.lineage : {},
    revision: Number.isFinite(Number(data?.revision)) ? Number(data.revision) : 0,
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
    timeline.id === timelineId
      ? {
          ...timeline,
          name: cleanName,
          updatedAt,
          updatedByUserId: timeline.updatedByUserId || DEFAULT_LOCAL_USER_ID,
          updatedByName: timeline.updatedByName || DEFAULT_LOCAL_USER_NAME,
          revision: Number.isFinite(Number(timeline.revision)) ? Number(timeline.revision) + 1 : 1,
        }
      : timeline,
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
            id: createId(),
            ...(media.storage === "indexeddb"
              ? { indexedDbKey: media.indexedDbKey || media.id }
              : {}),
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
    copiedFromTimelineCode: sourceTimeline.timelineCode || "",
    copiedFromTimelineName: sourceTimeline.name || "",
    lineage: {
      copiedFromTimelineCode: sourceTimeline.timelineCode || "",
      copiedFromTimelineName: sourceTimeline.name || "",
    },
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
