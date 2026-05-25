import {
  APP_ID,
  APP_IDENTITY,
  APP_NAME,
  APP_TYPE,
  FILE_PURPOSE_TIMELINE_EXPORT,
} from "../constants/appIdentity";
import { stripSessionOnlyMediaFields } from "../services/media/mediaPersistence";
import { getMediaBlob, saveMediaFile } from "../services/media/mediaStore";
import { createId, uniqueByName } from "./helpers";
import { normalizeHexColor } from "./colorUtils";
import {
  generateEventCode,
  generatePackageId,
  generateTimelineCode,
  normalizeTimelineCode,
} from "./identityCodes";
import {
  UHOH_DATA_MARKER,
  UHOH_EXPORT_VERSION,
  UHOH_STORAGE_VERSION,
  UHOH_TIMELINE_SCHEMA,
  buildPackageManifest,
  createLegacyUhohText,
  createUhohPackage,
  createUniqueMediaPackagePath,
  getWrongAppMessage,
  isZipFile,
  parseLegacyUhohText,
  readUhohPackage,
  validateAppIdentity,
} from "./uhohPackage";

export const EXPORT_SCHEMA = UHOH_TIMELINE_SCHEMA;
export const CURRENT_EXPORT_VERSION = UHOH_EXPORT_VERSION;
export const CURRENT_STORAGE_VERSION = UHOH_STORAGE_VERSION;

export const MEDIA_SIZE_WARNING_BYTES = 250 * 1024 * 1024;
export const MEDIA_SIZE_DANGER_BYTES = 1024 * 1024 * 1024;

export const CORRUPT_FILE_MESSAGE = "The archive tried to read this file and immediately regretted it.";
export const UNSUPPORTED_DIALECT_MESSAGE =
  "This .uhoh file exists, but it speaks a dialect this site does not understand.";
export const PACK_MEDIA_ERROR_MESSAGE = "The archive tried to pack the media and threw its back out.";
export const PACK_MEDIA_MEMORY_MESSAGE =
  "This export is too chunky for the browser right now. Try data-only or fewer videos.";

const EXPORT_APP_IDENTITY = {
  id: APP_ID,
  name: APP_NAME,
  type: APP_TYPE,
  filePurpose: FILE_PURPOSE_TIMELINE_EXPORT,
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeStringList(value) {
  return uniqueByName(asArray(value).map((item) => asString(item).trim()));
}

function normalizeImportedMedia(mediaItems, disasterId, { allowPackageMedia = false } = {}) {
  return asArray(mediaItems).map((media, index) => {
    const source = media && typeof media === "object" ? media : {};
    const id = source.id || createId();
    const createdAt = source.createdAt || new Date().toISOString();
    const base = {
      ...source,
      id,
      disasterId,
      timelineId: source.timelineId || "",
      fileName: asString(source.fileName, "Missing evidence file"),
      fileType: asString(source.fileType, "application/octet-stream"),
      fileSize: Number.isFinite(Number(source.fileSize)) ? Number(source.fileSize) : 0,
      width: Number.isFinite(Number(source.width)) ? Number(source.width) : null,
      height: Number.isFinite(Number(source.height)) ? Number(source.height) : null,
      caption: asString(source.caption, ""),
      order: Number.isFinite(Number(source.order)) ? Number(source.order) : index,
      createdAt,
      updatedAt: source.updatedAt || createdAt,
    };

    delete base.objectUrl;
    delete base.file;
    delete base.blob;
    delete base.packageBlob;

    if (allowPackageMedia && source.storage === "uhoh-package" && source.packagePath) {
      return {
        ...base,
        storage: "uhoh-package",
        packagePath: source.packagePath,
      };
    }

    if (source.storage === "indexeddb" && source.indexedDbKey) {
      return {
        ...base,
        storage: "indexeddb",
        indexedDbKey: source.indexedDbKey,
      };
    }

    return {
      ...base,
      storage: "missing-import-media",
      missing: true,
    };
  });
}

export function normalizeImportedEvent(event, index = 0, { allowPackageMedia = false } = {}) {
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
  const eventCode = asString(sourceEvent.eventCode, "").trim().toUpperCase() || generateEventCode();

  return {
    ...futureFields,
    id: nextId,
    eventCode,
    year: asString(year),
    title: asString(title, "Untitled Disaster") || "Untitled Disaster",
    source: asString(source || game, "Unknown Game") || "Unknown Game",
    tag: asString(tag, "Unlabeled Canon Crime") || "Unlabeled Canon Crime",
    summary: asString(summary),
    connections: normalizeStringList(connections),
    directConnections: normalizeStringList(directConnections),
    media: normalizeImportedMedia(media, nextId, { allowPackageMedia }),
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

function buildImportSummary({
  format,
  payload,
  rawData,
  normalizedEvents,
  mediaIncluded,
  mediaCount,
  totalMediaBytes,
  warnings,
  appIdentity,
}) {
  const timelineType = payload.timelineType || payload.timeline?.type || "local";
  const timelineName = payload.timeline?.name || "Imported Timeline";
  const timelineCode = normalizeTimelineCode(
    payload.timelineIdentity?.timelineCode || payload.timeline?.timelineCode || payload.timelineCode,
  );
  const packageId = asString(
    payload.packageRef?.packageId || payload.packageId || payload.manifest?.packageId || "",
  ).trim();
  const isExampleExport = Boolean(
    payload.isExampleExport || timelineType === "example" || payload.timeline?.type === "example",
  );

  return {
    format,
    appName: appIdentity?.name || APP_NAME,
    appId: appIdentity?.id || APP_ID,
    appType: appIdentity?.type || APP_TYPE,
    filePurpose: appIdentity?.filePurpose || FILE_PURPOSE_TIMELINE_EXPORT,
    createdAt: payload.createdAt || "",
    exportVersion: payload.exportVersion || "legacy",
    storageVersion: payload.storageVersion || "legacy",
    timelineType,
    timelineName,
    timelineCode,
    packageId,
    isExampleExport,
    mediaIncluded: Boolean(mediaIncluded),
    mediaCount: Number.isFinite(Number(mediaCount))
      ? Number(mediaCount)
      : normalizedEvents.reduce((count, event) => count + asArray(event.media).length, 0),
    totalMediaBytes: Number.isFinite(Number(totalMediaBytes)) ? Number(totalMediaBytes) : 0,
    eventCount: normalizedEvents.length,
    tagCount: rawData.tags.length,
    plannedGameCount: rawData.plannedGames.length,
    warningCount: warnings.length,
  };
}

function normalizeImportedPayload(payload, {
  format,
  mediaIncluded = false,
  mediaCount = 0,
  totalMediaBytes = 0,
  appIdentity = APP_IDENTITY,
  warnings = [],
} = {}) {
  const rawData = getRawImportData(payload);
  const normalizedEvents = rawData.events.map((event, index) =>
    normalizeImportedEvent(event, index, { allowPackageMedia: format === "modern-zip" && mediaIncluded }),
  );

  const mediaReferenceCount = normalizedEvents.reduce((sum, event) => sum + asArray(event.media).length, 0);
  const normalizedWarnings = [...warnings];

  if (!mediaIncluded && mediaReferenceCount > 0) {
    normalizedWarnings.push(
      "This import references media files that are not present. Missing evidence placeholders will be shown.",
    );
  }

  return {
    valid: true,
    warnings: normalizedWarnings,
    payload,
    data: {
      events: normalizedEvents,
      tags: uniqueByName(rawData.tags.map(normalizeImportedTag)),
      plannedGames: uniqueByName(rawData.plannedGames.map(normalizeImportedPlannedGame)),
      knownSecrets: normalizeStringList(rawData.knownSecrets),
      achievements: normalizeStringList(rawData.achievements),
    },
    summary: buildImportSummary({
      format,
      payload,
      rawData,
      normalizedEvents,
      mediaIncluded,
      mediaCount,
      totalMediaBytes,
      warnings: normalizedWarnings,
      appIdentity,
    }),
  };
}

function extractBlobSize(blob) {
  return Number.isFinite(Number(blob?.size)) ? Number(blob.size) : 0;
}

async function fetchBlobFromMediaReference(media) {
  if (media.storage === "indexeddb") {
    return getMediaBlob(media.indexedDbKey || media.id);
  }

  if (media.file instanceof globalThis.Blob) {
    return media.file;
  }

  if (media.blob instanceof globalThis.Blob) {
    return media.blob;
  }

  if (media.src) {
    try {
      const response = await globalThis.fetch(media.src);
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  }

  if (media.objectUrl) {
    try {
      const response = await globalThis.fetch(media.objectUrl);
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  }

  return null;
}

async function collectExportMedia(events, { includeMedia = false, onMediaProgress } = {}) {
  const usedPaths = new Set();
  const warnings = [];
  const mediaEntries = [];
  let mediaCount = 0;
  let totalMediaBytes = 0;
  let processed = 0;

  const allMedia = events.flatMap((event) =>
    asArray(event.media).map((media, mediaIndex) => ({
      eventId: event.id,
      media,
      mediaIndex,
    })),
  );

  const mediaByEvent = new Map();

  for (const event of events) {
    mediaByEvent.set(event.id, []);
  }

  for (const item of allMedia) {
    const source = item.media && typeof item.media === "object" ? item.media : {};
    const safeId = source.id || createId();
    const base = {
      ...stripSessionOnlyMediaFields([source])[0],
      id: safeId,
      disasterId: item.eventId,
      order: Number.isFinite(Number(source.order)) ? Number(source.order) : item.mediaIndex,
    };
    delete base.objectUrl;

    if (!includeMedia) {
      mediaByEvent.get(item.eventId)?.push({
        ...base,
        storage: "missing-export-media",
        missing: true,
        exportNote: "Media file was not included in this data-only export.",
      });
      processed += 1;
      onMediaProgress?.({
        processed,
        total: allMedia.length,
        mediaFileName: base.fileName,
      });
      continue;
    }

    const blob = await fetchBlobFromMediaReference(source);
    if (!blob) {
      warnings.push(`Missing media blob: ${base.fileName}`);
      mediaByEvent.get(item.eventId)?.push({
        ...base,
        storage: "missing-export-media",
        missing: true,
        exportNote: "Media file could not be found during export.",
      });
      processed += 1;
      onMediaProgress?.({
        processed,
        total: allMedia.length,
        mediaFileName: base.fileName,
      });
      continue;
    }

    const packagePath = createUniqueMediaPackagePath(safeId, base.fileName, usedPaths);
    mediaEntries.push({
      path: packagePath,
      blob,
    });
    mediaCount += 1;
    totalMediaBytes += extractBlobSize(blob);
    mediaByEvent.get(item.eventId)?.push({
      ...base,
      storage: "uhoh-package",
      packagePath,
      fileType: base.fileType || blob.type || "application/octet-stream",
      fileSize: extractBlobSize(blob),
    });
    processed += 1;
    onMediaProgress?.({
      processed,
      total: allMedia.length,
      mediaFileName: base.fileName,
    });
  }

  const eventsWithMedia = events.map((event) => ({
    ...event,
    media: mediaByEvent.get(event.id) || [],
  }));

  return {
    eventsWithMedia,
    mediaEntries,
    warnings,
    mediaCount,
    totalMediaBytes,
  };
}

function normalizeEventForExport(event, index = 0) {
  const source = event && typeof event === "object" ? event : {};
  const eventCode = asString(source.eventCode, "").trim().toUpperCase() || generateEventCode();
  return {
    ...source,
    id: source.id || createId(),
    eventCode,
    year: asString(source.year),
    title: asString(source.title, "Untitled Disaster"),
    source: asString(source.source || source.game, "Unknown Game"),
    tag: asString(source.tag, "Unlabeled Canon Crime"),
    summary: asString(source.summary),
    connections: normalizeStringList(source.connections),
    directConnections: normalizeStringList(source.directConnections),
    sortOrder: Number.isFinite(Number(source.sortOrder)) ? Number(source.sortOrder) : index,
    ...(normalizeHexColor(source.accentColor)
      ? { accentColor: normalizeHexColor(source.accentColor) }
      : {}),
    createdAt: source.createdAt || new Date().toISOString(),
    updatedAt: source.updatedAt || source.createdAt || new Date().toISOString(),
  };
}

export function buildTimelineExportPayload({
  events = [],
  tags = [],
  plannedGames = [],
  knownSecrets = [],
  achievements = [],
  timeline = null,
  timelineType = "local",
  isExampleExport = false,
  createdAt = new Date().toISOString(),
  mediaIncluded = false,
  packageId = generatePackageId(),
} = {}) {
  const safeTimeline = timeline && typeof timeline === "object"
    ? cloneJson(timeline)
    : {
        id: timelineType === "example" ? "example" : "local-main",
        name: timelineType === "example" ? "Example Timeline" : "Local Timeline",
        type: timelineType,
      };
  const timelineCode = normalizeTimelineCode(safeTimeline.timelineCode) || generateTimelineCode();
  const timelineRevision = Number.isFinite(Number(safeTimeline.revision)) ? Number(safeTimeline.revision) : 0;
  const timelineCreatedAt = safeTimeline.createdAt || createdAt;
  const timelineUpdatedAt = safeTimeline.updatedAt || timelineCreatedAt;

  return {
    schema: EXPORT_SCHEMA,
    exportVersion: CURRENT_EXPORT_VERSION,
    storageVersion: CURRENT_STORAGE_VERSION,
    createdAt,
    app: EXPORT_APP_IDENTITY,
    timelineType,
    isExampleExport: Boolean(isExampleExport),
    mediaIncluded: Boolean(mediaIncluded),
    timeline: safeTimeline,
    timelineIdentity: {
      timelineCode,
      timelineIdAtExport: asString(safeTimeline.id, "") || "local-main",
      timelineName: asString(safeTimeline.name, "Local Timeline"),
      createdAt: timelineCreatedAt,
      updatedAt: timelineUpdatedAt,
      revision: timelineRevision,
      lineage: safeTimeline.lineage && typeof safeTimeline.lineage === "object" ? safeTimeline.lineage : {},
    },
    packageRef: {
      packageId,
      exportedAt: createdAt,
    },
    data: {
      events: events.map(normalizeEventForExport),
      tags: cloneJson(tags) || [],
      plannedGames: cloneJson(plannedGames) || [],
      ...(isExampleExport
        ? {}
        : {
            knownSecrets: cloneJson(knownSecrets) || [],
            achievements: cloneJson(achievements) || [],
          }),
    },
  };
}

export async function exportTimelineZip({
  events = [],
  tags = [],
  plannedGames = [],
  knownSecrets = [],
  achievements = [],
  timeline = null,
  timelineType = "local",
  isExampleExport = false,
  includeMedia = false,
  onProgress,
} = {}) {
  const createdAt = new Date().toISOString();
  const packageId = generatePackageId();
  const normalizedEvents = events.map(normalizeEventForExport);

  const mediaCollection = await collectExportMedia(normalizedEvents, {
    includeMedia,
    onMediaProgress: onProgress ? (details) => onProgress({ phase: "media", ...details }) : undefined,
  });

  const payload = buildTimelineExportPayload({
    events: mediaCollection.eventsWithMedia,
    tags,
    plannedGames,
    knownSecrets,
    achievements,
    timeline,
    timelineType,
    isExampleExport,
    createdAt,
    mediaIncluded: includeMedia && mediaCollection.mediaCount > 0,
    packageId,
  });

  const manifest = buildPackageManifest({
    createdAt,
    packageId,
    mediaIncluded: includeMedia && mediaCollection.mediaCount > 0,
    mediaCount: mediaCollection.mediaCount,
    totalMediaBytes: mediaCollection.totalMediaBytes,
    timelineCount: 1,
  });

  const { blob } = await createUhohPackage(payload, mediaCollection.mediaEntries, {
    manifest,
    onUpdate: onProgress
      ? (metadata) => {
          onProgress({
            phase: "packing",
            percent: metadata?.percent || 0,
            currentFile: metadata?.currentFile || "",
          });
        }
      : undefined,
  });

  return {
    blob,
    payload,
    manifest,
    warnings: mediaCollection.warnings,
    mediaCount: mediaCollection.mediaCount,
    totalMediaBytes: mediaCollection.totalMediaBytes,
    mediaIncluded: includeMedia && mediaCollection.mediaCount > 0,
  };
}

export async function exportTimelineZipWithMedia(options = {}) {
  return exportTimelineZip({ ...options, includeMedia: true });
}

export function exportLegacyTimelineText({
  events = [],
  tags = [],
  plannedGames = [],
  knownSecrets = [],
  achievements = [],
  timeline = null,
  timelineType = "local",
  isExampleExport = false,
} = {}) {
  const createdAt = new Date().toISOString();
  const packageId = generatePackageId();
  const payload = buildTimelineExportPayload({
    events: events.map((event) => ({
      ...normalizeEventForExport(event),
      media: stripSessionOnlyMediaFields(asArray(event.media)).map((media) => ({
        ...media,
        storage: "missing-export-media",
        missing: true,
        exportNote: "Media file was not included in this data-only export.",
      })),
    })),
    tags,
    plannedGames,
    knownSecrets,
    achievements,
    timeline,
    timelineType,
    isExampleExport,
    createdAt,
    mediaIncluded: false,
    packageId,
  });

  return {
    text: createLegacyUhohText(payload, { createdAt }),
    payload,
  };
}

export async function importTimelineFile(file) {
  try {
    if (await isZipFile(file)) {
      const packageData = await readUhohPackage(file);
      const manifestIdentity = validateAppIdentity(packageData.manifest?.app);
      const timelineIdentity = validateAppIdentity(packageData.timelineData?.app);

      if (!manifestIdentity.valid) {
        return {
          valid: false,
          errors: [getWrongAppMessage(manifestIdentity.detected, manifestIdentity.expected)],
          warnings: [],
        };
      }
      if (!timelineIdentity.valid) {
        return {
          valid: false,
          errors: [getWrongAppMessage(timelineIdentity.detected, timelineIdentity.expected)],
          warnings: [],
        };
      }
      if (packageData.timelineData?.schema && packageData.timelineData.schema !== EXPORT_SCHEMA) {
        return {
          valid: false,
          errors: [UNSUPPORTED_DIALECT_MESSAGE],
          warnings: [],
        };
      }

      const warnings = [...packageData.warnings];
      if (Number(packageData.timelineData?.exportVersion || 0) > CURRENT_EXPORT_VERSION) {
        warnings.push("This export is from a future version. The archive will preserve what it can.");
      }
      if (Number(packageData.timelineData?.storageVersion || 0) > CURRENT_STORAGE_VERSION) {
        warnings.push("This file uses a newer storage version. Some behavior may be best-effort.");
      }

      const timelineDataWithPackageRef = {
        ...packageData.timelineData,
        packageRef: packageData.timelineData?.packageRef || {
          packageId: packageData.manifest?.packageId || "",
          exportedAt: packageData.manifest?.createdAt || packageData.timelineData?.createdAt || "",
        },
      };

      const normalized = normalizeImportedPayload(timelineDataWithPackageRef, {
        format: "modern-zip",
        mediaIncluded: Boolean(packageData.manifest?.content?.mediaIncluded),
        mediaCount: Number(packageData.manifest?.content?.mediaCount || 0),
        totalMediaBytes: Number(packageData.manifest?.content?.totalMediaBytes || 0),
        appIdentity: timelineDataWithPackageRef?.app || packageData.manifest?.app || APP_IDENTITY,
        warnings,
      });

      return {
        ...normalized,
        format: "modern-zip",
        manifest: packageData.manifest,
        file,
      };
    }

    const text = await file.text();
    const { payload, header } = parseLegacyUhohText(text);

    const hasAppIdentity = payload?.app && typeof payload.app === "object";
    const appIdentityCandidate = hasAppIdentity
      ? payload.app
      : {
          id: header.appId,
          name: header.appName,
          type: header.appType,
          filePurpose: header.filePurpose,
        };

    const identityValidation = validateAppIdentity(appIdentityCandidate);
    const schemaMatches = payload?.schema === EXPORT_SCHEMA;

    if (hasAppIdentity && !identityValidation.valid) {
      return {
        valid: false,
        errors: [getWrongAppMessage(identityValidation.detected, identityValidation.expected)],
        warnings: [],
      };
    }

    if (!hasAppIdentity && !schemaMatches) {
      return {
        valid: false,
        errors: [UNSUPPORTED_DIALECT_MESSAGE],
        warnings: [],
      };
    }

    if (payload?.schema && payload.schema !== EXPORT_SCHEMA && !schemaMatches) {
      return {
        valid: false,
        errors: [UNSUPPORTED_DIALECT_MESSAGE],
        warnings: [],
      };
    }

    const warnings = [];
    if (!identityValidation.valid && schemaMatches) {
      warnings.push("This legacy file is missing full app identity fields. Treated as older TWTaF format.");
    }
    if (Number(payload?.exportVersion || 0) > CURRENT_EXPORT_VERSION) {
      warnings.push("This export is from a future version. Best-effort import mode enabled.");
    }
    if (Number(payload?.storageVersion || 0) > CURRENT_STORAGE_VERSION) {
      warnings.push("This file uses a newer storage version. Some behavior may be best-effort.");
    }

    const normalized = normalizeImportedPayload(payload, {
      format: "legacy-text",
      mediaIncluded: false,
      mediaCount: 0,
      totalMediaBytes: 0,
      appIdentity: hasAppIdentity ? payload.app : APP_IDENTITY,
      warnings,
    });

    return {
      ...normalized,
      format: "legacy-text",
      file,
    };
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("Unexpected token") || message.includes("JSON")) {
      return {
        valid: false,
        errors: [CORRUPT_FILE_MESSAGE],
        warnings: [],
      };
    }
    return {
      valid: false,
      errors: [CORRUPT_FILE_MESSAGE],
      warnings: [],
    };
  }
}

function assignUniqueId(preferredId, usedIds) {
  let nextId = preferredId || createId();
  while (usedIds.has(nextId)) {
    nextId = createId();
  }
  usedIds.add(nextId);
  return nextId;
}

async function maybeLoadModernZip(importResult) {
  if (importResult.format !== "modern-zip" || !importResult.file) return null;
  return readUhohPackage(importResult.file);
}

export async function normalizeImportedTimeline(
  importResult,
  {
    mode = "new",
    existingEvents = [],
    targetTimelineId = "",
  } = {},
) {
  if (!importResult?.valid || !importResult?.data) {
    return {
      valid: false,
      warnings: [CORRUPT_FILE_MESSAGE],
      data: null,
    };
  }

  const usedEventIds = new Set(mode === "merge" ? existingEvents.map((event) => event.id).filter(Boolean) : []);
  const usedMediaIds = new Set(
    mode === "merge"
      ? existingEvents.flatMap((event) => asArray(event.media).map((media) => media.id)).filter(Boolean)
      : [],
  );
  const warnings = [...(importResult.warnings || [])];
  const remappedEvents = [];
  const zipData = await maybeLoadModernZip(importResult);
  let missingMediaCount = 0;

  for (const importedEvent of importResult.data.events) {
    const nextEventId = assignUniqueId(importedEvent.id, usedEventIds);
    const eventBase = {
      ...importedEvent,
      ...(nextEventId !== importedEvent.id ? { originalId: importedEvent.id } : {}),
      id: nextEventId,
    };
    const media = [];

    for (let mediaIndex = 0; mediaIndex < asArray(importedEvent.media).length; mediaIndex += 1) {
      const importedMedia = importedEvent.media[mediaIndex];
      const nextMediaId = assignUniqueId(importedMedia.id, usedMediaIds);
      const mediaBase = {
        ...importedMedia,
        ...(nextMediaId !== importedMedia.id ? { originalId: importedMedia.id } : {}),
        id: nextMediaId,
        timelineId: targetTimelineId || importedMedia.timelineId || "",
        disasterId: nextEventId,
        order: Number.isFinite(Number(importedMedia.order)) ? Number(importedMedia.order) : mediaIndex,
        updatedAt: new Date().toISOString(),
      };

      if (
        importResult.format === "modern-zip"
        && importedMedia.storage === "uhoh-package"
        && importedMedia.packagePath
      ) {
        const zipEntry = zipData?.zip?.file(importedMedia.packagePath);
        if (zipEntry) {
          try {
            const blob = await zipEntry.async("blob");
            await saveMediaFile(blob, {
              id: nextMediaId,
              timelineId: mediaBase.timelineId,
              disasterId: nextEventId,
              fileName: mediaBase.fileName,
              fileType: mediaBase.fileType || blob.type || "application/octet-stream",
              fileSize: blob.size,
              createdAt: mediaBase.createdAt,
              updatedAt: mediaBase.updatedAt,
            });
            media.push({
              ...mediaBase,
              storage: "indexeddb",
              indexedDbKey: nextMediaId,
              fileType: mediaBase.fileType || blob.type || "application/octet-stream",
              fileSize: blob.size,
              importSourcePackagePath: importedMedia.packagePath,
            });
            continue;
          } catch {
            warnings.push(`Missing packaged media during import: ${mediaBase.fileName}`);
          }
        } else {
          warnings.push(`Missing packaged media during import: ${mediaBase.fileName}`);
        }
      }

      missingMediaCount += 1;
      media.push({
        ...mediaBase,
        storage: "missing-import-media",
        missing: true,
        ...(importedMedia.packagePath ? { importSourcePackagePath: importedMedia.packagePath } : {}),
      });
    }

    remappedEvents.push({
      ...eventBase,
      media,
    });
  }

  return {
    valid: true,
    warnings,
    missingMediaCount,
    data: {
      events: remappedEvents,
      tags: importResult.data.tags,
      plannedGames: importResult.data.plannedGames,
      knownSecrets: importResult.data.knownSecrets,
      achievements: importResult.data.achievements,
    },
  };
}

export function parseTimelineImportFile(text) {
  try {
    const { payload } = parseLegacyUhohText(text);
    return normalizeImportedPayload(payload, {
      format: "legacy-text",
      mediaIncluded: false,
      mediaCount: 0,
      totalMediaBytes: 0,
      appIdentity: payload?.app || APP_IDENTITY,
      warnings: [],
    });
  } catch {
    return {
      valid: false,
      errors: [CORRUPT_FILE_MESSAGE],
      warnings: [CORRUPT_FILE_MESSAGE],
      payload: null,
      data: null,
      summary: null,
    };
  }
}

export function buildUhohFileName(date = new Date(), { isExample = false } = {}) {
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  const prefix = isExample ? "example-timeline-of-what-the-fuck" : "timeline-of-what-the-fuck";
  return `${prefix}-${stamp}-${time}.uhoh`;
}

export function downloadUhohBlob(blob, fileName = buildUhohFileName()) {
  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => globalThis.URL.revokeObjectURL(url), 0);
}

export function downloadUhohFile(text, fileName = buildUhohFileName()) {
  const blob = new globalThis.Blob([text], { type: "text/plain;charset=utf-8" });
  downloadUhohBlob(blob, fileName);
}

export { UHOH_DATA_MARKER };
