export const HEARTBEAT_INTERVAL_MS = 10000;
export const CHECKSUM_INTERVAL_MS = 45000;

export const PEER_MESSAGE_TYPES = {
  HEARTBEAT: "heartbeat",
  TIMELINE_CHECKSUM: "timeline-checksum",
  REQUEST_TIMELINE_SNAPSHOT: "request-timeline-snapshot",
  TIMELINE_SNAPSHOT: "timeline-snapshot",
  EVENT_CREATED: "event-created",
  EVENT_UPDATED: "event-updated",
  EVENT_DELETED: "event-deleted",
  TIMELINE_RENAMED: "timeline-renamed",
  GAMES_QUEUE_ITEM_CREATED: "games-queue-item-created",
  GAMES_QUEUE_ITEM_UPDATED: "games-queue-item-updated",
  GAMES_QUEUE_ITEM_DELETED: "games-queue-item-deleted",
  PERMISSION_UPDATED: "permission-updated",
  PERMISSION_DENIED: "permission-denied",
  GUEST_RENAMED: "guest-renamed",
  CHAT_MESSAGE: "chat-message",
  LIME_CLICK_REQUEST: "lime-click-request",
  LIME_UPGRADE_REQUEST: "lime-upgrade-request",
  LIME_STATE: "lime-state",
  LIME_FRUIT_SPAWNED: "lime-fruit-spawned",
  LIME_FRUIT_CLEARED: "lime-fruit-cleared",
};

export function createMessage(type, payload = {}) {
  return {
    type,
    sentAt: new Date().toISOString(),
    ...payload,
  };
}

export function createHeartbeat(sessionId) {
  return createMessage(PEER_MESSAGE_TYPES.HEARTBEAT, { sessionId });
}

export function createTimelineChecksum({
  timelineCode,
  revision,
  eventCount,
  hash,
}) {
  return createMessage(PEER_MESSAGE_TYPES.TIMELINE_CHECKSUM, {
    timelineCode,
    revision,
    eventCount,
    hash,
  });
}

export function createPermissionDenied(action, reason = "guest_not_allowed") {
  return createMessage(PEER_MESSAGE_TYPES.PERMISSION_DENIED, { action, reason });
}
