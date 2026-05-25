import { createId } from "../../utils/helpers";
import { saveMediaFile } from "./mediaStore";

function asNumberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function normalizeCommonMediaMetadata(media, { timelineId, disasterId, order = 0 }) {
  const source = media && typeof media === "object" ? media : {};
  const id = source.id || createId();
  const now = new Date().toISOString();

  return {
    id,
    timelineId: source.timelineId || timelineId || "",
    disasterId: source.disasterId || disasterId || "",
    fileName: String(source.fileName || `media-${id}`),
    fileType: String(source.fileType || "application/octet-stream"),
    fileSize: Number.isFinite(Number(source.fileSize)) ? Number(source.fileSize) : 0,
    width: asNumberOrNull(source.width),
    height: asNumberOrNull(source.height),
    caption: String(source.caption || ""),
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : order,
    createdAt: source.createdAt || now,
    updatedAt: now,
  };
}

export async function persistDraftMediaForDisaster(
  mediaItems = [],
  { timelineId, disasterId } = {},
) {
  const warnings = [];
  const persisted = [];

  for (let index = 0; index < mediaItems.length; index += 1) {
    const media = mediaItems[index];
    const base = normalizeCommonMediaMetadata(media, { timelineId, disasterId, order: index });
    const storage = String(media?.storage || "");
    const pendingFile = media?.file;

    if ((storage === "indexeddb-pending" || pendingFile instanceof globalThis.Blob) && pendingFile) {
      try {
        await saveMediaFile(pendingFile, {
          id: base.id,
          timelineId: base.timelineId,
          disasterId: base.disasterId,
          fileName: base.fileName,
          fileType: base.fileType,
          fileSize: base.fileSize,
          createdAt: base.createdAt,
          updatedAt: base.updatedAt,
        });
        persisted.push({
          ...base,
          storage: "indexeddb",
          indexedDbKey: base.id,
        });
        continue;
      } catch (error) {
        warnings.push(
          `Failed to store media "${base.fileName}" in IndexedDB: ${error?.message || "unknown error"}.`,
        );
        persisted.push({
          ...base,
          storage: "missing-import-media",
          missing: true,
          missingReason: "indexeddb-save-failed",
        });
        continue;
      }
    }

    if (storage === "indexeddb") {
      persisted.push({
        ...base,
        storage: "indexeddb",
        indexedDbKey: media.indexedDbKey || base.id,
      });
      continue;
    }

    if (storage === "uhoh-package") {
      persisted.push({
        ...base,
        storage: "uhoh-package",
        packagePath: media.packagePath || "",
      });
      continue;
    }

    if (storage === "public-example" || storage === "example" || storage === "example-picker") {
      persisted.push({
        ...base,
        storage,
        ...(media.src ? { src: media.src } : {}),
      });
      continue;
    }

    persisted.push({
      ...base,
      storage: storage || "missing-import-media",
      ...(media?.src ? { src: media.src } : {}),
      missing: Boolean(media?.missing || storage === "missing-import-media" || storage === "missing-export-media"),
    });
  }

  return { media: persisted, warnings };
}

export function stripSessionOnlyMediaFields(mediaItems = []) {
  return mediaItems.map((media, index) => {
    const source = media && typeof media === "object" ? media : {};
    const base = normalizeCommonMediaMetadata(source, {
      timelineId: source.timelineId || "",
      disasterId: source.disasterId || "",
      order: index,
    });
    return {
      ...base,
      storage: source.storage || "missing-import-media",
      ...(source.indexedDbKey ? { indexedDbKey: source.indexedDbKey } : {}),
      ...(source.packagePath ? { packagePath: source.packagePath } : {}),
      ...(source.src ? { src: source.src } : {}),
      ...(source.missing ? { missing: true } : {}),
      ...(source.originalId ? { originalId: source.originalId } : {}),
      ...(source.exportNote ? { exportNote: source.exportNote } : {}),
    };
  });
}
