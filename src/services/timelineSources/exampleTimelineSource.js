import { exampleTimeline } from "../../data/exampleTimeline";
import { normalizeTimelineEvent } from "./localTimelineSource";

export const EXAMPLE_TIMELINE_ID = "example";

export function getTimelines() {
  return [
    {
      id: EXAMPLE_TIMELINE_ID,
      name: "Example Timeline",
      type: "example",
      description: "Demo/test timeline for The Timeline of What The Fuck.",
    },
  ];
}

export function getActiveTimeline() {
  return getTimelines()[0];
}

export function listEvents() {
  return exampleTimeline.map(normalizeTimelineEvent);
}

export function listTags(defaultTags = []) {
  return defaultTags;
}

export function listPlannedGames(defaultPlannedGames = []) {
  return defaultPlannedGames;
}

export function getStatus() {
  return {
    mode: "example",
    label: "Example Timeline",
    detail: "Fake demo nonsense. Edits evaporate when the archive gets bored.",
  };
}
