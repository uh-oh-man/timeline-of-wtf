import { FRUIT_EVENT_TYPES, LIME_FRUIT_EVENTS_CONFIG } from "../../data/limeFruitEvents";

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function nowMs(value = new Date()) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function buildFruitId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialFruitEventState(now = new Date()) {
  return {
    lemon: null,
    orange: null,
    nextRollAt: scheduleNextFruitRollAt(now),
    lastUpdatedAt: now.toISOString(),
  };
}

export function scheduleNextFruitRollAt(now = new Date()) {
  const current = nowMs(now);
  const seconds = randomBetween(
    LIME_FRUIT_EVENTS_CONFIG.minRollSeconds,
    LIME_FRUIT_EVENTS_CONFIG.maxRollSeconds,
  );
  return new Date(current + seconds * 1000).toISOString();
}

export function computeOrangeBoost(fruitState = {}, now = new Date()) {
  const orange = fruitState?.orange;
  if (!orange?.activeUntil) return 1;
  return nowMs(now) <= nowMs(orange.activeUntil) ? LIME_FRUIT_EVENTS_CONFIG.orangeBoostMultiplier : 1;
}

export function clearExpiredOrange(fruitState = {}, now = new Date()) {
  if (!fruitState?.orange?.activeUntil) return fruitState;
  if (nowMs(now) <= nowMs(fruitState.orange.activeUntil)) return fruitState;
  return {
    ...fruitState,
    orange: null,
    lastUpdatedAt: now.toISOString(),
  };
}

export function maybeSpawnFruitEvent(fruitState = {}, { unlocked = false, now = new Date() } = {}) {
  const baseState = fruitState && typeof fruitState === "object" ? fruitState : createInitialFruitEventState(now);
  if (!unlocked) return baseState;
  const cleaned = clearExpiredOrange(baseState, now);
  const nextRollAt = cleaned.nextRollAt ? nowMs(cleaned.nextRollAt) : nowMs(now);
  const currentMs = nowMs(now);
  if (currentMs < nextRollAt) return cleaned;

  const roll = Math.random();
  let nextState = { ...cleaned };
  if (!nextState.lemon && roll < LIME_FRUIT_EVENTS_CONFIG.lemonSpawnChance) {
    nextState = {
      ...nextState,
      lemon: {
        id: buildFruitId(FRUIT_EVENT_TYPES.LEMON),
        startedAt: now.toISOString(),
        lastStealAt: now.toISOString(),
      },
    };
  } else if (roll < LIME_FRUIT_EVENTS_CONFIG.lemonSpawnChance + LIME_FRUIT_EVENTS_CONFIG.orangeSpawnChance) {
    nextState = {
      ...nextState,
      orange: {
        id: buildFruitId(FRUIT_EVENT_TYPES.ORANGE),
        startedAt: now.toISOString(),
        activeUntil: new Date(
          currentMs + LIME_FRUIT_EVENTS_CONFIG.orangeDurationSeconds * 1000,
        ).toISOString(),
      },
    };
  }

  return {
    ...nextState,
    nextRollAt: scheduleNextFruitRollAt(now),
    lastUpdatedAt: now.toISOString(),
  };
}

export function applyLemonSteal(limeState, fruitState, now = new Date()) {
  if (!fruitState?.lemon) return { limeState, fruitState, changed: false, enteredDebt: false };
  const lemon = fruitState.lemon;
  const lastTick = lemon.lastStealAt ? nowMs(lemon.lastStealAt) : nowMs(now);
  const elapsedMs = Math.max(0, nowMs(now) - lastTick);
  const tickLength = LIME_FRUIT_EVENTS_CONFIG.lemonStealIntervalSeconds * 1000;
  const tickCount = Math.floor(elapsedMs / tickLength);
  if (tickCount <= 0) return { limeState, fruitState, changed: false, enteredDebt: false };

  let nextCount = Number(limeState?.limeCount || 0);
  let enteredDebt = false;

  for (let index = 0; index < tickCount; index += 1) {
    const stolen = nextCount * LIME_FRUIT_EVENTS_CONFIG.lemonStealRatio;
    nextCount -= stolen;
    if (nextCount <= 0) {
      const debtChance = randomBetween(
        LIME_FRUIT_EVENTS_CONFIG.lemonDebtChanceMin,
        LIME_FRUIT_EVENTS_CONFIG.lemonDebtChanceMax,
      );
      if (Math.random() <= debtChance) {
        const debtAmount = randomBetween(1, 6);
        nextCount -= debtAmount;
        enteredDebt = true;
      } else {
        nextCount = 0;
      }
    }
  }

  return {
    limeState: {
      ...limeState,
      limeCount: nextCount,
      updatedAt: now.toISOString(),
    },
    fruitState: {
      ...fruitState,
      lemon: {
        ...lemon,
        lastStealAt: now.toISOString(),
      },
      lastUpdatedAt: now.toISOString(),
    },
    changed: true,
    enteredDebt,
  };
}

export function clearLemonEvent(fruitState = {}, now = new Date()) {
  return {
    ...fruitState,
    lemon: null,
    lastUpdatedAt: now.toISOString(),
  };
}
