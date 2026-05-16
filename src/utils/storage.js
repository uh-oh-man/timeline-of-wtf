import { createId } from "./helpers";

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
  const orderByYear = new Map();

  return loadList(STORAGE_KEYS.disasters, [], LEGACY_KEYS.disasters).map((disaster) => {
    const year = disaster.year || "";
    const key = String(year).trim().toLowerCase();
    const fallbackOrder = orderByYear.get(key) || 0;
    orderByYear.set(key, fallbackOrder + 1);

    return {
      id: disaster.id || createId(),
      year,
      title: disaster.title || "",
      source: disaster.source || "",
      tag: disaster.tag || "",
      summary: disaster.summary || "",
      connections: Array.isArray(disaster.connections) ? disaster.connections : [],
      directConnections: Array.isArray(disaster.directConnections) ? disaster.directConnections : [],
      media: Array.isArray(disaster.media) ? disaster.media : [],
      sortOrder: Number.isFinite(Number(disaster.sortOrder)) ? Number(disaster.sortOrder) : fallbackOrder,
    };
  });
}

export function saveDisasters(disasters) {
  saveList(STORAGE_KEYS.disasters, disasters);
}

export function loadTags(defaultTags) {
  const storedTags = loadList(STORAGE_KEYS.tags, null, LEGACY_KEYS.tags);
  if (storedTags === null) return defaultTags;

  return [...new Set([...defaultTags, ...storedTags].filter(Boolean))];
}

export function saveTags(tags) {
  saveList(STORAGE_KEYS.tags, tags);
}

export function loadPlannedGames(defaultPlannedGames) {
  return loadList(STORAGE_KEYS.plannedGames, defaultPlannedGames, LEGACY_KEYS.plannedGames);
}

export function savePlannedGames(plannedGames) {
  saveList(STORAGE_KEYS.plannedGames, plannedGames);
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

  [...Object.values(STORAGE_KEYS), ...Object.values(LEGACY_KEYS)].forEach((key) => {
    window.localStorage.removeItem(key);
  });
}
