import JSZip from "jszip";
import {
  APP_ID,
  APP_NAME,
  APP_TYPE,
  FILE_PURPOSE_TIMELINE_EXPORT,
} from "../constants/appIdentity";
import { generatePackageId } from "./identityCodes";

export const UHOH_DATA_MARKER = "--- DATA ---";
export const UHOH_PACKAGE_SCHEMA = "uhoh.package";
export const UHOH_PACKAGE_VERSION = 1;
export const UHOH_TIMELINE_SCHEMA = "twtaf.timeline.export";
export const UHOH_EXPORT_VERSION = 1;
export const UHOH_STORAGE_VERSION = 1;

export function buildPackageManifest({
  createdAt,
  packageId,
  mediaIncluded,
  mediaCount,
  totalMediaBytes,
  timelineCount = 1,
} = {}) {
  return {
    schema: UHOH_PACKAGE_SCHEMA,
    packageVersion: UHOH_PACKAGE_VERSION,
    packageId: String(packageId || generatePackageId()),
    createdAt: createdAt || new Date().toISOString(),
    app: {
      id: APP_ID,
      name: APP_NAME,
      type: APP_TYPE,
      filePurpose: FILE_PURPOSE_TIMELINE_EXPORT,
    },
    compatibility: {
      minimumAppVersion: null,
      exportVersion: UHOH_EXPORT_VERSION,
      storageVersion: UHOH_STORAGE_VERSION,
    },
    content: {
      mediaIncluded: Boolean(mediaIncluded),
      mediaCount: Number.isFinite(Number(mediaCount)) ? Number(mediaCount) : 0,
      timelineCount: Number.isFinite(Number(timelineCount)) ? Number(timelineCount) : 1,
      totalMediaBytes: Number.isFinite(Number(totalMediaBytes)) ? Number(totalMediaBytes) : 0,
    },
    paths: {
      timelineData: "data/timeline.json",
      mediaFolder: "media/",
    },
  };
}

export function validateUhohManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== "object") {
    return {
      valid: false,
      errors: ["Missing manifest.json in .uhoh package."],
      warnings,
      detectedApp: null,
    };
  }

  if (manifest.schema !== UHOH_PACKAGE_SCHEMA) {
    errors.push("Unsupported package schema.");
  }
  if (Number(manifest.packageVersion || 0) > UHOH_PACKAGE_VERSION) {
    warnings.push("This .uhoh package came from a newer package version. Best-effort mode enabled.");
  }

  const detectedApp = manifest.app && typeof manifest.app === "object" ? manifest.app : null;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    detectedApp,
  };
}

export function validateAppIdentity(appIdentity) {
  const detected = appIdentity && typeof appIdentity === "object" ? appIdentity : {};
  const valid = detected.id === APP_ID
    && detected.type === APP_TYPE
    && detected.filePurpose === FILE_PURPOSE_TIMELINE_EXPORT;

  return {
    valid,
    detected: {
      id: detected.id || "unknown",
      name: detected.name || "Unknown App",
      type: detected.type || "unknown",
      filePurpose: detected.filePurpose || "unknown",
    },
    expected: {
      id: APP_ID,
      name: APP_NAME,
      type: APP_TYPE,
      filePurpose: FILE_PURPOSE_TIMELINE_EXPORT,
    },
  };
}

export function getWrongAppMessage(detected, expected) {
  const detectedName = detected?.name || "Unknown App";
  const detectedId = detected?.id || "unknown";
  const detectedPurpose = detected?.filePurpose || "unknown";
  const expectedName = expected?.name || APP_NAME;
  const expectedId = expected?.id || APP_ID;
  const expectedPurpose = expected?.filePurpose || FILE_PURPOSE_TIMELINE_EXPORT;

  return `This .uhoh file is not for ${expectedName}.\n\nDetected app:\n${detectedName} (${detectedId})\nPurpose: ${detectedPurpose}\n\nExpected:\n${expectedName} (${expectedId})\nPurpose: ${expectedPurpose}\n\nThe archive refuses to eat the wrong file.`;
}

export function sanitizeMediaFileName(fileName = "") {
  const stripped = Array.from(String(fileName || ""))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
  const safeBase = stripped
    .replace(/[/\\]/g, "-")
    .replace(/[<>:"|?*]/g, "")
    .trim();

  if (!safeBase) return "unnamed-media";
  return safeBase;
}

export function createUniqueMediaPackagePath(mediaId, fileName, usedPaths = new Set()) {
  const cleanName = sanitizeMediaFileName(fileName);
  const dotIndex = cleanName.lastIndexOf(".");
  const hasExtension = dotIndex > 0 && dotIndex < cleanName.length - 1;
  const base = hasExtension ? cleanName.slice(0, dotIndex) : cleanName;
  const ext = hasExtension ? cleanName.slice(dotIndex) : "";
  const idPart = String(mediaId || "media");

  let candidate = `media/${idPart}-${base}${ext}`;
  let suffix = 2;
  while (usedPaths.has(candidate)) {
    candidate = `media/${idPart}-${base}-${suffix}${ext}`;
    suffix += 1;
  }
  usedPaths.add(candidate);
  return candidate;
}

async function readFirstBytes(fileOrBuffer, byteLength = 4) {
  if (fileOrBuffer instanceof ArrayBuffer) {
    return new Uint8Array(fileOrBuffer.slice(0, byteLength));
  }
  if (ArrayBuffer.isView(fileOrBuffer)) {
    const array = new Uint8Array(fileOrBuffer.buffer, fileOrBuffer.byteOffset, fileOrBuffer.byteLength);
    return array.slice(0, byteLength);
  }
  if (fileOrBuffer && typeof fileOrBuffer.slice === "function") {
    const head = await fileOrBuffer.slice(0, byteLength).arrayBuffer();
    return new Uint8Array(head);
  }
  return new Uint8Array();
}

function hasZipMagic(bytes) {
  if (!bytes || bytes.length < 4) return false;
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export async function isZipFile(fileOrBuffer) {
  const bytes = await readFirstBytes(fileOrBuffer, 4);
  return hasZipMagic(bytes);
}

export async function readUhohPackage(fileOrBuffer) {
  const arrayBuffer = fileOrBuffer instanceof ArrayBuffer
    ? fileOrBuffer
    : await fileOrBuffer.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Missing manifest.json");
  }

  const manifest = JSON.parse(await manifestFile.async("string"));
  const manifestValidation = validateUhohManifest(manifest);
  if (!manifestValidation.valid) {
    throw new Error(manifestValidation.errors[0] || "Invalid manifest.");
  }

  const timelinePath = manifest?.paths?.timelineData || "data/timeline.json";
  const timelineFile = zip.file(timelinePath);
  if (!timelineFile) {
    throw new Error("Missing data/timeline.json");
  }

  const timelineData = JSON.parse(await timelineFile.async("string"));

  return {
    zip,
    manifest,
    timelineData,
    warnings: manifestValidation.warnings,
  };
}

export async function createUhohPackage(
  timelinePayload,
  mediaEntries = [],
  { manifest = null, onUpdate } = {},
) {
  const packageManifest = manifest || buildPackageManifest({
    createdAt: timelinePayload?.createdAt,
    packageId: timelinePayload?.packageRef?.packageId,
    mediaIncluded: mediaEntries.length > 0,
    mediaCount: mediaEntries.length,
    totalMediaBytes: mediaEntries.reduce((sum, entry) => sum + (entry.blob?.size || 0), 0),
  });
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(packageManifest, null, 2));
  zip.file("data/timeline.json", JSON.stringify(timelinePayload, null, 2));

  mediaEntries.forEach((entry) => {
    if (!entry?.path || !entry?.blob) return;
    zip.file(entry.path, entry.blob, { binary: true });
  });

  const blob = await zip.generateAsync(
    {
      type: "blob",
      mimeType: "application/zip",
      compression: "DEFLATE",
    },
    onUpdate,
  );

  return {
    blob,
    manifest: packageManifest,
  };
}

export function parseLegacyUhohText(text) {
  const source = String(text || "");
  const markerIndex = source.indexOf(UHOH_DATA_MARKER);
  const headerText = markerIndex >= 0 ? source.slice(0, markerIndex) : "";
  const jsonText = markerIndex >= 0 ? source.slice(markerIndex + UHOH_DATA_MARKER.length) : source;
  const payload = JSON.parse(jsonText.trim());
  const header = {};

  headerText.split(/\r?\n/).forEach((line) => {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) return;
    const value = rest.join(":").trim();
    const key = rawKey.trim().toLowerCase();
    if (key === "app id") header.appId = value;
    if (key === "app name" || key === "app") header.appName = value;
    if (key === "app type") header.appType = value;
    if (key === "file purpose") header.filePurpose = value;
    if (key === "format") header.format = value;
  });

  return { payload, header };
}

export function createLegacyUhohText(payload, { createdAt } = {}) {
  const timestamp = createdAt || payload?.createdAt || new Date().toISOString();
  const header = [
    "--- UH OH EXPORT FILE ---",
    `App ID: ${APP_ID}`,
    `App Name: ${APP_NAME}`,
    `App Type: ${APP_TYPE}`,
    `File Purpose: ${FILE_PURPOSE_TIMELINE_EXPORT}`,
    "Format: legacy-text-uhoh",
    `Export Version: ${UHOH_EXPORT_VERSION}`,
    `Storage Version: ${UHOH_STORAGE_VERSION}`,
    `Created: ${timestamp}`,
    "Warning: This is a legacy text .uhoh export. Photos/videos are NOT included.",
    UHOH_DATA_MARKER,
    "",
  ].join("\n");

  return `${header}${JSON.stringify(payload, null, 2)}\n`;
}
