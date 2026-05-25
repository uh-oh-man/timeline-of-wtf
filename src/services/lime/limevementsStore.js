const LIMEVEMENTS_KEY = "twtaf:limevements";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function nowIso() {
  return new Date().toISOString();
}

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function createDefaultLimevementsState() {
  return {
    unlocked: {},
    unlockedAt: {},
  };
}

export function normalizeLimevementsState(state) {
  const source = state && typeof state === "object" ? state : {};
  return {
    unlocked: source.unlocked && typeof source.unlocked === "object" ? source.unlocked : {},
    unlockedAt: source.unlockedAt && typeof source.unlockedAt === "object" ? source.unlockedAt : {},
  };
}

export function loadLimevementsState() {
  if (!canUseStorage()) return createDefaultLimevementsState();
  const parsed = safeParse(window.localStorage.getItem(LIMEVEMENTS_KEY), createDefaultLimevementsState());
  return normalizeLimevementsState(parsed);
}

export function saveLimevementsState(state) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LIMEVEMENTS_KEY, JSON.stringify(normalizeLimevementsState(state)));
}

export function unlockLimevement(currentState, limevementId) {
  const normalized = normalizeLimevementsState(currentState);
  if (normalized.unlocked[limevementId]) return normalized;
  const next = {
    ...normalized,
    unlocked: {
      ...normalized.unlocked,
      [limevementId]: true,
    },
    unlockedAt: {
      ...normalized.unlockedAt,
      [limevementId]: nowIso(),
    },
  };
  saveLimevementsState(next);
  return next;
}

export function resetLimevementsState() {
  const next = createDefaultLimevementsState();
  saveLimevementsState(next);
  return next;
}

export { LIMEVEMENTS_KEY };
