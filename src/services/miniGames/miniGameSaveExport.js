import JSZip from "jszip";
import {
  APP_ID,
  APP_NAME,
  FILE_PURPOSE_MINI_GAME_SAVE_EXPORT,
} from "../../constants/appIdentity";
import { miniGameRegistry, miniGameRegistryById } from "../../data/miniGameRegistry";
import { generatePackageId } from "../../utils/identityCodes";

export const MINI_GAME_SAVES_SCHEMA = "twtaf.mini-game-saves.export";
export const MINI_GAME_SAVES_PATH = "data/mini-game-saves.json";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readStorageJson(key) {
  if (!canUseStorage() || !key) return null;
  return safeParse(window.localStorage.getItem(key), null);
}

function readStorageBoolean(key) {
  if (!canUseStorage() || !key) return false;
  return window.localStorage.getItem(key) === "true";
}

export function isMiniGameDiscovered(game) {
  if (!game) return false;
  const unlockedFlag = readStorageBoolean(game.discoveredKey);
  const savedState = readStorageJson(game.saveKey);
  return Boolean(unlockedFlag || savedState?.unlocked);
}

export function getDiscoveredMiniGames() {
  return miniGameRegistry.filter(isMiniGameDiscovered);
}

export function buildMiniGameSavePayload(gameIds = []) {
  const selectedGames = gameIds.length
    ? gameIds.map((gameId) => miniGameRegistryById[gameId]).filter(Boolean)
    : getDiscoveredMiniGames();
  const createdAt = new Date().toISOString();

  return {
    schema: MINI_GAME_SAVES_SCHEMA,
    exportVersion: 1,
    createdAt,
    app: {
      id: APP_ID,
      name: APP_NAME,
      type: "mini-game-save",
      filePurpose: FILE_PURPOSE_MINI_GAME_SAVE_EXPORT,
    },
    saves: selectedGames
      .filter(isMiniGameDiscovered)
      .map((game) => ({
        gameId: game.id,
        gameName: game.name,
        saveVersion: game.exportVersion || 1,
        exportedAt: createdAt,
        unlocked: true,
        state: readStorageJson(game.saveKey) || { unlocked: true },
        achievements: readStorageJson(game.achievementKey) || {},
      })),
  };
}

export function buildMiniGameManifest(payload, { packageId = generatePackageId(), createdAt = new Date().toISOString() } = {}) {
  const saves = Array.isArray(payload?.saves) ? payload.saves : [];
  return {
    schema: "uhoh.package",
    packageVersion: 1,
    packageId,
    createdAt,
    app: {
      id: APP_ID,
      name: APP_NAME,
      type: "mini-game-save",
      filePurpose: FILE_PURPOSE_MINI_GAME_SAVE_EXPORT,
    },
    content: {
      timelineCount: 0,
      miniGameSaveCount: saves.length,
      includedMiniGames: saves.map((save) => save.gameId).filter(Boolean),
      mediaIncluded: false,
      mediaCount: 0,
    },
    paths: {
      miniGameSaves: MINI_GAME_SAVES_PATH,
    },
  };
}

export async function createMiniGameSavePackage(gameIds = []) {
  const payload = buildMiniGameSavePayload(gameIds);
  const createdAt = payload.createdAt || new Date().toISOString();
  const packageId = generatePackageId();
  const manifest = buildMiniGameManifest(payload, { packageId, createdAt });
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(MINI_GAME_SAVES_PATH, JSON.stringify(payload, null, 2));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/zip",
    compression: "DEFLATE",
  });

  return {
    blob,
    payload,
    manifest,
  };
}

export function downloadMiniGameSaveBlob(blob, fileName = "mini-game-saves.uhoh") {
  const safeName = String(fileName || "mini-game-saves.uhoh").trim().endsWith(".uhoh")
    ? String(fileName || "mini-game-saves.uhoh").trim()
    : `${String(fileName || "mini-game-saves").trim()}.uhoh`;
  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeName || "mini-game-saves.uhoh";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => globalThis.URL.revokeObjectURL(url), 0);
}

export async function exportMiniGameSaves(gameIds = [], fileName = "mini-game-saves.uhoh") {
  const result = await createMiniGameSavePackage(gameIds);
  downloadMiniGameSaveBlob(result.blob, fileName);
  return result;
}
