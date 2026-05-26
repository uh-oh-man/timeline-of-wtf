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

function upgradeLevel(state, upgradeId) {
  return Number(state?.upgrades?.[upgradeId] || 0);
}

function randomOverlayPosition() {
  return {
    xPercent: randomBetween(12, 88),
    yPercent: randomBetween(16, 78),
  };
}

export function createInitialFruitEventState(now = new Date()) {
  return {
    lemon: null,
    orange: null,
    eggplant: null,
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

export function computeOrangeBoost(fruitState = {}, now = new Date(), limeState = null) {
  const orange = fruitState?.orange;
  if (!orange?.activeUntil) return 1;
  const boostLevel = upgradeLevel(limeState, "orangeNegotiator");
  return nowMs(now) <= nowMs(orange.activeUntil)
    ? LIME_FRUIT_EVENTS_CONFIG.orangeBoostMultiplier + boostLevel * 0.05
    : 1;
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

export function clearExpiredEggplant(fruitState = {}, limeState = null, now = new Date()) {
  if (!fruitState?.eggplant?.activeUntil) {
    return { fruitState, limeState, expiredNaturally: false };
  }
  if (nowMs(now) <= nowMs(fruitState.eggplant.activeUntil)) {
    return { fruitState, limeState, expiredNaturally: false };
  }

  const bonus = Number(limeState?.eventModifiers?.eggplantSpawnChanceBonus || 0);
  return {
    fruitState: {
      ...fruitState,
      eggplant: null,
      lastUpdatedAt: now.toISOString(),
    },
    limeState: limeState
      ? {
          ...limeState,
          eventModifiers: {
            ...(limeState.eventModifiers || {}),
            eggplantSpawnChanceBonus: bonus + 0.01,
            autoClickersDisabledUntil: null,
          },
          updatedAt: now.toISOString(),
        }
      : limeState,
    expiredNaturally: true,
  };
}

export function applyEggplantSpawnEffect(limeState, fruitState, now = new Date()) {
  if (!limeState || !fruitState?.eggplant?.activeUntil) return limeState;
  return {
    ...limeState,
    eventModifiers: {
      ...(limeState.eventModifiers || {}),
      autoClickersDisabledUntil: fruitState.eggplant.activeUntil,
    },
    updatedAt: now.toISOString(),
  };
}

export function maybeSpawnFruitEvent(fruitState = {}, { unlocked = false, now = new Date(), limeState = null } = {}) {
  const baseState = fruitState && typeof fruitState === "object" ? fruitState : createInitialFruitEventState(now);
  if (!unlocked) return baseState;
  const cleanedOrange = clearExpiredOrange(baseState, now);
  const { fruitState: cleaned, limeState: cleanedLimeState } = clearExpiredEggplant(cleanedOrange, limeState, now);
  const nextRollAt = cleaned.nextRollAt ? nowMs(cleaned.nextRollAt) : nowMs(now);
  const currentMs = nowMs(now);
  if (currentMs < nextRollAt) return cleaned;

  const roll = Math.random();
  let nextState = { ...cleaned };
  const effectiveLimeState = cleanedLimeState || limeState;
  const lemonsDisabled = Boolean(effectiveLimeState?.eventModifiers?.lemonsDisabled);
  const eggplantsEnabled = Boolean(effectiveLimeState?.eventModifiers?.eggplantsEnabled);
  const lemonChance = lemonsDisabled ? 0 : LIME_FRUIT_EVENTS_CONFIG.lemonSpawnChance;
  const eggplantChance = eggplantsEnabled
    ? LIME_FRUIT_EVENTS_CONFIG.eggplantBaseSpawnChance + Number(effectiveLimeState?.eventModifiers?.eggplantSpawnChanceBonus || 0)
    : 0;

  if (!lemonsDisabled && !nextState.lemon && roll < lemonChance) {
    nextState = {
      ...nextState,
      lemon: {
        id: buildFruitId(FRUIT_EVENT_TYPES.LEMON),
        startedAt: now.toISOString(),
        lastStealAt: now.toISOString(),
        position: randomOverlayPosition(),
      },
    };
  } else if (
    !nextState.eggplant
    && eggplantsEnabled
    && roll < lemonChance + eggplantChance
  ) {
    const activeUntil = new Date(currentMs + LIME_FRUIT_EVENTS_CONFIG.eggplantDurationSeconds * 1000).toISOString();
    nextState = {
      ...nextState,
      eggplant: {
        id: buildFruitId(FRUIT_EVENT_TYPES.EGGPLANT),
        startedAt: now.toISOString(),
        activeUntil,
        position: randomOverlayPosition(),
      },
    };
  } else if (roll < lemonChance + eggplantChance + LIME_FRUIT_EVENTS_CONFIG.orangeSpawnChance) {
    const orangeNegotiatorLevel = upgradeLevel(limeState, "orangeNegotiator");
    const orangeButlerLevel = upgradeLevel(limeState, "orangeButler");
    const durationSeconds = LIME_FRUIT_EVENTS_CONFIG.orangeDurationSeconds + orangeNegotiatorLevel * 5;
    const autoClicked = orangeButlerLevel > 0 && Math.random() < 0.5;
    nextState = {
      ...nextState,
      orange: {
        id: buildFruitId(FRUIT_EVENT_TYPES.ORANGE),
        startedAt: now.toISOString(),
        activeUntil: new Date(currentMs + durationSeconds * 1000).toISOString(),
        position: randomOverlayPosition(),
        autoClicked,
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
    const defenseLevel = upgradeLevel(limeState, "fruitTaxLoophole");
    const stealRatio = Math.max(0, LIME_FRUIT_EVENTS_CONFIG.lemonStealRatio - defenseLevel * 0.05);
    const stolen = nextCount * stealRatio;
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

export function clearEggplantEvent(fruitState = {}, limeState = null, now = new Date()) {
  return {
    fruitState: {
      ...fruitState,
      eggplant: null,
      lastUpdatedAt: now.toISOString(),
    },
    limeState: limeState
      ? {
          ...limeState,
          eventModifiers: {
            ...(limeState.eventModifiers || {}),
            autoClickersDisabledUntil: null,
          },
          updatedAt: now.toISOString(),
        }
      : limeState,
  };
}
