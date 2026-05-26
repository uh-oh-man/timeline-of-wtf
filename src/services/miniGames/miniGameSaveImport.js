import JSZip from "jszip";
import { miniGameRegistryById } from "../../data/miniGameRegistry";
import { isZipFile } from "../../utils/uhohPackage";
import { MINI_GAME_SAVES_PATH, MINI_GAME_SAVES_SCHEMA } from "./miniGameSaveExport";

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

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function maxNumber(localValue, importedValue) {
  return Math.max(normalizeNumber(localValue), normalizeNumber(importedValue));
}

function mergeUpgradeLevels(localUpgrades = {}, importedUpgrades = {}) {
  const ids = new Set([...Object.keys(localUpgrades || {}), ...Object.keys(importedUpgrades || {})]);
  return Object.fromEntries(
    Array.from(ids).map((upgradeId) => [upgradeId, maxNumber(localUpgrades?.[upgradeId], importedUpgrades?.[upgradeId])]),
  );
}

function mergeAchievementStates(localAchievements = {}, importedAchievements = {}) {
  return {
    ...localAchievements,
    ...importedAchievements,
    unlocked: {
      ...(localAchievements?.unlocked || {}),
      ...(importedAchievements?.unlocked || {}),
    },
    unlockedAt: {
      ...(localAchievements?.unlockedAt || {}),
      ...(importedAchievements?.unlockedAt || {}),
    },
  };
}

export function validateMiniGameSave(save) {
  const game = miniGameRegistryById[save?.gameId];
  return {
    valid: Boolean(game && save && typeof save === "object"),
    game,
  };
}

export function mergeMiniGameSave(local = {}, imported = {}) {
  const now = new Date().toISOString();
  const merged = {
    ...local,
    ...imported,
    unlocked: Boolean(local.unlocked || imported.unlocked),
    limeCount: maxNumber(local.limeCount, imported.limeCount),
    count: maxNumber(local.count, imported.count),
    totalLimesEarned: maxNumber(local.totalLimesEarned, imported.totalLimesEarned),
    totalEarned: maxNumber(local.totalEarned, imported.totalEarned),
    totalClicks: maxNumber(local.totalClicks, imported.totalClicks),
    ascensionLevel: maxNumber(local.ascensionLevel, imported.ascensionLevel),
    totalAscensions: maxNumber(local.totalAscensions, imported.totalAscensions),
    upgrades: mergeUpgradeLevels(local.upgrades, imported.upgrades),
    eventModifiers: {
      ...(local.eventModifiers || {}),
      ...(imported.eventModifiers || {}),
      eggplantSpawnChanceBonus: maxNumber(
        local.eventModifiers?.eggplantSpawnChanceBonus,
        imported.eventModifiers?.eggplantSpawnChanceBonus,
      ),
    },
    lastUpdatedAt: now,
    updatedAt: now,
  };
  const numericMaxKeys = new Set(
    [...Object.keys(local || {}), ...Object.keys(imported || {})]
      .filter((key) => /(Count|Earned|Clicks|Ascensions|Level|Lifetime)$/i.test(key)),
  );
  numericMaxKeys.forEach((key) => {
    if (key === "lastUpdatedAt" || key === "updatedAt") return;
    merged[key] = maxNumber(local?.[key], imported?.[key]);
  });
  return merged;
}

export async function readMiniGameSavesFromFile(file) {
  if (!(await isZipFile(file))) {
    throw new Error("Mini-game saves must be imported from a modern ZIP .uhoh package.");
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifestFile = zip.file("manifest.json");
  const manifest = manifestFile ? JSON.parse(await manifestFile.async("string")) : {};
  const savesPath = manifest?.paths?.miniGameSaves || MINI_GAME_SAVES_PATH;
  const savesFile = zip.file(savesPath);

  if (!savesFile) {
    throw new Error("This .uhoh package does not contain mini-game saves.");
  }

  const payload = JSON.parse(await savesFile.async("string"));
  if (payload?.schema !== MINI_GAME_SAVES_SCHEMA) {
    throw new Error("Unsupported mini-game save schema.");
  }

  const saves = Array.isArray(payload.saves) ? payload.saves : [];
  return {
    valid: true,
    manifest,
    payload,
    saves: saves.filter((save) => validateMiniGameSave(save).valid),
    warnings: saves
      .filter((save) => !validateMiniGameSave(save).valid)
      .map((save) => `Skipped unknown mini-game save: ${save?.gameId || "unknown"}`),
  };
}

export function importMiniGameSaves(importResult, optionsByGameId = {}) {
  if (!canUseStorage()) return { imported: [], skipped: [], warnings: ["localStorage is unavailable."] };

  const imported = [];
  const skipped = [];
  const warnings = [...(importResult?.warnings || [])];

  for (const save of importResult?.saves || []) {
    const { game } = validateMiniGameSave(save);
    const mode = optionsByGameId[save.gameId] || "skip";
    if (!game || mode === "skip") {
      skipped.push(save.gameId);
      continue;
    }

    const localState = safeParse(window.localStorage.getItem(game.saveKey), {});
    const localAchievements = safeParse(window.localStorage.getItem(game.achievementKey), {});
    const nextState = mode === "replace"
      ? { ...(save.state || {}), unlocked: true, updatedAt: new Date().toISOString() }
      : mergeMiniGameSave(localState, { ...(save.state || {}), unlocked: true });
    const nextAchievements = mode === "replace"
      ? save.achievements || {}
      : mergeAchievementStates(localAchievements, save.achievements || {});

    window.localStorage.setItem(game.discoveredKey, "true");
    window.localStorage.setItem(game.saveKey, JSON.stringify(nextState));
    window.localStorage.setItem(game.achievementKey, JSON.stringify(nextAchievements));
    imported.push(save.gameId);
  }

  return { imported, skipped, warnings };
}
