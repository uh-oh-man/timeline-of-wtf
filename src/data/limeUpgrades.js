export const limeUpgrades = [
  {
    id: "betterSqueeze",
    name: "Better Squeeze",
    description: "More juice per click.",
    baseCost: 25,
    costMultiplier: 1.35,
    maxLevel: null,
    type: "clickPower",
    effect: "+1 lime per click per level",
  },
  {
    id: "tinyLimeIntern",
    name: "Tiny Lime Intern",
    description: "Clicks the lime with questionable enthusiasm.",
    baseCost: 50,
    costMultiplier: 1.45,
    maxLevel: null,
    type: "autoClicker",
    effect: "+0.2 limes/second per level",
  },
  {
    id: "limePress",
    name: "Lime Press",
    description: "Industrializes the citrus problem.",
    baseCost: 250,
    costMultiplier: 1.5,
    maxLevel: null,
    type: "autoClicker",
    effect: "+1.5 limes/second per level",
  },
  {
    id: "citrusMotivationalSeminar",
    name: "Citrus Motivational Seminar",
    description: "The limes are now inspired.",
    baseCost: 500,
    costMultiplier: 1.65,
    maxLevel: null,
    type: "autoClickerBoost",
    effect: "Auto production +10% per level",
  },
  {
    id: "forbiddenZest",
    name: "Forbidden Zest",
    description: "Nobody knows what this does, but the number goes up.",
    baseCost: 1500,
    costMultiplier: 1.8,
    maxLevel: null,
    type: "globalMultiplier",
    effect: "Global production x1.1 per level",
  },
];

export const limeUpgradesById = limeUpgrades.reduce((accumulator, upgrade) => {
  accumulator[upgrade.id] = upgrade;
  return accumulator;
}, {});
