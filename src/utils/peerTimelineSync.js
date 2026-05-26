export function buildPeerTimelineSnapshot({
  sessionId = "",
  timelineId = "",
  timelineCode = "",
  timelineName = "Shared Timeline",
  hostName = "Host",
  events = [],
  tags = [],
  plannedGames = [],
  revision = 0,
} = {}) {
  return {
    type: "timeline-snapshot",
    sessionId,
    timelineId,
    timelineCode,
    timelineName,
    hostName,
    events: Array.isArray(events) ? events : [],
    tags: Array.isArray(tags) ? tags : [],
    plannedGames: Array.isArray(plannedGames) ? plannedGames : [],
    revision: Number(revision || 0),
    sentAt: new Date().toISOString(),
  };
}

export function snapshotToSharedSession(message = {}) {
  return {
    connected: true,
    hostName: message.hostName || "Host",
    timelineId: message.timelineId || "",
    timelineCode: message.timelineCode || "",
    timelineName: message.timelineName || "Shared Timeline",
    events: Array.isArray(message.events) ? message.events : [],
    tags: Array.isArray(message.tags) ? message.tags : [],
    plannedGames: Array.isArray(message.plannedGames) ? message.plannedGames : [],
    revision: Number(message.revision || 0),
    lastSyncedAt: message.sentAt || new Date().toISOString(),
  };
}

export function applyPeerTimelineEvent(currentSession, message = {}) {
  if (!currentSession) return currentSession;
  if (message.timelineCode && currentSession.timelineCode && message.timelineCode !== currentSession.timelineCode) {
    return currentSession;
  }

  const events = Array.isArray(currentSession.events) ? currentSession.events : [];
  const now = message.sentAt || new Date().toISOString();

  if (message.type === "event-created") {
    const event = message.event || message.updatedEvent;
    if (!event?.id) return currentSession;
    const exists = events.some((item) => item.id === event.id || (event.eventCode && item.eventCode === event.eventCode));
    return {
      ...currentSession,
      events: exists ? events.map((item) => (item.id === event.id || item.eventCode === event.eventCode ? event : item)) : [...events, event],
      revision: Number(message.revision || currentSession.revision || 0),
      lastSyncedAt: now,
    };
  }

  if (message.type === "event-updated") {
    const event = message.updatedEvent || message.event;
    if (!event?.id && !message.eventCode && !message.eventId) return currentSession;
    return {
      ...currentSession,
      events: events.map((item) => {
        const matches = item.id === message.eventId || item.id === event?.id || (message.eventCode && item.eventCode === message.eventCode);
        return matches ? { ...item, ...(message.patch || {}), ...(event || {}) } : item;
      }),
      revision: Number(message.revision || currentSession.revision || 0),
      lastSyncedAt: now,
    };
  }

  if (message.type === "event-deleted") {
    return {
      ...currentSession,
      events: events.filter((item) => item.id !== message.eventId && (!message.eventCode || item.eventCode !== message.eventCode)),
      revision: Number(message.revision || currentSession.revision || 0),
      lastSyncedAt: now,
    };
  }

  if (message.type === "games-queue-item-created") {
    const item = message.item;
    if (!item) return currentSession;
    return {
      ...currentSession,
      plannedGames: [...(currentSession.plannedGames || []), item.title || item.name || item],
      revision: Number(message.revision || currentSession.revision || 0),
      lastSyncedAt: now,
    };
  }

  return currentSession;
}
