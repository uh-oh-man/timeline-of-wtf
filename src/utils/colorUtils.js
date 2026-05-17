import { normalizeText } from "./helpers";

export const DEFAULT_ACCENT_COLOR = "#38bdf8";
export const FALLBACK_NODE_COLORS = ["#38bdf8", "#ef4444"];

const CONTROLLED_ACCENT_PALETTE = [
  "#22d3ee",
  "#ef4444",
  "#a78bfa",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
];

function expandShortHex(color) {
  return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
}

export function isValidHexColor(color) {
  return typeof color === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());
}

export function normalizeHexColor(color) {
  if (!isValidHexColor(color)) return "";
  const value = color.trim();
  return value.length === 4 ? expandShortHex(value) : value.toLowerCase();
}

function hexToRgb(color) {
  const normalized = normalizeHexColor(color);
  if (!normalized) return null;

  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hashString(value) {
  return normalizeText(value)
    .split("")
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

export function getReadableTextColor(backgroundColor) {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "#ffffff";

  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);

  return luminance > 0.55 ? "#09090b" : "#ffffff";
}

export function mixHexColors(colorA, colorB, weight = 0.5) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);

  if (!rgbA && !rgbB) return DEFAULT_ACCENT_COLOR;
  if (!rgbA) return normalizeHexColor(colorB) || DEFAULT_ACCENT_COLOR;
  if (!rgbB) return normalizeHexColor(colorA) || DEFAULT_ACCENT_COLOR;

  const clampedWeight = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: rgbA.r * (1 - clampedWeight) + rgbB.r * clampedWeight,
    g: rgbA.g * (1 - clampedWeight) + rgbB.g * clampedWeight,
    b: rgbA.b * (1 - clampedWeight) + rgbB.b * clampedWeight,
  });
}

export function getFallbackAccentColor(seed = "") {
  const hash = Math.abs(hashString(seed || "timeline-disaster"));
  return CONTROLLED_ACCENT_PALETTE[hash % CONTROLLED_ACCENT_PALETTE.length] || DEFAULT_ACCENT_COLOR;
}

export function getEventAccentColor(event, fallbackSeed = "") {
  const customColor = normalizeHexColor(event?.accentColor);
  if (customColor) return customColor;

  return getFallbackAccentColor(event?.tag || event?.source || event?.title || fallbackSeed);
}

export function getGameNodeColor(gameName, events = []) {
  const target = normalizeText(gameName);
  const matchingEvents = events.filter((event) => normalizeText(event?.source) === target);
  const customColor = matchingEvents.map((event) => normalizeHexColor(event?.accentColor)).find(Boolean);

  return customColor || getFallbackAccentColor(gameName);
}

export function normalizeEventAccentColor(event) {
  const normalized = normalizeHexColor(event?.accentColor);
  if (!normalized) {
    const rest = { ...(event || {}) };
    delete rest.accentColor;
    return rest;
  }

  return {
    ...(event || {}),
    accentColor: normalized,
  };
}
