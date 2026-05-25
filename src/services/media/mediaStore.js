import { createId } from "../../utils/helpers";

export const MEDIA_DB_NAME = "twtaf-media";
export const MEDIA_DB_VERSION = 1;
export const MEDIA_STORE_NAME = "mediaBlobs";

let mediaDbPromise = null;

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function toPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function normalizeBlob(fileOrBlob, fallbackType = "application/octet-stream") {
  if (fileOrBlob instanceof globalThis.Blob) {
    return fileOrBlob;
  }
  return new globalThis.Blob([fileOrBlob], { type: fallbackType });
}

export function openMediaDb() {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error("IndexedDB is not available in this browser context."));
  }

  if (mediaDbPromise) return mediaDbPromise;

  mediaDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.objectStoreNames.contains(MEDIA_STORE_NAME)
        ? request.transaction.objectStore(MEDIA_STORE_NAME)
        : db.createObjectStore(MEDIA_STORE_NAME, { keyPath: "id" });

      if (!store.indexNames.contains("timelineId")) {
        store.createIndex("timelineId", "timelineId", { unique: false });
      }
      if (!store.indexNames.contains("timelineDisaster")) {
        store.createIndex("timelineDisaster", ["timelineId", "disasterId"], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open media database."));
    request.onblocked = () => reject(new Error("Media database open was blocked."));
  });

  return mediaDbPromise;
}

export async function saveMediaFile(fileOrBlob, metadata = {}) {
  const db = await openMediaDb();
  const now = new Date().toISOString();
  const id = metadata.id || createId();
  const blob = normalizeBlob(fileOrBlob, metadata.fileType || "application/octet-stream");
  const fileType = metadata.fileType || blob.type || "application/octet-stream";
  const fileSize = Number.isFinite(Number(metadata.fileSize)) ? Number(metadata.fileSize) : blob.size;
  const record = {
    id,
    timelineId: metadata.timelineId || "",
    disasterId: metadata.disasterId || "",
    fileName: metadata.fileName || `media-${id}`,
    fileType,
    fileSize,
    blob,
    createdAt: metadata.createdAt || now,
    updatedAt: metadata.updatedAt || now,
  };

  const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
  const store = tx.objectStore(MEDIA_STORE_NAME);
  await toPromise(store.put(record));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to save media record."));
    tx.onabort = () => reject(tx.error || new Error("Media save transaction aborted."));
  });

  return record;
}

export async function getMediaBlob(mediaId) {
  if (!mediaId) return null;
  const db = await openMediaDb();
  const tx = db.transaction(MEDIA_STORE_NAME, "readonly");
  const store = tx.objectStore(MEDIA_STORE_NAME);
  const record = await toPromise(store.get(mediaId));
  return record?.blob || null;
}

export async function getMediaObjectUrl(mediaId) {
  const blob = await getMediaBlob(mediaId);
  if (!blob) return "";
  return window.URL.createObjectURL(blob);
}

export async function deleteMedia(mediaId) {
  if (!mediaId) return;
  const db = await openMediaDb();
  const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
  const store = tx.objectStore(MEDIA_STORE_NAME);
  await toPromise(store.delete(mediaId));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to delete media record."));
    tx.onabort = () => reject(tx.error || new Error("Media delete transaction aborted."));
  });
}

export async function deleteMediaByTimelineId(timelineId) {
  if (!timelineId) return [];
  const db = await openMediaDb();
  const removedIds = [];

  await new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const index = store.index("timelineId");
    const query = globalThis.IDBKeyRange.only(timelineId);
    const request = index.openCursor(query);

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const mediaId = cursor.value?.id;
      if (mediaId) removedIds.push(mediaId);
      cursor.delete();
      cursor.continue();
    };

    request.onerror = () => reject(request.error || new Error("Failed to scan timeline media for cleanup."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Timeline media cleanup transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("Timeline media cleanup transaction aborted."));
  });

  return removedIds;
}

export async function listMediaForDisaster(timelineId, disasterId) {
  const db = await openMediaDb();
  const tx = db.transaction(MEDIA_STORE_NAME, "readonly");
  const store = tx.objectStore(MEDIA_STORE_NAME);
  const index = store.index("timelineDisaster");
  const query = globalThis.IDBKeyRange.only([timelineId || "", disasterId || ""]);
  const results = await toPromise(index.getAll(query));
  return Array.isArray(results) ? results : [];
}

export async function cleanupOrphanedMedia(validMediaIds = []) {
  const db = await openMediaDb();
  const validSet = new Set(Array.isArray(validMediaIds) ? validMediaIds.filter(Boolean) : []);
  const removedIds = [];

  await new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE_NAME, "readwrite");
    const store = tx.objectStore(MEDIA_STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      const mediaId = cursor.value?.id;
      if (!validSet.has(mediaId)) {
        removedIds.push(mediaId);
        cursor.delete();
      }
      cursor.continue();
    };

    request.onerror = () => reject(request.error || new Error("Failed to scan media store."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Media cleanup transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("Media cleanup transaction aborted."));
  });

  return removedIds;
}

export function revokeObjectUrl(url) {
  if (!url) return;
  try {
    window.URL.revokeObjectURL(url);
  } catch {
    // Ignore URL revocation errors; stale URLs should never crash the app.
  }
}

export function revokeObjectUrls(urls = []) {
  urls.forEach((url) => revokeObjectUrl(url));
}
