const LIME_UNLOCKED_KEY = "twtaf:limeUnlocked";
const LIME_CLICKER_KEY = "twtaf:limeClicker";

export { LIME_UNLOCKED_KEY, LIME_CLICKER_KEY };

const DEFAULT_UPGRADES = {
  betterSqueeze: 0,
  tinyLimeIntern: 0,
  limePress: 0,
  citrusMotivationalSeminar: 0,
  forbiddenZest: 0,
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function nowIso() {
  return new Date().toISOString();
}

export function createDefaultLimeState() {
  const now = nowIso();
  return {
    unlocked: false,
    limeCount: 0,
    totalLimesEarned: 0,
    totalClicks: 0,
    upgrades: { ...DEFAULT_UPGRADES },
    lastUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
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

export function normalizeLimeState(state) {
  const defaults = createDefaultLimeState();
  const source = state && typeof state === "object" ? state : {};

  return {
    unlocked: Boolean(source.unlocked),
    limeCount: normalizeNumber(source.limeCount, 0),
    totalLimesEarned: normalizeNumber(source.totalLimesEarned, 0),
    totalClicks: normalizeNumber(source.totalClicks, 0),
    upgrades: {
      ...DEFAULT_UPGRADES,
      ...(source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {}),
    },
    lastUpdatedAt: source.lastUpdatedAt || defaults.lastUpdatedAt,
    createdAt: source.createdAt || defaults.createdAt,
    updatedAt: source.updatedAt || defaults.updatedAt,
  };
}

export function loadLimeUnlocked() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(LIME_UNLOCKED_KEY) === "true";
}

export function saveLimeUnlocked(value) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LIME_UNLOCKED_KEY, value ? "true" : "false");
}

export function loadLimeState() {
  if (!canUseStorage()) return createDefaultLimeState();
  const raw = window.localStorage.getItem(LIME_CLICKER_KEY);
  const parsed = safeParse(raw, null);
  const normalized = normalizeLimeState(parsed);
  if (loadLimeUnlocked()) normalized.unlocked = true;
  return normalized;
}

export function saveLimeState(state) {
  if (!canUseStorage()) return;
  const normalized = normalizeLimeState(state);
  window.localStorage.setItem(LIME_CLICKER_KEY, JSON.stringify(normalized));
  saveLimeUnlocked(Boolean(normalized.unlocked));
}

export function resetLimeState() {
  const reset = createDefaultLimeState();
  saveLimeUnlocked(false);
  saveLimeState(reset);
  return reset;
}
