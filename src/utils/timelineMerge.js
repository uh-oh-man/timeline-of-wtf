import { uniqueByName } from "./helpers";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeDateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function safeRevision(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function eventIdentity(event) {
  return String(event?.eventCode || event?.id || "");
}

function isImportedNewer(localEvent, importedEvent) {
  const localRevision = safeRevision(localEvent?.revision);
  const importedRevision = safeRevision(importedEvent?.revision);
  if (importedRevision !== localRevision) return importedRevision > localRevision;
  return safeDateValue(importedEvent?.updatedAt) > safeDateValue(localEvent?.updatedAt);
}

export function findMatchingTimelineByCode(importedTimelineCode, localTimelines = []) {
  const code = String(importedTimelineCode || "").trim().toUpperCase();
  if (!code) return null;
  return safeArray(localTimelines).find(
    (timeline) => String(timeline?.timelineCode || "").trim().toUpperCase() === code,
  ) || null;
}

export function compareTimelineVersions(localTimeline = {}, importedTimeline = {}) {
  const localRevision = safeRevision(localTimeline.revision);
  const importedRevision = safeRevision(importedTimeline.revision);
  const localUpdatedAt = safeDateValue(localTimeline.updatedAt);
  const importedUpdatedAt = safeDateValue(importedTimeline.updatedAt);
  let winner = "unknown";

  if (localRevision !== importedRevision) {
    winner = importedRevision > localRevision ? "imported" : "local";
  } else if (localUpdatedAt !== importedUpdatedAt) {
    winner = importedUpdatedAt > localUpdatedAt ? "imported" : "local";
  } else {
    winner = "equal";
  }

  return {
    localRevision,
    importedRevision,
    localUpdatedAt,
    importedUpdatedAt,
    winner,
  };
}

export function buildImportDiff(localTimelineData = {}, importedTimelineData = {}) {
  const localEvents = safeArray(localTimelineData.events);
  const importedEvents = safeArray(importedTimelineData.events);
  const localByIdentity = new Map(localEvents.map((event) => [eventIdentity(event), event]));
  const importedByIdentity = new Map(importedEvents.map((event) => [eventIdentity(event), event]));

  const added = [];
  const updated = [];
  const unchanged = [];
  const conflicts = [];
  const potentiallyDeleted = [];

  importedEvents.forEach((importedEvent) => {
    const key = eventIdentity(importedEvent);
    if (!key || !localByIdentity.has(key)) {
      added.push(importedEvent);
      return;
    }
    const localEvent = localByIdentity.get(key);
    if (JSON.stringify(localEvent) === JSON.stringify(importedEvent)) {
      unchanged.push(importedEvent);
      return;
    }
    if (isImportedNewer(localEvent, importedEvent)) {
      updated.push(importedEvent);
      return;
    }
    if (isImportedNewer(importedEvent, localEvent)) {
      conflicts.push({ localEvent, importedEvent, reason: "local-newer" });
      return;
    }
    conflicts.push({ localEvent, importedEvent, reason: "unknown-version" });
  });

  localEvents.forEach((localEvent) => {
    const key = eventIdentity(localEvent);
    if (!key || importedByIdentity.has(key)) return;
    potentiallyDeleted.push(localEvent);
  });

  return {
    added,
    updated,
    unchanged,
    potentiallyDeleted,
    conflicts,
  };
}

export function mergeTimelineData(localData = {}, importedData = {}, options = {}) {
  const strategy = options.conflictStrategy || "keep-local";
  const localEvents = safeArray(localData.events);
  const mergedByIdentity = new Map(localEvents.map((event) => [eventIdentity(event), event]));
  const diff = buildImportDiff(localData, importedData);

  diff.added.forEach((event) => {
    mergedByIdentity.set(eventIdentity(event), event);
  });
  diff.updated.forEach((event) => {
    mergedByIdentity.set(eventIdentity(event), event);
  });
  if (strategy === "imported-wins") {
    diff.conflicts.forEach(({ importedEvent }) => {
      mergedByIdentity.set(eventIdentity(importedEvent), importedEvent);
    });
  }

  const mergedEvents = Array.from(mergedByIdentity.values());
  return {
    events: mergedEvents,
    tags: uniqueByName([...safeArray(localData.tags), ...safeArray(importedData.tags)]),
    plannedGames: uniqueByName([...safeArray(localData.plannedGames), ...safeArray(importedData.plannedGames)]),
    diff,
  };
}

export function updateTimelineData(localData = {}, importedData = {}, options = {}) {
  const keepLocalOnlyEvents = Boolean(options.keepLocalOnlyEvents);
  const strategy = options.conflictStrategy || "imported-wins";
  const localByIdentity = new Map(
    safeArray(localData.events).map((event) => [eventIdentity(event), event]),
  );
  const nextEvents = safeArray(importedData.events).map((event) => {
    const key = eventIdentity(event);
    if (!key || !localByIdentity.has(key)) return event;
    const localEvent = localByIdentity.get(key);
    if (strategy === "keep-local" && !isImportedNewer(localEvent, event)) {
      return localEvent;
    }
    return event;
  });

  if (keepLocalOnlyEvents) {
    safeArray(localData.events).forEach((localEvent) => {
      const key = eventIdentity(localEvent);
      if (!key) return;
      if (!nextEvents.some((event) => eventIdentity(event) === key)) {
        nextEvents.push(localEvent);
      }
    });
  }

  return {
    events: nextEvents,
    tags: uniqueByName([...safeArray(importedData.tags), ...safeArray(localData.tags)]),
    plannedGames: uniqueByName([...safeArray(importedData.plannedGames), ...safeArray(localData.plannedGames)]),
    diff: buildImportDiff(localData, importedData),
  };
}
