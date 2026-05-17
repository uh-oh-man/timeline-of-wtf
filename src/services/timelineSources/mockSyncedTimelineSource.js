import { createId, uniqueByName } from "../../utils/helpers";
import { normalizeTimelineEvent } from "./localTimelineSource";

export const SYNC_POLL_INTERVAL_MS = 7000;
export const MOCK_SYNCED_TIMELINE_ID = "mock-real-timeline";

export const MOCK_SYNC_KEYS = {
  events: "twtaf:mockSyncedTimeline:events",
  tags: "twtaf:mockSyncedTimeline:tags",
  plannedGames: "twtaf:mockSyncedTimeline:plannedGames",
  updatedAt: "twtaf:mockSyncedTimeline:updatedAt",
  revision: "twtaf:mockSyncedTimeline:revision",
};

const MOCK_TIMELINE = {
  id: MOCK_SYNCED_TIMELINE_ID,
  name: "Shared Timeline / Real Timeline",
  type: "synced_mock",
  description: "Shared backend timeline. The official disaster archive, assuming the server is not crying.",
};

const DEFAULT_MOCK_EVENTS = [
  {
    id: "mock-sync-control-001",
    year: "2026",
    sortOrder: 0,
    title: "The Backend Becomes A Cardboard Cutout",
    source: "Control",
    tag: "Corporate Did It",
    summary: "The official archive claims to be synced. It is, in the legal sense, yelling into localStorage.",
    connections: ["Remote authority is simulated for testing because the real server is still in therapy."],
    directConnections: ["Portal / Aperture Science"],
    media: [],
    accentColor: "#22d3ee",
  },
  {
    id: "mock-sync-portal-001",
    year: "2027",
    sortOrder: 0,
    title: "Aperture Invents Permission Errors",
    source: "Portal / Aperture Science",
    tag: "Load-Bearing Bullshit",
    summary: "A lab door refuses to open until a fake account proves it is emotionally ready for edit access.",
    connections: ["Every login attempt is reviewed by an imaginary committee with a clipboard."],
    directConnections: ["Control"],
    media: [],
    accentColor: "#f59e0b",
  },
];

function canUseStorage() {
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

function loadList(key, fallback = []) {
  if (!canUseStorage()) return fallback;
  const parsed = safeParse(window.localStorage.getItem(key), fallback);
  return Array.isArray(parsed) ? parsed : fallback;
}

function saveList(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

function loadString(key, fallback = "") {
  if (!canUseStorage()) return fallback;
  return window.localStorage.getItem(key) || fallback;
}

function saveString(key, value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, String(value));
}

function incrementRevision() {
  const nextRevision = getRevision() + 1;
  saveString(MOCK_SYNC_KEYS.revision, String(nextRevision));
  saveString(MOCK_SYNC_KEYS.updatedAt, nowIso());
  return nextRevision;
}

export function ensureMockSyncedTimeline() {
  if (!canUseStorage()) return;

  if (window.localStorage.getItem(MOCK_SYNC_KEYS.events) === null) {
    saveList(MOCK_SYNC_KEYS.events, DEFAULT_MOCK_EVENTS.map(normalizeTimelineEvent));
  }
  if (window.localStorage.getItem(MOCK_SYNC_KEYS.tags) === null) {
    saveList(MOCK_SYNC_KEYS.tags, ["Corporate Did It", "Load-Bearing Bullshit", "Mock Authority"]);
  }
  if (window.localStorage.getItem(MOCK_SYNC_KEYS.plannedGames) === null) {
    saveList(MOCK_SYNC_KEYS.plannedGames, ["Future Shared Friend Timeline"]);
  }
  if (window.localStorage.getItem(MOCK_SYNC_KEYS.updatedAt) === null) {
    saveString(MOCK_SYNC_KEYS.updatedAt, nowIso());
  }
  if (window.localStorage.getItem(MOCK_SYNC_KEYS.revision) === null) {
    saveString(MOCK_SYNC_KEYS.revision, "1");
  }
}

export function getTimelines() {
  ensureMockSyncedTimeline();
  return [{ ...MOCK_TIMELINE, updatedAt: getUpdatedAt() }];
}

export function getActiveTimeline() {
  return getTimelines()[0];
}

export function setActiveTimeline() {
  return getActiveTimeline();
}

export function listEvents() {
  ensureMockSyncedTimeline();
  return loadList(MOCK_SYNC_KEYS.events, DEFAULT_MOCK_EVENTS).map(normalizeTimelineEvent);
}

export function saveEvents(_timelineId, events) {
  saveList(MOCK_SYNC_KEYS.events, (events || []).map(normalizeTimelineEvent));
  incrementRevision();
}

export function listTags(_timelineId, defaultTags = []) {
  ensureMockSyncedTimeline();
  return uniqueByName([...defaultTags, ...loadList(MOCK_SYNC_KEYS.tags, [])]);
}

export function saveTags(_timelineId, tags) {
  saveList(MOCK_SYNC_KEYS.tags, tags);
  incrementRevision();
}

export function listPlannedGames(_timelineId, defaultPlannedGames = []) {
  ensureMockSyncedTimeline();
  const stored = loadList(MOCK_SYNC_KEYS.plannedGames, null);
  return Array.isArray(stored) ? stored : defaultPlannedGames;
}

export function savePlannedGames(_timelineId, plannedGames) {
  saveList(MOCK_SYNC_KEYS.plannedGames, plannedGames);
  incrementRevision();
}

export function getRevision() {
  ensureMockSyncedTimeline();
  const revision = Number(loadString(MOCK_SYNC_KEYS.revision, "1"));
  return Number.isFinite(revision) ? revision : 1;
}

export function getUpdatedAt() {
  ensureMockSyncedTimeline();
  return loadString(MOCK_SYNC_KEYS.updatedAt, nowIso());
}

export function getSnapshot() {
  ensureMockSyncedTimeline();
  return {
    revision: getRevision(),
    updatedAt: getUpdatedAt(),
    events: listEvents(),
    tags: listTags(),
    plannedGames: listPlannedGames(),
  };
}

export function getStatus() {
  ensureMockSyncedTimeline();
  return {
    mode: "synced_mock",
    label: "Mock sync active",
    detail: "The server is imaginary, but the anxiety is real.",
    updatedAt: getUpdatedAt(),
    revision: getRevision(),
  };
}

export function simulateRemoteUpdate() {
  ensureMockSyncedTimeline();
  const currentEvents = listEvents();
  const sourceOptions = ["Halo", "Cyberpunk 2077", "Fallout", "Dead Space"];
  const source = sourceOptions[currentEvents.length % sourceOptions.length];
  const nextEvent = normalizeTimelineEvent({
    id: `mock-remote-${createId()}`,
    year: String(2030 + (currentEvents.length % 7)),
    sortOrder: currentEvents.length,
    title: "Remote Update Walks In Wearing A Fake Mustache",
    source,
    tag: "Mock Authority",
    summary: "A simulated shared edit arrived from the imaginary backend. Live updates simulated. Please clap.",
    connections: ["The archive twitched and pretended this came from a server."],
    directConnections: currentEvents[0]?.source ? [currentEvents[0].source] : [],
    media: [],
    accentColor: currentEvents.length % 2 === 0 ? "#ef4444" : "#38bdf8",
  });

  saveList(MOCK_SYNC_KEYS.events, [...currentEvents, nextEvent]);
  incrementRevision();
  return nextEvent;
}
