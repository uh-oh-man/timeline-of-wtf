import { fruitClickerRegistry, fruitClickerRegistryById } from "../../data/fruitClickerRegistry";

export const DEFAULT_FRUIT_EVENT_MODIFIERS = {
  lemonsDisabled: false,
  eggplantsEnabled: false,
  eggplantSpawnChanceBonus: 0,
  autoClickersDisabledUntil: null,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function nowIso() {
  return new Date().toISOString();
}

function safeParse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
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

function capitalize(value = "") {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function getFruitCountKey(gameId) {
  const game = fruitClickerRegistryById[gameId];
  return `${game?.singularCurrencyName || gameId}Count`;
}

export function getFruitTotalEarnedKey(gameId) {
  const game = fruitClickerRegistryById[gameId];
  return `total${capitalize(game?.currencyName || `${gameId}s`)}Earned`;
}

export function getFruitCount(gameId, state = {}) {
  const countKey = getFruitCountKey(gameId);
  return normalizeNumber(state.count ?? state[countKey] ?? state.limeCount, 0);
}

export function getFruitTotalEarned(gameId, state = {}) {
  const totalKey = getFruitTotalEarnedKey(gameId);
  return normalizeNumber(state.totalEarned ?? state[totalKey] ?? state.totalLimesEarned, 0);
}

export function withFruitCount(gameId, state = {}, count, totalEarned = null) {
  const countKey = getFruitCountKey(gameId);
  const totalKey = getFruitTotalEarnedKey(gameId);
  const next = {
    ...state,
    count,
    [countKey]: count,
  };
  if (totalEarned !== null) {
    next.totalEarned = totalEarned;
    next[totalKey] = totalEarned;
  }
  return next;
}

function defaultUpgradesForGame(gameId) {
  const game = fruitClickerRegistryById[gameId];
  return Object.fromEntries((game?.upgrades || []).map((upgrade) => [upgrade.id, 0]));
}

export function createDefaultFruitState(gameId, { unlocked = false } = {}) {
  const now = nowIso();
  const base = {
    gameId,
    unlocked,
    count: 0,
    totalEarned: 0,
    totalClicks: 0,
    upgrades: defaultUpgradesForGame(gameId),
    eventModifiers: { ...DEFAULT_FRUIT_EVENT_MODIFIERS },
    ascensionLevel: 0,
    totalAscensions: 0,
    lastAscendedAt: null,
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  return withFruitCount(gameId, base, 0, 0);
}

export function normalizeFruitState(gameId, state) {
  const defaults = createDefaultFruitState(gameId);
  const source = state && typeof state === "object" ? state : {};
  const count = getFruitCount(gameId, source);
  const totalEarned = getFruitTotalEarned(gameId, source);

  return withFruitCount(
    gameId,
    {
      ...defaults,
      ...source,
      gameId,
      unlocked: Boolean(source.unlocked || defaults.unlocked),
      totalClicks: normalizeNumber(source.totalClicks, 0),
      upgrades: {
        ...defaults.upgrades,
        ...(source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {}),
      },
      eventModifiers: {
        ...DEFAULT_FRUIT_EVENT_MODIFIERS,
        ...(source.eventModifiers && typeof source.eventModifiers === "object" ? source.eventModifiers : {}),
      },
      ascensionLevel: normalizeNumber(source.ascensionLevel, 0),
      totalAscensions: normalizeNumber(source.totalAscensions, 0),
      lastAscendedAt: source.lastAscendedAt || null,
      lastUpdatedAt: source.lastUpdatedAt || defaults.lastUpdatedAt,
      createdAt: source.createdAt || defaults.createdAt,
      updatedAt: source.updatedAt || defaults.updatedAt,
    },
    count,
    totalEarned,
  );
}

export function loadFruitUnlocked(gameId) {
  const game = fruitClickerRegistryById[gameId];
  if (!game || !canUseStorage()) return false;
  return window.localStorage.getItem(game.unlockedKey) === "true";
}

export function saveFruitUnlocked(gameId, value) {
  const game = fruitClickerRegistryById[gameId];
  if (!game || !canUseStorage()) return;
  window.localStorage.setItem(game.unlockedKey, value ? "true" : "false");
}

export function loadFruitState(gameId) {
  const game = fruitClickerRegistryById[gameId];
  if (!game || !canUseStorage()) return createDefaultFruitState(gameId);
  const parsed = safeParse(window.localStorage.getItem(game.saveKey), null);
  const normalized = normalizeFruitState(gameId, parsed);
  if (loadFruitUnlocked(gameId)) normalized.unlocked = true;
  return normalized;
}

export function saveFruitState(gameId, state) {
  const game = fruitClickerRegistryById[gameId];
  if (!game || !canUseStorage()) return;
  const normalized = normalizeFruitState(gameId, state);
  window.localStorage.setItem(game.saveKey, JSON.stringify(normalized));
  saveFruitUnlocked(gameId, Boolean(normalized.unlocked));
}

export function unlockFruitClicker(gameId) {
  const existing = loadFruitState(gameId);
  const now = nowIso();
  const next = normalizeFruitState(gameId, {
    ...existing,
    unlocked: true,
    createdAt: existing.createdAt || now,
    lastUpdatedAt: existing.lastUpdatedAt || now,
    updatedAt: now,
  });
  saveFruitState(gameId, next);
  saveFruitUnlocked(gameId, true);
  return next;
}

export function loadLocalFruitStates(gameIds = fruitClickerRegistry.map((game) => game.id)) {
  return Object.fromEntries(gameIds.map((gameId) => [gameId, loadFruitState(gameId)]));
}

export function saveLocalFruitStates(statesByGameId = {}) {
  Object.entries(statesByGameId).forEach(([gameId, state]) => saveFruitState(gameId, state));
}

export function clearAllFruitClickerData() {
  if (!canUseStorage()) return;
  fruitClickerRegistry.forEach((game) => {
    window.localStorage.removeItem(game.unlockedKey);
    window.localStorage.removeItem(game.saveKey);
    window.localStorage.removeItem(game.achievementKey);
  });
}
