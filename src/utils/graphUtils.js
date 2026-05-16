import { getGameNames, normalizeText } from "./helpers";

function linkKey(a, b) {
  return [normalizeText(a), normalizeText(b)].sort().join("::");
}

export function buildGameGraph(disasters) {
  const games = getGameNames(disasters);
  const gameSet = new Set(games.map(normalizeText));
  const linkMap = new Map();

  disasters.forEach((disaster) => {
    const source = String(disaster.source || "").trim();
    if (!source) return;

    (disaster.directConnections || []).forEach((target) => {
      const targetName = String(target || "").trim();
      if (!targetName || normalizeText(targetName) === normalizeText(source)) return;

      if (!gameSet.has(normalizeText(targetName))) {
        gameSet.add(normalizeText(targetName));
        games.push(targetName);
      }

      const key = linkKey(source, targetName);
      if (!linkMap.has(key)) {
        linkMap.set(key, { source, target: targetName });
      }
    });
  });

  const width = 900;
  const height = 560;
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = 300;
  const radiusY = 185;

  const nodes = games.map((name, index) => {
    const angle = games.length <= 1 ? -Math.PI / 2 : (index / games.length) * Math.PI * 2 - Math.PI / 2;
    const wobble = index % 2 === 0 ? 1 : 0.84;

    return {
      id: name,
      label: name,
      x: centerX + Math.cos(angle) * radiusX * wobble,
      y: centerY + Math.sin(angle) * radiusY * wobble,
    };
  });

  return {
    width,
    height,
    nodes,
    links: [...linkMap.values()],
  };
}
