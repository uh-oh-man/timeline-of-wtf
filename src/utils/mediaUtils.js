import { createId } from "./helpers";

export function formatFileSize(size = 0) {
  if (!size) return "unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMedia(media) {
  return String(media?.fileType || "").startsWith("image/");
}

export function isVideoMedia(media) {
  return String(media?.fileType || "").startsWith("video/");
}

export function getMediaUrl(media) {
  return media?.objectUrl || media?.src || "";
}

function readImageDimensions(objectUrl) {
  return new Promise((resolve) => {
    const image = new globalThis.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: null, height: null });
    image.src = objectUrl;
  });
}

function isSupportedMediaFile(file) {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"].some((extension) => name.endsWith(extension))
  );
}

export async function filesToExampleMedia(files, disasterIds) {
  const mediaFiles = Array.from(files || []).filter(isSupportedMediaFile);

  const mediaItems = await Promise.all(
    mediaFiles.map(async (file, index) => {
      const objectUrl = globalThis.URL.createObjectURL(file);
      const dimensions = file.type.startsWith("image/") ? await readImageDimensions(objectUrl) : { width: null, height: null };
      const disasterId = disasterIds[index % Math.max(disasterIds.length, 1)];

      return {
        id: createId(),
        disasterId,
        fileName: file.name,
        fileType: file.type || "image/png",
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        objectUrl,
        source: "example-picker",
        storage: "example-picker",
        order: index,
        createdAt: new Date().toISOString(),
        caption: "Recovered evidence from the Department of Bad Decisions.",
      };
    }),
  );

  return mediaItems;
}

export async function filesToStagedMedia(files, disasterId = "") {
  const mediaFiles = Array.from(files || []).filter(isSupportedMediaFile);

  return Promise.all(
    mediaFiles.map(async (file, index) => {
      const objectUrl = globalThis.URL.createObjectURL(file);
      const dimensions = file.type.startsWith("image/") ? await readImageDimensions(objectUrl) : { width: null, height: null };

      return {
        id: createId(),
        disasterId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
        objectUrl,
        source: "user",
        storage: "session",
        order: index,
        createdAt: new Date().toISOString(),
        caption: "",
      };
    }),
  );
}

export function distributeGeneratedMedia(mediaItems, disasterIds) {
  if (!disasterIds.length) return [];

  return mediaItems.map((media, index) => ({
    ...media,
    disasterId: media.disasterId || disasterIds[index % disasterIds.length],
    order: Number.isFinite(Number(media.order)) ? Number(media.order) : index,
    createdAt: media.createdAt || new Date().toISOString(),
  }));
}

export function attachMediaToDisasters(disasters, mediaItems) {
  const mediaByDisaster = new Map();

  mediaItems.forEach((media) => {
    if (!media.disasterId) return;
    const current = mediaByDisaster.get(media.disasterId) || [];
    current.push(media);
    mediaByDisaster.set(media.disasterId, current);
  });

  return disasters.map((disaster) => ({
    ...disaster,
    media: [...(Array.isArray(disaster.media) ? disaster.media : []), ...(mediaByDisaster.get(disaster.id) || [])],
  }));
}

export function revokeObjectUrls(mediaItems) {
  mediaItems.forEach((media) => {
    if (media?.objectUrl) globalThis.URL.revokeObjectURL(media.objectUrl);
  });
}
