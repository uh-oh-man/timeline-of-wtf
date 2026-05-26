export const miniGameRegistry = [
  {
    id: "lime",
    name: "Lime",
    discoveredKey: "twtaf:limeUnlocked",
    saveKey: "twtaf:limeClicker",
    achievementKey: "twtaf:limevements",
    exportVersion: 1,
  },
  {
    id: "apple",
    name: "Apple",
    discoveredKey: "twtaf:appleUnlocked",
    saveKey: "twtaf:appleClicker",
    achievementKey: "twtaf:applevements",
    exportVersion: 1,
  },
  {
    id: "blueberry",
    name: "Blueberry",
    discoveredKey: "twtaf:blueberryUnlocked",
    saveKey: "twtaf:blueberryClicker",
    achievementKey: "twtaf:blueberryvements",
    exportVersion: 1,
  },
  {
    id: "charries",
    name: "Charries",
    discoveredKey: "twtaf:charriesUnlocked",
    saveKey: "twtaf:charriesClicker",
    achievementKey: "twtaf:charriesvements",
    exportVersion: 1,
  },
];

export const miniGameRegistryById = miniGameRegistry.reduce((registry, game) => {
  registry[game.id] = game;
  return registry;
}, {});
