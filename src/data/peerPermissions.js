export const defaultPeerPermissions = {
  timeline: {
    canEditEntries: true,
    canAddEntries: true,
    canDeleteEntries: true,
    canCreateTimelines: true,
    canDeleteTimelines: true,
  },
  gamesQueue: {
    canAddGames: true,
    canEditGames: true,
    canDeleteGames: true,
  },
  chat: {
    canDirectChat: true,
    canGroupChat: true,
  },
  persistence: {
    canPersistConnection: true,
    canViewCachedWhenHostOffline: true,
    canSaveCopyWhenHostOffline: true,
  },
  lime: {
    canViewLimeProgress: true,
    canClickLime: true,
    canBuyLimeUpgrades: true,
    canAscendFruit: true,
    canSaveLimeCopy: true,
  },
};

function withPatch(base, patch) {
  return {
    ...base,
    timeline: { ...base.timeline, ...(patch.timeline || {}) },
    gamesQueue: { ...base.gamesQueue, ...(patch.gamesQueue || {}) },
    chat: { ...base.chat, ...(patch.chat || {}) },
    persistence: { ...base.persistence, ...(patch.persistence || {}) },
    lime: { ...base.lime, ...(patch.lime || {}) },
  };
}

export const peerPermissionPresets = [
  {
    id: "full-access",
    label: "Full Access",
    permissions: withPatch(defaultPeerPermissions, {}),
  },
  {
    id: "view-only",
    label: "View Only",
    permissions: withPatch(defaultPeerPermissions, {
      timeline: {
        canEditEntries: false,
        canAddEntries: false,
        canDeleteEntries: false,
        canCreateTimelines: false,
        canDeleteTimelines: false,
      },
      gamesQueue: {
        canAddGames: false,
        canEditGames: false,
        canDeleteGames: false,
      },
      lime: {
        canClickLime: false,
        canBuyLimeUpgrades: false,
      },
    }),
  },
  {
    id: "co-editor",
    label: "Co-Editor",
    permissions: withPatch(defaultPeerPermissions, {}),
  },
  {
    id: "lime-goblin",
    label: "Lime Goblin",
    permissions: withPatch(defaultPeerPermissions, {
      timeline: {
        canEditEntries: false,
        canAddEntries: false,
        canDeleteEntries: false,
        canCreateTimelines: false,
        canDeleteTimelines: false,
      },
      gamesQueue: {
        canAddGames: false,
        canEditGames: false,
        canDeleteGames: false,
      },
    }),
  },
];

export const peerPermissionGroups = [
  {
    id: "timeline",
    title: "Timeline Controls",
    description: "Manage timeline events and timeline-level operations.",
    items: [
      {
        key: "canEditEntries",
        label: "Edit entries",
        description: "Allows this guest to change existing timeline disasters.",
      },
      {
        key: "canAddEntries",
        label: "Add entries",
        description: "Allows this guest to add new timeline entries.",
      },
      {
        key: "canDeleteEntries",
        label: "Delete entries",
        description: "Allows this guest to delete timeline entries.",
      },
      {
        key: "canCreateTimelines",
        label: "Create timelines",
        description: "Allows this guest to create additional timelines.",
      },
      {
        key: "canDeleteTimelines",
        label: "Delete timelines",
        description: "Allows this guest to delete timelines.",
      },
    ],
  },
  {
    id: "gamesQueue",
    title: "Games Queue",
    description: "Controls adding/removing future games.",
    items: [
      {
        key: "canAddGames",
        label: "Add games",
        description: "Allows adding games to the queue.",
      },
      {
        key: "canEditGames",
        label: "Edit games",
        description: "Allows editing queued game details.",
      },
      {
        key: "canDeleteGames",
        label: "Remove games",
        description: "Allows deleting queued games.",
      },
    ],
  },
  {
    id: "chat",
    title: "Chat",
    description: "Live-only peer chat permissions.",
    items: [
      {
        key: "canDirectChat",
        label: "Direct chat",
        description: "Allows host/guest direct chat messages.",
      },
      {
        key: "canGroupChat",
        label: "Group chat",
        description: "Allows group chat in shared sessions.",
      },
    ],
  },
  {
    id: "lime",
    title: "Fruit Clickers",
    description: "Controls multiplayer fruit-clicker interactions.",
    items: [
      {
        key: "canViewLimeProgress",
        label: "View fruit progress",
        description: "Allows this guest to view shared fruit-clicker state.",
      },
      {
        key: "canClickLime",
        label: "Click fruit",
        description: "Allows sending click requests.",
      },
      {
        key: "canBuyLimeUpgrades",
        label: "Buy upgrades",
        description: "Allows sending upgrade purchase requests.",
      },
      {
        key: "canAscendFruit",
        label: "Ascend fruit",
        description: "Allows requesting shared fruit ascension resets.",
      },
      {
        key: "canSaveLimeCopy",
        label: "Save fruit copy",
        description: "Allows saving a local copy of shared fruit state.",
      },
    ],
  },
  {
    id: "persistence",
    title: "Offline / Persistence",
    description: "Controls cached/offline timeline behavior.",
    items: [
      {
        key: "canPersistConnection",
        label: "Persist session",
        description: "Allows remembering this session for reconnect.",
      },
      {
        key: "canViewCachedWhenHostOffline",
        label: "View cached timeline",
        description: "Allows viewing cached timeline when host is offline.",
      },
      {
        key: "canSaveCopyWhenHostOffline",
        label: "Save local copy",
        description: "Allows saving cached timeline as local copy.",
      },
    ],
  },
];

export function clonePeerPermissions(permissions = defaultPeerPermissions) {
  return withPatch(defaultPeerPermissions, permissions);
}

export function summarizePeerPermissions(permissions = defaultPeerPermissions) {
  const normalized = clonePeerPermissions(permissions);
  const values = Object.values(normalized).flatMap((group) => Object.values(group));
  const enabledCount = values.filter(Boolean).length;
  if (enabledCount === values.length) return "Full access";
  if (enabledCount === 0) return "View only";
  if (
    normalized.timeline.canEditEntries
    && normalized.timeline.canAddEntries
    && normalized.timeline.canDeleteEntries
    && !normalized.lime.canClickLime
  ) {
    return "Timeline edit only";
  }
  if (!normalized.timeline.canEditEntries && normalized.chat.canGroupChat && normalized.lime.canClickLime) {
    return "Chat + lime only";
  }
  return "Custom access";
}

export function detectPermissionPreset(permissions = defaultPeerPermissions) {
  const normalized = clonePeerPermissions(permissions);
  const matched = peerPermissionPresets.find((preset) =>
    JSON.stringify(normalized) === JSON.stringify(preset.permissions),
  );
  return matched ? matched.id : "custom";
}
