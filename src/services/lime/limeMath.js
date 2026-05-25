import { limeUpgradesById } from "../../data/limeUpgrades";

function levelOf(state, upgradeId) {
  return Number(state?.upgrades?.[upgradeId] || 0);
}

function nextStateWithTimestamps(state, now) {
  const isoNow = now.toISOString();
  return {
    ...state,
    updatedAt: isoNow,
    lastUpdatedAt: isoNow,
  };
}

export function calculateLimesPerClick(state) {
  const betterSqueezeLevel = levelOf(state, "betterSqueeze");
  const forbiddenZestLevel = levelOf(state, "forbiddenZest");
  const baseClickPower = 1 + betterSqueezeLevel;
  const globalMultiplier = Math.pow(1.1, forbiddenZestLevel);
  return baseClickPower * globalMultiplier;
}

export function calculateLimesPerSecond(state) {
  const tinyLimeInternLevel = levelOf(state, "tinyLimeIntern");
  const limePressLevel = levelOf(state, "limePress");
  const citrusMotivationalSeminarLevel = levelOf(state, "citrusMotivationalSeminar");
  const forbiddenZestLevel = levelOf(state, "forbiddenZest");

  const baseAutoPerSecond = tinyLimeInternLevel * 0.2 + limePressLevel * 1.5;
  const autoMultiplier = 1 + citrusMotivationalSeminarLevel * 0.1;
  const globalMultiplier = Math.pow(1.1, forbiddenZestLevel);
  return baseAutoPerSecond * autoMultiplier * globalMultiplier;
}

export function calculateUpgradeCost(upgrade, currentLevel = 0) {
  if (!upgrade) return Number.POSITIVE_INFINITY;
  return Math.floor(Number(upgrade.baseCost || 0) * Math.pow(Number(upgrade.costMultiplier || 1), Number(currentLevel || 0)));
}

export function canAffordUpgrade(state, upgrade) {
  if (!upgrade) return false;
  const level = levelOf(state, upgrade.id);
  if (upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel) return false;
  return Number(state?.limeCount || 0) >= calculateUpgradeCost(upgrade, level);
}

export function applyOfflineProgress(state, nowInput = new Date()) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const previousStamp = state?.lastUpdatedAt || state?.updatedAt || state?.createdAt || now.toISOString();
  const elapsedMs = Math.max(0, now.getTime() - new Date(previousStamp).getTime());
  const elapsedSeconds = elapsedMs / 1000;
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return {
      state: nextStateWithTimestamps(state, now),
      gainedLimes: 0,
      elapsedSeconds: 0,
    };
  }

  const limesPerSecond = calculateLimesPerSecond(state);
  const gainedLimes = limesPerSecond * elapsedSeconds;
  const nextState = nextStateWithTimestamps({
    ...state,
    limeCount: Number(state?.limeCount || 0) + gainedLimes,
    totalLimesEarned: Number(state?.totalLimesEarned || 0) + gainedLimes,
  }, now);

  return {
    state: nextState,
    gainedLimes,
    elapsedSeconds,
  };
}

export function purchaseUpgrade(state, upgrade) {
  if (!upgrade) return { purchased: false, state };
  const level = levelOf(state, upgrade.id);
  if (upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel) {
    return { purchased: false, state };
  }
  const cost = calculateUpgradeCost(upgrade, level);
  if (Number(state?.limeCount || 0) < cost) {
    return { purchased: false, state };
  }

  const now = new Date();
  const nextState = nextStateWithTimestamps({
    ...state,
    limeCount: Number(state?.limeCount || 0) - cost,
    upgrades: {
      ...state.upgrades,
      [upgrade.id]: level + 1,
    },
  }, now);

  return {
    purchased: true,
    cost,
    state: nextState,
  };
}

export function getUpgradeById(upgradeId) {
  return limeUpgradesById[upgradeId] || null;
}
