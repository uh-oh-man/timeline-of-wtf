export const CUSTOM_OPTION = "__custom__";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function uniqueByName(items) {
  const seen = new Set();

  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function getGameNames(disasters) {
  return uniqueByName(disasters.map((disaster) => disaster.source)).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function getGameStats(disasters) {
  return getGameNames(disasters)
    .map((name) => ({
      name,
      count: disasters.filter((disaster) => normalizeText(disaster.source) === normalizeText(name)).length,
      firstYear: getGameYear(disasters, name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getGameYear(disasters, gameName) {
  const target = normalizeText(gameName);
  const matchingYears = disasters
    .filter((disaster) => normalizeText(disaster.source) === target)
    .map((disaster) => String(disaster.year || "").trim())
    .filter(Boolean)
    .sort(compareYears);

  return matchingYears[0] || "";
}

export function compareYears(a, b) {
  const yearA = parseInt(String(a || "").match(/-?\d+/)?.[0] || "", 10);
  const yearB = parseInt(String(b || "").match(/-?\d+/)?.[0] || "", 10);

  if (Number.isFinite(yearA) && Number.isFinite(yearB) && yearA !== yearB) {
    return yearA - yearB;
  }

  return String(a || "").localeCompare(String(b || ""));
}

export function sortDisasters(disasters) {
  return [...disasters].sort((a, b) => {
    const yearOrder = compareYears(a.year, b.year);
    if (yearOrder !== 0) return yearOrder;
    const orderA = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
    const orderB = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

export function groupDisastersByYear(disasters) {
  const groups = [];
  const groupsByYear = new Map();

  sortDisasters(disasters).forEach((disaster) => {
    const year = String(disaster.year || "Unknown").trim() || "Unknown";
    if (!groupsByYear.has(year)) {
      const group = { year, disasters: [] };
      groupsByYear.set(year, group);
      groups.push(group);
    }

    groupsByYear.get(year).disasters.push(disaster);
  });

  return groups;
}

export function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function joinLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}
