import { createId, uniqueByName } from "./helpers";
import { normalizeHexColor } from "./colorUtils";

export const EXPORT_SCHEMA = "twtaf.timeline.export";
export const CURRENT_EXPORT_VERSION = 1;
export const CURRENT_STORAGE_VERSION = 1;
export const UHOH_DATA_MARKER = "--- DATA ---";
export const MEDIA_NOT_INCLUDED_NOTE =
  "Photos/videos are not included in this export. Media support may be added later.";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeStringList(value) {
  return uniqueByName(asArray(value).map((item) => asString(item).trim()));
}

function cloneJsonSafe(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function stripSessionOnlyMediaFields(media) {
  const rest = { ...(media || {}) };
  delete rest.objectUrl;
  delete rest.src;

  return {
    ...rest,
    exportedWithoutFile: true,
  };
}

function normalizeImportedMedia(mediaItems, disasterId) {
  return asArray(mediaItems).map((media, index) => {
    const rest = media && typeof media === "object" ? { ...media } : {};
    delete rest.objectUrl;
    delete rest.src;

    return {
      ...rest,
      id: rest.id || createId(),
      disasterId,
      fileName: asString(rest.fileName, "Missing evidence file"),
      fileType: asString(rest.fileType, "application/octet-stream"),
      fileSize: Number.isFinite(Number(rest.fileSize)) ? Number(rest.fileSize) : 0,
      width: Number.isFinite(Number(rest.width)) ? Number(rest.width) : null,
      height: Number.isFinite(Number(rest.height)) ? Number(rest.height) : null,
      createdAt: rest.createdAt || new Date().toISOString(),
      caption: asString(rest.caption, ""),
      order: Number.isFinite(Number(rest.order)) ? Number(rest.order) : index,
      storage: "missing-import-media",
      missing: true,
    };
  });
}

export function normalizeImportedEvent(event, index = 0) {
  const sourceEvent = event && typeof event === "object" ? event : {};
  const {
    id,
    year,
    title,
    source,
    game,
    tag,
    summary,
    connections,
    directConnections,
    media,
    accentColor,
    sortOrder,
    orderInYear,
    createdAt,
    updatedAt,
    ...futureFields
  } = sourceEvent;
  const nextId = asString(id, "") || createId();

  return {
    ...futureFields,
    id: nextId,
    year: asString(year),
    title: asString(title, "Untitled Disaster") || "Untitled Disaster",
    source: asString(source || game, "Unknown Game") || "Unknown Game",
    tag: asString(tag, "Unlabeled Canon Crime") || "Unlabeled Canon Crime",
    summary: asString(summary),
    connections: normalizeStringList(connections),
    directConnections: normalizeStringList(directConnections),
    media: normalizeImportedMedia(media, nextId),
    ...(normalizeHexColor(accentColor) ? { accentColor: normalizeHexColor(accentColor) } : {}),
    sortOrder: Number.isFinite(Number(sortOrder))
      ? Number(sortOrder)
      : Number.isFinite(Number(orderInYear))
        ? Number(orderInYear)
        : index,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || createdAt || new Date().toISOString(),
  };
}

export function normalizeImportedTag(tag) {
  return asString(tag).trim();
}

export function normalizeImportedPlannedGame(game) {
  return asString(game).trim();
}

function getRawImportData(payload) {
  if (Array.isArray(payload)) {
    return { events: payload };
  }

  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    events: asArray(data?.events || data?.disasters),
    tags: asArray(data?.tags),
    plannedGames: asArray(data?.plannedGames || data?.futureGames),
    knownSecrets: asArray(data?.knownSecrets),
    achievements: asArray(data?.achievements || data?.unlockedAchievements),
  };
}

export function validateImportPayload(payload) {
  const warnings = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      warnings: ["The archive tried to read this file and immediately regretted it."],
    };
  }

  if (payload.schema && payload.schema !== EXPORT_SCHEMA) {
    warnings.push("This file uses a different schema. Best-effort import mode has been activated against everyone's better judgment.");
  }

  if (Number(payload.exportVersion || 0) > CURRENT_EXPORT_VERSION) {
    warnings.push("This export is from a future version. The archive will preserve what it can and squint at the rest.");
  }

  if (payload.mediaIncluded) {
    warnings.push("This file claims to include media, but this app version still refuses to import photos/videos.");
  }

  return { valid: true, warnings };
}

export function migrateImportPayload(payload) {
  const validation = validateImportPayload(payload);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.warnings,
      warnings: validation.warnings,
      payload: null,
      data: null,
      summary: null,
    };
  }

  const rawData = getRawImportData(payload);
  const normalizedEvents = rawData.events.map(normalizeImportedEvent);
  const mediaReferenceCount = normalizedEvents.reduce((sum, event) => sum + asArray(event.media).length, 0);
  const knownTopLevelFields = new Set([
    "schema",
    "exportVersion",
    "appName",
    "createdAt",
    "storageVersion",
    "timelineType",
    "isExampleExport",
    "timeline",
    "mediaIncluded",
    "mediaNote",
    "data",
  ]);
  const unknownTopLevelFields = Array.isArray(payload)
    ? []
    : Object.keys(payload).filter((key) => !knownTopLevelFields.has(key));
  const warnings = [...validation.warnings];

  if (mediaReferenceCount > 0) {
    warnings.push("This file references media, but media import is not supported yet. Entries will import with missing evidence placeholders.");
  }

  if (unknownTopLevelFields.length > 0) {
    warnings.push("Unknown future fields were found and left alone where possible. The archive is suspicious, not rude.");
  }

  return {
    valid: true,
    warnings,
    unknownTopLevelFields,
    payload,
    data: {
      events: normalizedEvents,
      tags: uniqueByName(rawData.tags.map(normalizeImportedTag)),
      plannedGames: uniqueByName(rawData.plannedGames.map(normalizeImportedPlannedGame)),
      knownSecrets: normalizeStringList(rawData.knownSecrets),
      achievements: normalizeStringList(rawData.achievements),
    },
    summary: {
      appName: payload.appName || "Unknown archive pretending to be official",
      createdAt: payload.createdAt || "",
      exportVersion: payload.exportVersion || "legacy",
      storageVersion: payload.storageVersion || "legacy",
      timelineType: payload.timelineType || payload.timeline?.type || "local",
      timelineName: payload.timeline?.name || "Imported Timeline",
      isExampleExport: Boolean(payload.isExampleExport || payload.timelineType === "example" || payload.timeline?.type === "example"),
      mediaIncluded: Boolean(payload.mediaIncluded),
      mediaReferenceCount,
      eventCount: normalizedEvents.length,
      tagCount: rawData.tags.length,
      plannedGameCount: rawData.plannedGames.length,
      hasUnknownFutureFields: unknownTopLevelFields.length > 0,
    },
  };
}

export function parseTimelineImportFile(text) {
  const source = asString(text);
  const markerIndex = source.indexOf(UHOH_DATA_MARKER);
  const jsonText = markerIndex === -1 ? source : source.slice(markerIndex + UHOH_DATA_MARKER.length);

  try {
    const payload = JSON.parse(jsonText.trim());
    return migrateImportPayload(payload);
  } catch {
    return {
      valid: false,
      errors: ["The archive tried to read this file and immediately regretted it."],
      warnings: ["The archive tried to read this file and immediately regretted it."],
      payload: null,
      data: null,
      summary: null,
    };
  }
}

export function exportTimelineData({
  events = [],
  tags = [],
  plannedGames = [],
  knownSecrets = [],
  achievements = [],
  timeline = null,
  timelineType = "local",
  isExampleExport = false,
  createdAt = new Date().toISOString(),
} = {}) {
  const safeEvents = cloneJsonSafe(events).map((event) => ({
    ...event,
    ...(normalizeHexColor(event?.accentColor) ? { accentColor: normalizeHexColor(event.accentColor) } : {}),
    media: asArray(event.media).map(stripSessionOnlyMediaFields),
  }));
  const safeTimeline = timeline && typeof timeline === "object"
    ? cloneJsonSafe(timeline)
    : {
        id: timelineType === "example" ? "example" : "local-active",
        name: timelineType === "example" ? "Example Timeline" : "Local Timeline",
        type: timelineType,
      };
  const payload = {
    schema: EXPORT_SCHEMA,
    exportVersion: CURRENT_EXPORT_VERSION,
    appName: "The Timeline of What The Fuck",
    createdAt,
    storageVersion: CURRENT_STORAGE_VERSION,
    timelineType,
    ...(isExampleExport ? { isExampleExport: true } : {}),
    mediaIncluded: false,
    mediaNote: isExampleExport
      ? "Photos/videos are not included. Example media references may not work outside this demo environment."
      : MEDIA_NOT_INCLUDED_NOTE,
    timeline: safeTimeline,
    data: {
      events: safeEvents,
      tags: cloneJsonSafe(tags) || [],
      plannedGames: cloneJsonSafe(plannedGames) || [],
      ...(isExampleExport ? {} : {
        knownSecrets: cloneJsonSafe(knownSecrets) || [],
        achievements: cloneJsonSafe(achievements) || [],
      }),
    },
  };
  const header = [
    "--- UH OH TIMELINE EXPORT ---",
    "App: The Timeline of What The Fuck",
    "Format: .uhoh",
    `Export Version: ${CURRENT_EXPORT_VERSION}`,
    `Timeline Type: ${isExampleExport ? "Example / Demo" : timelineType}`,
    `Created: ${createdAt}`,
    isExampleExport
      ? "Warning: This is an Example Timeline export used for testing. Photos/videos are NOT included."
      : "Warning: This file contains timeline disasters, tags, planned games, and optional metadata. Photos/videos are NOT included yet.",
    "Do not edit below this line unless you enjoy breaking things.",
    UHOH_DATA_MARKER,
    "",
  ].join("\n");

  return `${header}${JSON.stringify(payload, null, 2)}\n`;
}

export function buildUhohFileName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;

  return `timeline-of-what-the-fuck-${stamp}-${time}.uhoh`;
}

export function downloadUhohFile(text, fileName = buildUhohFileName()) {
  const blob = new globalThis.Blob([text], { type: "text/plain;charset=utf-8" });
  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => globalThis.URL.revokeObjectURL(url), 0);
}
