import { APP_ID, FILE_PURPOSE_TIMELINE_EXPORT } from "../../constants/appIdentity";
import { generatedExampleMedia } from "../../data/generatedExampleMedia";
import { exampleRemoteConfig } from "../../data/exampleRemoteConfig";
import { exampleTimeline } from "../../data/exampleTimeline";
import { uniqueByName } from "../../utils/helpers";
import { attachMediaToDisasters, distributeGeneratedMedia } from "../../utils/mediaUtils";
import { importTimelineFile, normalizeImportedTimeline } from "../../utils/exportImport";

export const REMOTE_EXAMPLE_TIMELINE_ID = "example-remote-session";

function ensureAllowedRemoteUrl(rawUrl) {
  if (rawUrl !== exampleRemoteConfig.rawUrl) {
    throw new Error("Remote example URL is not allowed.");
  }
}

function buildBuiltInExample() {
  const disasterIds = exampleTimeline.map((disaster) => disaster.id);
  const generatedMedia = distributeGeneratedMedia(generatedExampleMedia, disasterIds);
  const events = attachMediaToDisasters(exampleTimeline, generatedMedia);

  return {
    source: "built-in-fallback",
    sourceLabel: "Built-in fallback",
    events,
    tags: uniqueByName(events.map((eventItem) => eventItem.tag).filter(Boolean)),
    plannedGames: [],
    warnings: [],
    mediaCount: generatedMedia.length,
    timelineName: "Example Timeline",
    fallbackNotice: "Remote example unavailable. Built-in demo loaded instead.",
    usedFallback: true,
  };
}

async function fetchRemoteExampleBlob(rawUrl, timeoutMs) {
  ensureAllowedRemoteUrl(rawUrl);

  const controller = new globalThis.AbortController();
  const timeoutId = window.setTimeout(() => controller.abort("remote-example-timeout"), timeoutMs);
  try {
    const response = await globalThis.fetch(rawUrl, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Remote example request failed (${response.status}).`);
    }
    return await response.blob();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function validateRemoteImportSummary(summary = {}) {
  if (summary.appId !== APP_ID) {
    throw new Error(`Remote example app ID mismatch: ${summary.appId || "unknown"}.`);
  }
  if (summary.filePurpose !== FILE_PURPOSE_TIMELINE_EXPORT) {
    throw new Error(`Remote example file purpose mismatch: ${summary.filePurpose || "unknown"}.`);
  }
  if (!(summary.timelineType === "example" || summary.isExampleExport)) {
    throw new Error("Remote file is not marked as an Example Timeline export.");
  }
}

async function loadRemoteExample(rawUrl, timeoutMs) {
  const blob = await fetchRemoteExampleBlob(rawUrl, timeoutMs);
  const file = new globalThis.File([blob], "example.uhoh", { type: blob.type || "application/octet-stream" });
  const imported = await importTimelineFile(file);

  if (!imported.valid || !imported.data) {
    throw new Error(imported.errors?.[0] || "Remote example import failed.");
  }

  validateRemoteImportSummary(imported.summary);

  const normalized = await normalizeImportedTimeline(imported, {
    mode: "replace",
    existingEvents: [],
    targetTimelineId: REMOTE_EXAMPLE_TIMELINE_ID,
  });

  if (!normalized.valid || !normalized.data) {
    throw new Error("Remote example normalization failed.");
  }

  return {
    source: "remote-github-uhoh",
    sourceLabel: "Remote GitHub .uhoh",
    events: normalized.data.events,
    tags: normalized.data.tags,
    plannedGames: normalized.data.plannedGames,
    warnings: [...(imported.warnings || []), ...(normalized.warnings || [])],
    mediaCount: imported.summary?.mediaCount || 0,
    timelineName: imported.summary?.timelineName || "Example Timeline",
    usedFallback: false,
  };
}

export async function loadExampleTimelineSource({
  config = exampleRemoteConfig,
  onStatus,
} = {}) {
  const fallback = buildBuiltInExample();

  if (!config?.enabled || !globalThis.navigator?.onLine) {
    return fallback;
  }

  try {
    onStatus?.("Loading remote demo evidence...");
    const remote = await loadRemoteExample(config.rawUrl, config.timeoutMs || 12000);
    return remote;
  } catch (error) {
    globalThis.console.warn("Remote example failed, falling back to built-in example", error);
    if (!config?.fallbackToBuiltIn) {
      throw error;
    }
    return {
      ...fallback,
      warnings: [...fallback.warnings, String(error?.message || "Remote example failed.")],
    };
  }
}
