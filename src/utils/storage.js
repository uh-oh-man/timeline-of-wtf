import {
  ensureLocalTimelineStorage,
  getActiveTimelineId,
  listEvents,
  listPlannedGames,
  listTags,
  saveEvents,
  savePlannedGames as saveTimelinePlannedGames,
  saveTags as saveTimelineTags,
} from "../services/timelineSources/localTimelineSource";

const STORAGE_KEYS = {
  disasters: "twtaf:events",
  tags: "twtaf:tags",
  plannedGames: "twtaf:plannedGames",
  achievements: "twtaf:achievements",
  knownSecrets: "twtaf:knownSecrets",
  flags: "twtaf:flags",
  tosDismissed: "twtaf:tosDismissed",
  adminMode: "twtaf:adminMode",
  exampleMode: "twtaf:exampleMode",
  selectedTimelineSource: "twtaf:selectedTimelineSource",
  timelineIndex: "twtaf:timelineIndex",
  activeTimelineId: "twtaf:activeTimelineId",
  migratedSingleTimeline: "twtaf:migratedSingleTimeline",
  mockAuthSession: "twtaf:mockAuthSession",
  mockSyncedEvents: "twtaf:mockSyncedTimeline:events",
  mockSyncedTags: "twtaf:mockSyncedTimeline:tags",
  mockSyncedPlannedGames: "twtaf:mockSyncedTimeline:plannedGames",
  mockSyncedUpdatedAt: "twtaf:mockSyncedTimeline:updatedAt",
  mockSyncedRevision: "twtaf:mockSyncedTimeline:revision",
};

const LEGACY_KEYS = {
  disasters: "twotf.disasters",
  tags: "twotf.tags",
  plannedGames: "twotf.plannedGames",
  achievements: "twotf.achievements",
  flags: "twotf.flags",
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function loadRaw(key, legacyKey = null) {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(key);
  if (raw !== null) return raw;

  return legacyKey ? window.localStorage.getItem(legacyKey) : null;
}

function loadList(key, fallback = [], legacyKey = null) {
  if (!canUseStorage()) return fallback;

  const raw = loadRaw(key, legacyKey);
  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveList(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadObject(key, fallback = {}, legacyKey = null) {
  if (!canUseStorage()) return fallback;

  const raw = loadRaw(key, legacyKey);
  if (raw === null) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveObject(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadDisasters() {
  ensureLocalTimelineStorage();
  return listEvents(getActiveTimelineId());
}

export function saveDisasters(disasters) {
  ensureLocalTimelineStorage();
  saveEvents(getActiveTimelineId(), disasters);
}

export function loadTags(defaultTags) {
  ensureLocalTimelineStorage();
  return listTags(getActiveTimelineId(), defaultTags);
}

export function saveTags(tags) {
  ensureLocalTimelineStorage();
  saveTimelineTags(getActiveTimelineId(), tags);
}

export function loadPlannedGames(defaultPlannedGames) {
  ensureLocalTimelineStorage();
  return listPlannedGames(getActiveTimelineId(), defaultPlannedGames);
}

export function savePlannedGames(plannedGames) {
  ensureLocalTimelineStorage();
  saveTimelinePlannedGames(getActiveTimelineId(), plannedGames);
}

export function loadUnlockedAchievements() {
  return loadList(STORAGE_KEYS.achievements, [], LEGACY_KEYS.achievements);
}

export function saveUnlockedAchievements(achievementIds) {
  saveList(STORAGE_KEYS.achievements, achievementIds);
}

export function loadFlags() {
  const flags = loadObject(STORAGE_KEYS.flags, {}, LEGACY_KEYS.flags);
  const tosDismissed = loadBoolean(STORAGE_KEYS.tosDismissed, Boolean(flags.tosDismissed));
  return { ...flags, tosDismissed };
}

export function saveFlags(flags) {
  saveObject(STORAGE_KEYS.flags, flags);
  saveBoolean(STORAGE_KEYS.tosDismissed, Boolean(flags.tosDismissed));
}

function loadBoolean(key, fallback = false) {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

function saveBoolean(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, value ? "true" : "false");
}

export function loadKnownSecrets() {
  return loadList(STORAGE_KEYS.knownSecrets, []);
}

export function saveKnownSecrets(secretIds) {
  saveList(STORAGE_KEYS.knownSecrets, secretIds);
}

export function loadAdminMode() {
  return loadBoolean(STORAGE_KEYS.adminMode, false);
}

export function saveAdminMode(value) {
  saveBoolean(STORAGE_KEYS.adminMode, value);
}

export function clearAppStorage() {
  if (!canUseStorage()) return;

  Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter(Boolean)
    .filter((key) => key.startsWith("twtaf:") || Object.values(LEGACY_KEYS).includes(key))
    .forEach((key) => window.localStorage.removeItem(key));
}
