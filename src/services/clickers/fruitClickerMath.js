import { fruitClickerRegistryById } from "../../data/fruitClickerRegistry";
import {
  getFruitCount,
  getFruitTotalEarned,
  withFruitCount,
} from "./fruitClickerStorage";

function levelOf(state, upgradeId) {
  return Number(state?.upgrades?.[upgradeId] || 0);
}

function numberOr(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function nextStateWithTimestamps(state, now) {
  const isoNow = now.toISOString();
  return {
    ...state,
    updatedAt: isoNow,
    lastUpdatedAt: isoNow,
  };
}

function ascensionMultiplier(state) {
  return Math.pow(2, Math.max(0, numberOr(state?.ascensionLevel, 0)));
}

function ascensionCostMultiplier(state) {
  return Math.pow(1.15, Math.max(0, numberOr(state?.ascensionLevel, 0)));
}

function isAutoProductionDisabled(state, nowInput = new Date()) {
  const disabledUntil = state?.eventModifiers?.autoClickersDisabledUntil;
  if (!disabledUntil) return false;
  return new Date(disabledUntil).getTime() > new Date(nowInput).getTime();
}

function upgradeNumber(upgrade, key, fallback = 0) {
  return numberOr(upgrade?.[key], fallback);
}

function getGlobalMultiplier(upgrade, level) {
  if (level <= 0) return 1;
  if (upgrade.globalMultiplier) return Math.pow(numberOr(upgrade.globalMultiplier, 1), level);
  return 1;
}

function getClickMultiplier(upgrade, level) {
  if (level <= 0) return 1;
  if (upgrade.clickMultiplier) return Math.pow(numberOr(upgrade.clickMultiplier, 1), level);
  return 1;
}

export function calculateFruitPerClick(gameId, state = {}) {
  const game = fruitClickerRegistryById[gameId];
  const upgrades = game?.upgrades || [];
  let baseClick = 1;
  let clickMultiplier = 1;
  let globalMultiplier = 1;

  upgrades.forEach((upgrade) => {
    const level = levelOf(state, upgrade.id);
    if (upgrade.type === "clickPower") baseClick += level * upgradeNumber(upgrade, "clickPower", 1);
    if (upgrade.type === "clickPowerFlat") baseClick += level * upgradeNumber(upgrade, "clickPowerFlat", 5);
    if (upgrade.type === "clickPowerMultiplier") clickMultiplier *= getClickMultiplier(upgrade, level);
    if (upgrade.type === "globalMultiplier") globalMultiplier *= getGlobalMultiplier(upgrade, level);
  });

  return baseClick * clickMultiplier * globalMultiplier * ascensionMultiplier(state);
}

export function calculateFruitPerSecond(gameId, state = {}, now = new Date()) {
  if (isAutoProductionDisabled(state, now)) return 0;

  const game = fruitClickerRegistryById[gameId];
  const upgrades = game?.upgrades || [];
  let baseAuto = 0;
  let autoMultiplier = 1;
  let globalMultiplier = 1;

  upgrades.forEach((upgrade) => {
    const level = levelOf(state, upgrade.id);
    if (upgrade.type === "autoClicker") baseAuto += level * upgradeNumber(upgrade, "autoPerSecond", 0);
    if (upgrade.type === "autoClickerBoost") autoMultiplier += level * upgradeNumber(upgrade, "autoMultiplierBonus", 0.1);
    if (upgrade.type === "globalMultiplier") globalMultiplier *= getGlobalMultiplier(upgrade, level);
  });

  return baseAuto * autoMultiplier * globalMultiplier * ascensionMultiplier(state);
}

export function calculateFruitUpgradeCost(gameId, upgrade, currentLevel = 0, state = null) {
  if (!upgrade) return Number.POSITIVE_INFINITY;
  return Math.floor(
    numberOr(upgrade.baseCost, 0)
      * Math.pow(numberOr(upgrade.costMultiplier, 1), numberOr(currentLevel, 0))
      * ascensionCostMultiplier(state),
  );
}

export function canAffordFruitUpgrade(gameId, state, upgrade) {
  if (!upgrade) return false;
  const level = levelOf(state, upgrade.id);
  if (upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel) return false;
  return getFruitCount(gameId, state) >= calculateFruitUpgradeCost(gameId, upgrade, level, state);
}

export function applyFruitOfflineProgress(gameId, state, nowInput = new Date()) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const normalizedState = state || {};
  const previousStamp = normalizedState.lastUpdatedAt || normalizedState.updatedAt || normalizedState.createdAt || now.toISOString();
  const elapsedMs = Math.max(0, now.getTime() - new Date(previousStamp).getTime());
  const elapsedSeconds = elapsedMs / 1000;

  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return {
      state: nextStateWithTimestamps(normalizedState, now),
      gained: 0,
      elapsedSeconds: 0,
    };
  }

  const perSecond = calculateFruitPerSecond(gameId, normalizedState, now);
  const gained = perSecond * elapsedSeconds;
  const nextCount = getFruitCount(gameId, normalizedState) + gained;
  const nextTotal = getFruitTotalEarned(gameId, normalizedState) + gained;
  const nextState = nextStateWithTimestamps(withFruitCount(gameId, normalizedState, nextCount, nextTotal), now);

  return {
    state: nextState,
    gained,
    elapsedSeconds,
  };
}

export function clickFruitState(gameId, state, nowInput = new Date()) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const progressed = applyFruitOfflineProgress(gameId, state, now).state;
  const gained = calculateFruitPerClick(gameId, progressed);
  const nextCount = getFruitCount(gameId, progressed) + gained;
  const nextTotal = getFruitTotalEarned(gameId, progressed) + gained;
  return {
    state: nextStateWithTimestamps({
      ...withFruitCount(gameId, progressed, nextCount, nextTotal),
      unlocked: true,
      totalClicks: numberOr(progressed.totalClicks, 0) + 1,
    }, now),
    gained,
  };
}

export function purchaseFruitUpgrade(gameId, state, upgrade, { isTargetUnlocked = () => false } = {}) {
  if (!upgrade) return { purchased: false, state };
  if (upgrade.type === "unlockClicker" && upgrade.unlocksGameId && isTargetUnlocked(upgrade.unlocksGameId)) {
    return { purchased: false, state, alreadyUnlocked: true };
  }

  const level = levelOf(state, upgrade.id);
  if (upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel) {
    return { purchased: false, state };
  }

  const cost = calculateFruitUpgradeCost(gameId, upgrade, level, state);
  if (getFruitCount(gameId, state) < cost) return { purchased: false, state };

  const now = new Date();
  const nextCount = getFruitCount(gameId, state) - cost;
  const nextEventModifiers = upgrade.type === "eventSwap"
    ? {
        ...(state.eventModifiers || {}),
        lemonsDisabled: Array.isArray(upgrade.disablesEvents) && upgrade.disablesEvents.includes("lemon")
          ? true
          : Boolean(state.eventModifiers?.lemonsDisabled),
        eggplantsEnabled: Array.isArray(upgrade.enablesEvents) && upgrade.enablesEvents.includes("eggplant")
          ? true
          : Boolean(state.eventModifiers?.eggplantsEnabled),
      }
    : state.eventModifiers;

  const nextState = nextStateWithTimestamps({
    ...withFruitCount(gameId, state, nextCount, getFruitTotalEarned(gameId, state)),
    eventModifiers: nextEventModifiers,
    upgrades: {
      ...(state.upgrades || {}),
      [upgrade.id]: level + 1,
    },
  }, now);

  return {
    purchased: true,
    cost,
    state: nextState,
    unlockedGameId: upgrade.type === "unlockClicker" ? upgrade.unlocksGameId : null,
  };
}
