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

function isAutoProductionDisabled(state, nowInput = new Date()) {
  const disabledUntil = state?.eventModifiers?.autoClickersDisabledUntil;
  if (!disabledUntil) return false;
  return new Date(disabledUntil).getTime() > new Date(nowInput).getTime();
}

function ascensionMultiplier(state) {
  const level = Math.max(0, Number(state?.ascensionLevel || 0));
  return Math.pow(2, level);
}

function ascensionCostMultiplier(state) {
  const level = Math.max(0, Number(state?.ascensionLevel || 0));
  return Math.pow(1.15, level);
}

export function calculateLimesPerClick(state) {
  const betterSqueezeLevel = levelOf(state, "betterSqueeze");
  const zestGrinderLevel = levelOf(state, "zestGrinder");
  const quantumCitrusTapperLevel = levelOf(state, "quantumCitrusTapper");
  const forbiddenZestLevel = levelOf(state, "forbiddenZest");
  const sourStockMarketLevel = levelOf(state, "sourStockMarket");
  const recursiveLimePrinterLevel = levelOf(state, "recursiveLimePrinter");
  const baseClickPower = 1 + betterSqueezeLevel + zestGrinderLevel * 5;
  const clickMultiplier = Math.pow(1.25, quantumCitrusTapperLevel);
  const globalMultiplier =
    Math.pow(1.1, forbiddenZestLevel)
    * Math.pow(1.2, sourStockMarketLevel)
    * Math.pow(1.35, recursiveLimePrinterLevel);
  return baseClickPower * clickMultiplier * globalMultiplier * ascensionMultiplier(state);
}

export function calculateLimesPerSecond(state, now = new Date()) {
  if (isAutoProductionDisabled(state, now)) return 0;

  const tinyLimeInternLevel = levelOf(state, "tinyLimeIntern");
  const limePressLevel = levelOf(state, "limePress");
  const limeAssemblyLineLevel = levelOf(state, "limeAssemblyLine");
  const peelDimensionLevel = levelOf(state, "peelDimension");
  const citrusMotivationalSeminarLevel = levelOf(state, "citrusMotivationalSeminar");
  const citrusUnionLevel = levelOf(state, "citrusUnion");
  const forbiddenZestLevel = levelOf(state, "forbiddenZest");
  const sourStockMarketLevel = levelOf(state, "sourStockMarket");
  const recursiveLimePrinterLevel = levelOf(state, "recursiveLimePrinter");

  const baseAutoPerSecond =
    tinyLimeInternLevel * 0.2
    + limePressLevel * 1.5
    + limeAssemblyLineLevel * 15
    + peelDimensionLevel * 150;
  const autoMultiplier = 1 + citrusMotivationalSeminarLevel * 0.1 + citrusUnionLevel * 0.25;
  const globalMultiplier =
    Math.pow(1.1, forbiddenZestLevel)
    * Math.pow(1.2, sourStockMarketLevel)
    * Math.pow(1.35, recursiveLimePrinterLevel);
  return baseAutoPerSecond * autoMultiplier * globalMultiplier * ascensionMultiplier(state);
}

export function calculateUpgradeCost(upgrade, currentLevel = 0, state = null) {
  if (!upgrade) return Number.POSITIVE_INFINITY;
  return Math.floor(
    Number(upgrade.baseCost || 0)
      * Math.pow(Number(upgrade.costMultiplier || 1), Number(currentLevel || 0))
      * ascensionCostMultiplier(state),
  );
}

export function canAffordUpgrade(state, upgrade) {
  if (!upgrade) return false;
  const level = levelOf(state, upgrade.id);
  if (upgrade.maxLevel !== null && upgrade.maxLevel !== undefined && level >= upgrade.maxLevel) return false;
  return Number(state?.limeCount || 0) >= calculateUpgradeCost(upgrade, level, state);
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

  const disabledUntil = state?.eventModifiers?.autoClickersDisabledUntil
    ? new Date(state.eventModifiers.autoClickersDisabledUntil).getTime()
    : 0;
  const previousMs = new Date(previousStamp).getTime();
  const effectiveStartMs = disabledUntil > previousMs ? Math.max(disabledUntil, previousMs) : previousMs;
  const effectiveElapsedSeconds = Math.max(0, (now.getTime() - effectiveStartMs) / 1000);
  const limesPerSecond = calculateLimesPerSecond(state, now);
  const gainedLimes = limesPerSecond * Math.min(elapsedSeconds, effectiveElapsedSeconds);
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
  const cost = calculateUpgradeCost(upgrade, level, state);
  if (Number(state?.limeCount || 0) < cost) {
    return { purchased: false, state };
  }

  const now = new Date();
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
    ...state,
    limeCount: Number(state?.limeCount || 0) - cost,
    eventModifiers: nextEventModifiers,
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

export function getAscensionMultiplier(state) {
  return ascensionMultiplier(state);
}

export function getAscensionCostMultiplier(state) {
  return ascensionCostMultiplier(state);
}
