import { fruitClickerRegistryById } from "../../data/fruitClickerRegistry";

function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function nowIso() {
  return new Date().toISOString();
}

function getCurrencyCount(gameId, fruitState = {}) {
  const game = fruitClickerRegistryById[gameId];
  const singularKey = game?.singularCurrencyName ? `${game.singularCurrencyName}Count` : null;
  const directKey = gameId ? `${gameId}Count` : null;
  return numberOrZero(
    fruitState.count
      ?? fruitState[singularKey]
      ?? fruitState[directKey]
      ?? fruitState.limeCount,
  );
}

function shouldResetRunNumberKey(key) {
  return (
    key === "count"
    || key === "totalEarned"
    || key === "totalClicks"
    || /^total[A-Z].*Earned$/.test(key)
    || /^[a-z][A-Za-z]*Count$/.test(key)
  );
}

export function getAscensionCost(gameId, fruitState = {}) {
  const config = fruitClickerRegistryById[gameId]?.ascension || {};
  const baseCost = numberOrZero(config.baseCost) || 1000000000;
  const multiplier = numberOrZero(config.costMultiplier) || 10;
  const level = Math.max(0, numberOrZero(fruitState.ascensionLevel));
  return baseCost * Math.pow(multiplier, level);
}

export function getAscensionMultiplier(fruitState = {}) {
  return Math.pow(2, Math.max(0, numberOrZero(fruitState.ascensionLevel)));
}

export function getAscensionCostMultiplier(fruitState = {}) {
  return Math.pow(1.15, Math.max(0, numberOrZero(fruitState.ascensionLevel)));
}

export function canAscendFruit(gameId, allFruitStates = {}) {
  const state = allFruitStates?.[gameId] || {};
  return getCurrencyCount(gameId, state) >= getAscensionCost(gameId, state);
}

export function resetFruitRunStatePreservingMeta(fruitState = {}) {
  const now = nowIso();
  const ascensionLevel = numberOrZero(fruitState.ascensionLevel);
  const totalAscensions = numberOrZero(fruitState.totalAscensions);
  const resetRunNumbers = Object.fromEntries(
    Object.keys(fruitState)
      .filter(shouldResetRunNumberKey)
      .map((key) => [key, 0]),
  );

  return {
    ...fruitState,
    ...resetRunNumbers,
    upgrades: Object.fromEntries(
      Object.keys(fruitState.upgrades || {}).map((upgradeId) => [upgradeId, 0]),
    ),
    eventModifiers: {
      ...(fruitState.eventModifiers || {}),
      autoClickersDisabledUntil: null,
    },
    activeEvents: {},
    activeBoosts: {},
    debt: 0,
    ascensionLevel,
    totalAscensions,
    lastUpdatedAt: now,
    updatedAt: now,
  };
}

export function ascendFruitAndResetAll(gameId, allFruitStates = {}) {
  if (!canAscendFruit(gameId, allFruitStates)) {
    return {
      ascended: false,
      states: allFruitStates,
      reason: "not_enough_currency",
    };
  }

  const now = nowIso();
  const nextStates = Object.fromEntries(
    Object.entries(allFruitStates).map(([stateGameId, state]) => {
      const reset = resetFruitRunStatePreservingMeta(state);
      if (stateGameId !== gameId) return [stateGameId, reset];

      const nextLevel = numberOrZero(state.ascensionLevel) + 1;
      return [
        stateGameId,
        {
          ...reset,
          ascensionLevel: nextLevel,
          totalAscensions: numberOrZero(state.totalAscensions) + 1,
          lastAscendedAt: now,
          updatedAt: now,
          lastUpdatedAt: now,
        },
      ];
    }),
  );

  return {
    ascended: true,
    states: nextStates,
    selectedGameId: gameId,
    ascendedAt: now,
  };
}
