export const commonFruitUpgrades = [
  {
    id: "orangeButler",
    name: "Orange Butler",
    description: "A suspicious cursor may auto-click oranges before anyone asks questions.",
    baseCost: 2500000,
    costMultiplier: 2.05,
    maxLevel: 1,
    type: "orangeAutoClicker",
    orangeAutoClickChance: 0.5,
    effect: "50% chance to auto-click Orange events with a tiny mouse animation",
  },
  {
    id: "lemonExileProtocol",
    name: "Lemon Exile Protocol",
    description: "Disables lemons, but enables eggplants. This is not an improvement. This is a different problem.",
    baseCost: 10000000000,
    costMultiplier: 1,
    maxLevel: 1,
    type: "eventSwap",
    effect: "Disables lemon events and enables rare Eggplant Jam events",
    disablesEvents: ["lemon"],
    enablesEvents: ["eggplant"],
  },
];

export const commonFruitUpgradesById = commonFruitUpgrades.reduce((registry, upgrade) => {
  registry[upgrade.id] = upgrade;
  return registry;
}, {});
