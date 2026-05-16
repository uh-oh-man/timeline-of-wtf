import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicFolder = path.join(root, "public", "example_media");
const outputFile = path.join(root, "src", "data", "generatedExampleMedia.js");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm"]);

const mimeTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
]);

function slugId(fileName, index) {
  const slug = fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `example-media-${String(index + 1).padStart(3, "0")}-${slug || "evidence"}`;
}

function readPngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readGifSize(buffer) {
  if (buffer.length < 10 || !["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }

    offset += 2 + length;
  }

  return null;
}

function readWebpSize(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  const format = buffer.toString("ascii", 12, 16);
  if (format === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (format === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }

  return null;
}

function readDimensions(filePath, extension) {
  if (extension === ".mp4" || extension === ".webm") return { width: null, height: null };

  try {
    const buffer = fs.readFileSync(filePath);
    const size =
      extension === ".png"
        ? readPngSize(buffer)
        : extension === ".gif"
          ? readGifSize(buffer)
          : extension === ".jpg" || extension === ".jpeg"
            ? readJpegSize(buffer)
            : extension === ".webp"
              ? readWebpSize(buffer)
              : null;

    return size || { width: null, height: null };
  } catch {
    return { width: null, height: null };
  }
}

function buildManifest() {
  if (!fs.existsSync(publicFolder)) {
    fs.mkdirSync(publicFolder, { recursive: true });
  }

  const files = fs
    .readdirSync(publicFolder, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return files.map((fileName, index) => {
    const extension = path.extname(fileName).toLowerCase();
    const filePath = path.join(publicFolder, fileName);
    const stats = fs.statSync(filePath);
    const dimensions = readDimensions(filePath, extension);

    return {
      id: slugId(fileName, index),
      fileName,
      fileType: mimeTypes.get(extension) || "application/octet-stream",
      src: `/example_media/${encodeURIComponent(fileName)}`,
      storage: "public-example",
      source: "example",
      width: dimensions.width,
      height: dimensions.height,
      fileSize: stats.size,
      caption: "Recovered evidence from the Department of Bad Decisions.",
    };
  });
}

const manifest = buildManifest();
const serialized = JSON.stringify(manifest, null, 2).replace(/[\u007f-\uffff]/g, (character) =>
  `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
);
const output = `export const generatedExampleMedia = ${serialized};\n`;

fs.writeFileSync(outputFile, output);
globalThis.console.log(`Generated ${manifest.length} example media item${manifest.length === 1 ? "" : "s"}.`);
