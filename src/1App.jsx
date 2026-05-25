import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserRound } from "lucide-react";
import AccountWindow from "./components/AccountWindow";
import AgeGateModal from "./components/AgeGateModal";
import AchievementsWindow from "./components/AchievementsWindow";
import AchievementToast from "./components/AchievementToast";
import AdminModeOverlay from "./components/AdminModeOverlay";
import AdminPanel from "./components/AdminPanel";
import BackgroundLights from "./components/BackgroundLights";
import ChaosOrb from "./components/ChaosOrb";
import DeleteConfirmWindow from "./components/DeleteConfirmWindow";
import DisasterForm from "./components/DisasterForm";
import DisasterDetailWindow from "./components/DisasterDetailWindow";
import ExampleModeBanner from "./components/ExampleModeBanner";
import ExportOptionsWindow from "./components/ExportOptionsWindow";
import FakeAdWindow from "./components/FakeAdWindow";
import FakeCaptchaModal from "./components/FakeCaptchaModal";
import GamesPanel from "./components/GamesPanel";
import Header from "./components/Header";
import ImportPreviewWindow from "./components/ImportPreviewWindow";
import LimeButton from "./components/LimeButton";
import LimeClickerWindow from "./components/LimeClickerWindow";
import LongTosWindow from "./components/LongTosWindow";
import NodeWebModal from "./components/NodeWebModal";
import ReactionOverlayHost from "./components/ReactionOverlayHost";
import SearchBar from "./components/SearchBar";
import TermsBar from "./components/TermsBar";
import Timeline from "./components/Timeline";
import TimelineManagerButton from "./components/TimelineManagerButton";
import TimelineManagerWindow from "./components/TimelineManagerWindow";
import TimelineToast from "./components/TimelineToast";
import WebsiteLoreHelper from "./components/WebsiteLoreHelper";
import ShareTimelineWindow from "./components/ShareTimelineWindow";
import { ageGateMessages } from "./data/ageGateMessages";
import { captchaVariants } from "./data/captchaVariants";
import { defaultPlannedGames } from "./data/defaultPlannedGames";
import { defaultTags } from "./data/defaultTags";
import { exampleTimeline } from "./data/exampleTimeline";
import { exampleMediaConfig } from "./data/exampleMediaConfig";
import { exampleRemoteConfig } from "./data/exampleRemoteConfig";
import { fakeAds } from "./data/fakeAds";
import { footerMessages } from "./data/footerMessages";
import { generatedExampleMedia } from "./data/generatedExampleMedia";
import { typedSecrets } from "./data/typedSecrets";
import { tosMessages } from "./data/tosMessages";
import { achievements } from "./data/achievements";
import { createId, getGameNames, getGameStats, normalizeText, pickRandom, sortDisasters, uniqueByName } from "./utils/helpers";
import { unlockAchievement } from "./utils/achievements";
import { installKeyboardTriggers } from "./utils/keyboardTriggers";
import { attachMediaToDisasters, distributeGeneratedMedia, filesToExampleMedia, revokeObjectUrls } from "./utils/mediaUtils";
import { generateOrbEscapePath } from "./utils/orbUtils";
import { persistDraftMediaForDisaster } from "./services/media/mediaPersistence";
import {
  cleanupOrphanedMedia,
  deleteMediaByTimelineId,
  revokeObjectUrls as revokePersistedMediaUrls,
} from "./services/media/mediaStore";
import { createMockSession, loadMockAuthSession, saveMockAuthSession } from "./utils/mockAuth";
import {
  CORRUPT_FILE_MESSAGE,
  PACK_MEDIA_ERROR_MESSAGE,
  PACK_MEDIA_MEMORY_MESSAGE,
  downloadUhohBlob,
  downloadUhohFile,
  exportLegacyTimelineText,
  exportTimelineZip,
  exportTimelineZipWithMedia,
  importTimelineFile,
  normalizeImportedTimeline,
} from "./utils/exportImport";
import {
  buildAutoFileNameFromTimelineName,
  buildTimestampedFallbackFileName,
  toSafeUhohFileName,
} from "./utils/fileNameUtils";
import {
  clearAppStorage,
  loadAdminMode,
  loadFlags,
  loadKnownSecrets,
  loadUnlockedAchievements,
  saveAdminMode,
  saveFlags,
  saveKnownSecrets,
  saveUnlockedAchievements,
} from "./utils/storage";
import {
  SOURCE_TYPES,
  canEditTimelineSource,
  getReadOnlyReason,
  loadSelectedTimelineSource,
  saveSelectedTimelineSource,
} from "./services/timelineSources/timelineSourceManager";
import * as localTimelineSource from "./services/timelineSources/localTimelineSource";
import * as mockSyncedTimelineSource from "./services/timelineSources/mockSyncedTimelineSource";
import { loadExampleTimelineSource, REMOTE_EXAMPLE_TIMELINE_ID } from "./services/example/loadExampleTimeline";
import {
  applyOfflineProgress,
  calculateLimesPerClick,
  calculateLimesPerSecond,
  getUpgradeById,
  purchaseUpgrade,
} from "./services/lime/limeMath";
import {
  createDefaultLimeState,
  loadLimeState,
  loadLimeUnlocked,
  saveLimeState,
  saveLimeUnlocked,
} from "./services/lime/limeStorage";
import {
  applyLemonSteal,
  clearLemonEvent,
  computeOrangeBoost,
  createInitialFruitEventState,
  maybeSpawnFruitEvent,
} from "./services/lime/limeFruitEvents";
import {
  loadLimevementsState,
  resetLimevementsState,
  unlockLimevement,
} from "./services/lime/limevementsStore";
import {
  clearLimeMultiplayerSessions,
  createLimeMultiplayerSession,
  getActiveLimeMultiplayerSessionId,
  loadLimeMultiplayerSessions,
  setActiveLimeMultiplayerSessionId,
} from "./services/lime/limeMultiplayerStore";
import { clonePeerPermissions, defaultPeerPermissions } from "./data/peerPermissions";
import { createJoinSession, createHostSession } from "./services/peerSync/peerSyncManager";
import { decodePeerCode, encodePeerCode, validatePeerCode } from "./services/peerSync/peerCodecs";
import { generateSalt, generateSecurityKey } from "./services/peerSync/peerCrypto";
import { PEER_MESSAGE_TYPES } from "./services/peerSync/peerMessages";
import {
  loadPersistentPeerSessions,
  removePersistentPeerSession,
  upsertPersistentPeerSession,
} from "./services/peerSync/persistentSessionsStore";
import { findMatchingTimelineByCode, mergeTimelineData, updateTimelineData } from "./utils/timelineMerge";

export default function App() {
  const [selectedTimelineSource, setSelectedTimelineSource] = useState(() => loadSelectedTimelineSource());
  const [localTimelines, setLocalTimelines] = useState(() => localTimelineSource.ensureLocalTimelineStorage().timelines);
  const [activeLocalTimelineId, setActiveLocalTimelineId] = useState(() => localTimelineSource.getActiveTimelineId());
  const [disasters, setDisasters] = useState(() => {
    const source = loadSelectedTimelineSource();
    if (source === SOURCE_TYPES.SYNCED_MOCK) return mockSyncedTimelineSource.listEvents();
    return localTimelineSource.listEvents(localTimelineSource.getActiveTimelineId());
  });
  const [tags, setTags] = useState(() => {
    const source = loadSelectedTimelineSource();
    if (source === SOURCE_TYPES.SYNCED_MOCK) return mockSyncedTimelineSource.listTags(null, defaultTags);
    return localTimelineSource.listTags(localTimelineSource.getActiveTimelineId(), defaultTags);
  });
  const [plannedGames, setPlannedGames] = useState(() => {
    const source = loadSelectedTimelineSource();
    if (source === SOURCE_TYPES.SYNCED_MOCK) return mockSyncedTimelineSource.listPlannedGames(null, defaultPlannedGames);
    return localTimelineSource.listPlannedGames(localTimelineSource.getActiveTimelineId(), defaultPlannedGames);
  });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nodeWebOpen, setNodeWebOpen] = useState(false);
  const [ageGateMessage, setAgeGateMessage] = useState(null);
  const [orb, setOrb] = useState({ active: false, key: 0, path: null });
  const [fakeAd, setFakeAd] = useState(null);
  const [tosMessage, setTosMessage] = useState(null);
  const [longTosOpen, setLongTosOpen] = useState(false);
  const [flags, setFlags] = useState(() => loadFlags());
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState(() => loadUnlockedAchievements());
  const [toastAchievement, setToastAchievement] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [systemToast, setSystemToast] = useState("");
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [captchaVariant, setCaptchaVariant] = useState(null);
  const [pendingDisaster, setPendingDisaster] = useState(null);
  const [knownSecretIds, setKnownSecretIds] = useState(() => loadKnownSecrets());
  const [adminMode, setAdminMode] = useState(() => loadAdminMode());
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminAnimationActive, setAdminAnimationActive] = useState(false);
  const [exampleMode, setExampleMode] = useState(() => loadSelectedTimelineSource() === SOURCE_TYPES.EXAMPLE);
  const [exampleSessionEvents, setExampleSessionEvents] = useState([]);
  const [exampleMediaItems, setExampleMediaItems] = useState([]);
  const [exampleMediaStatus, setExampleMediaStatus] = useState("");
  const [detailDisasterId, setDetailDisasterId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [loreHelperOpen, setLoreHelperOpen] = useState(false);
  const [timelineManagerOpen, setTimelineManagerOpen] = useState(false);
  const [shareTimelineWindowOpen, setShareTimelineWindowOpen] = useState(false);
  const [shareTimelineTargetId, setShareTimelineTargetId] = useState(() => localTimelineSource.getActiveTimelineId());
  const [shareBinding, setShareBinding] = useState(null);
  const [peerMode, setPeerMode] = useState("host");
  const [peerDisplayName, setPeerDisplayName] = useState(() => loadMockAuthSession()?.username || "Host");
  const [peerPassphrase, setPeerPassphrase] = useState("");
  const [peerInviteCode, setPeerInviteCode] = useState("");
  const [peerAnswerCode, setPeerAnswerCode] = useState("");
  const [peerStatusMessage, setPeerStatusMessage] = useState("");
  const [peerConnectionState, setPeerConnectionState] = useState("disconnected");
  const [peerGuests, setPeerGuests] = useState([]);
  const [peerChatMessages, setPeerChatMessages] = useState([]);
  const [peerChatDraft, setPeerChatDraft] = useState("");
  const [persistentPeerSessions, setPersistentPeerSessions] = useState(() => loadPersistentPeerSessions());
  const [pendingImport, setPendingImport] = useState(null);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportBusyMode, setExportBusyMode] = useState("");
  const [exportTimelineName, setExportTimelineName] = useState("");
  const [exportFileName, setExportFileName] = useState("");
  const [exportFileNameEdited, setExportFileNameEdited] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    active: false,
    phase: "",
    percent: 0,
    currentFile: "",
  });
  const [exampleLoadState, setExampleLoadState] = useState({
    phase: "idle",
    message: "",
  });
  const [exampleSourceLabel, setExampleSourceLabel] = useState("");
  const [exampleFallbackNotice, setExampleFallbackNotice] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [mockAuthSession, setMockAuthSession] = useState(() => loadMockAuthSession());
  const [syncStatus, setSyncStatus] = useState(() => mockSyncedTimelineSource.getStatus());
  const [recentTimelineChanges, setRecentTimelineChanges] = useState({});
  const [limeUnlocked, setLimeUnlocked] = useState(() => loadLimeUnlocked());
  const [limeWindowOpen, setLimeWindowOpen] = useState(false);
  const [limeMode, setLimeMode] = useState("solo");
  const [limeMultiplayerSessions, setLimeMultiplayerSessions] = useState(() => loadLimeMultiplayerSessions());
  const [activeLimeMultiplayerSessionId, setActiveLimeMultiplayerSessionIdState] = useState(() => getActiveLimeMultiplayerSessionId());
  const [limeState, setLimeState] = useState(() => {
    const loaded = loadLimeState();
    return loaded.unlocked ? loaded : { ...loaded, unlocked: loadLimeUnlocked() };
  });
  const [limeFruitState, setLimeFruitState] = useState(() => createInitialFruitEventState(new Date()));
  const [limevementsState, setLimevementsState] = useState(() => loadLimevementsState());
  const [limevementsOpen, setLimevementsOpen] = useState(false);
  const [limeSaveStatus, setLimeSaveStatus] = useState("Saved");
  const [limeOfflineGains, setLimeOfflineGains] = useState(0);
  const hasCheckedAgeGate = useRef(false);
  const hasCheckedAd = useRef(false);
  const hasCheckedTerms = useRef(false);
  const modalStateRef = useRef({});
  const canonClickTimes = useRef([]);
  const titleBadgeClickTimes = useRef([]);
  const exampleFileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const systemToastTimer = useRef(null);
  const timelineChangeTimers = useRef([]);
  const disastersRef = useRef(disasters);
  const mockRevisionRef = useRef(mockSyncedTimelineSource.getRevision());
  const exampleModeCleanupRef = useRef(() => {});
  const limeSaveTimerRef = useRef(null);
  const limeStateRef = useRef(limeState);
  const limeFruitStateRef = useRef(limeFruitState);
  const peerSessionRef = useRef(null);
  const footerMessage = useMemo(() => pickRandom(footerMessages), []);

  const buildExampleEvents = useCallback((extraMedia = []) => {
    const disasterIds = exampleTimeline.map((disaster) => disaster.id);
    const generatedMedia = distributeGeneratedMedia(generatedExampleMedia, disasterIds);
    return attachMediaToDisasters(exampleTimeline, [...generatedMedia, ...extraMedia]);
  }, []);

  const activeSource = exampleMode ? SOURCE_TYPES.EXAMPLE : selectedTimelineSource;
  const canEditCurrentTimeline = canEditTimelineSource(activeSource, mockAuthSession);
  const readOnlyReason = canEditCurrentTimeline ? "" : getReadOnlyReason(activeSource, mockAuthSession);
  const activeLocalTimeline = useMemo(
    () => localTimelines.find((timeline) => timeline.id === activeLocalTimelineId) || localTimelines[0] || null,
    [activeLocalTimelineId, localTimelines],
  );
  const activeTimelineMetadata = useMemo(() => {
    if (activeSource === SOURCE_TYPES.EXAMPLE) {
      return {
        id: "example",
        name: "Example Timeline",
        type: "example",
        description: "Demo/test timeline for The Timeline of What The Fuck.",
      };
    }
    if (activeSource === SOURCE_TYPES.SYNCED_MOCK) {
      return mockSyncedTimelineSource.getActiveTimeline();
    }
    return activeLocalTimeline;
  }, [activeLocalTimeline, activeSource]);

  const displayDisasters = exampleMode ? exampleSessionEvents : disasters;
  const games = useMemo(() => getGameNames(displayDisasters), [displayDisasters]);
  const gameStats = useMemo(() => getGameStats(displayDisasters), [displayDisasters]);
  const editingDisaster = useMemo(
    () => displayDisasters.find((disaster) => disaster.id === editingId) || null,
    [displayDisasters, editingId],
  );
  const detailDisaster = useMemo(
    () => displayDisasters.find((disaster) => disaster.id === detailDisasterId) || null,
    [detailDisasterId, displayDisasters],
  );
  const pendingDeleteDisaster = useMemo(
    () => displayDisasters.find((disaster) => disaster.id === pendingDeleteId) || null,
    [displayDisasters, pendingDeleteId],
  );

  const filteredDisasters = useMemo(() => {
    const query = normalizeText(search);
    const sorted = sortDisasters(displayDisasters);

    if (!query) return sorted;

    return sorted.filter((disaster) => {
      const searchable = [
        disaster.year,
        disaster.title,
        disaster.source,
        disaster.summary,
        disaster.tag,
      ]
        .map(normalizeText)
        .join(" ");

      return searchable.includes(query);
    });
  }, [displayDisasters, search]);

  const exportMediaSummary = useMemo(() => {
    const mediaItems = displayDisasters.flatMap((disaster) =>
      Array.isArray(disaster.media) ? disaster.media : [],
    );
    const mediaBytes = mediaItems.reduce(
      (sum, media) => sum + (Number.isFinite(Number(media?.fileSize)) ? Number(media.fileSize) : 0),
      0,
    );
    return {
      disasterCount: displayDisasters.length,
      mediaCount: mediaItems.length,
      mediaBytes,
    };
  }, [displayDisasters]);

  const existingTimelineNames = useMemo(() => localTimelines.map((timeline) => timeline.name), [localTimelines]);
  const matchingImportTimeline = useMemo(() => {
    const importedTimelineCode = pendingImport?.summary?.timelineCode || "";
    if (!importedTimelineCode) return null;
    return findMatchingTimelineByCode(importedTimelineCode, localTimelines);
  }, [localTimelines, pendingImport]);
  const activeLimeMultiplayerSession = useMemo(
    () =>
      limeMultiplayerSessions.find((session) => session.id === activeLimeMultiplayerSessionId)
      || limeMultiplayerSessions[0]
      || null,
    [activeLimeMultiplayerSessionId, limeMultiplayerSessions],
  );
  const limeOrangeMultiplier = useMemo(
    () => computeOrangeBoost(limeFruitState, new Date()),
    [limeFruitState],
  );
  const limePerClick = useMemo(
    () => calculateLimesPerClick(limeState) * limeOrangeMultiplier,
    [limeOrangeMultiplier, limeState],
  );
  const limePerSecond = useMemo(
    () => calculateLimesPerSecond(limeState) * limeOrangeMultiplier,
    [limeOrangeMultiplier, limeState],
  );

  const majorWindowOpen = Boolean(
    ageGateMessage ||
      nodeWebOpen ||
      achievementsOpen ||
      captchaVariant ||
      fakeAd ||
      adminPanelOpen ||
      loreHelperOpen ||
      longTosOpen ||
      detailDisaster ||
      pendingDeleteId ||
      exportOptionsOpen ||
      pendingImport ||
      timelineManagerOpen ||
      limeWindowOpen,
  );

  const showSystemToast = useCallback((message) => {
    setSystemToast(message);
    window.clearTimeout(systemToastTimer.current);
    systemToastTimer.current = window.setTimeout(() => setSystemToast(""), 2800);
  }, []);

  const persistLimeStateNow = useCallback((nextState) => {
    try {
      saveLimeState(nextState);
      saveLimeUnlocked(Boolean(nextState?.unlocked));
      setLimeSaveStatus("Saved");
    } catch {
      setLimeSaveStatus("Save failed");
    }
  }, []);

  const queueLimeSave = useCallback((nextState) => {
    setLimeSaveStatus("Saving...");
    window.clearTimeout(limeSaveTimerRef.current);
    limeSaveTimerRef.current = window.setTimeout(() => {
      persistLimeStateNow(nextState);
    }, 220);
  }, [persistLimeStateNow]);

  useEffect(() => {
    modalStateRef.current = { majorWindowOpen };
  }, [majorWindowOpen]);

  useEffect(() => {
    disastersRef.current = disasters;
  }, [disasters]);

  useEffect(() => {
    limeStateRef.current = limeState;
  }, [limeState]);

  useEffect(() => {
    limeFruitStateRef.current = limeFruitState;
  }, [limeFruitState]);

  useEffect(() => {
    saveSelectedTimelineSource(activeSource);
  }, [activeSource]);

  useEffect(() => {
    if (exampleMode || selectedTimelineSource !== SOURCE_TYPES.LOCAL || !activeLocalTimelineId) return;
    localTimelineSource.saveEvents(activeLocalTimelineId, disasters);
    setLocalTimelines(localTimelineSource.getTimelines());
  }, [activeLocalTimelineId, disasters, exampleMode, selectedTimelineSource]);

  useEffect(() => {
    if (exampleMode || selectedTimelineSource !== SOURCE_TYPES.LOCAL || !activeLocalTimelineId) return;
    localTimelineSource.saveTags(activeLocalTimelineId, tags);
    setLocalTimelines(localTimelineSource.getTimelines());
  }, [activeLocalTimelineId, exampleMode, selectedTimelineSource, tags]);

  useEffect(() => {
    if (exampleMode || selectedTimelineSource !== SOURCE_TYPES.LOCAL || !activeLocalTimelineId) return;
    localTimelineSource.savePlannedGames(activeLocalTimelineId, plannedGames);
    setLocalTimelines(localTimelineSource.getTimelines());
  }, [activeLocalTimelineId, exampleMode, plannedGames, selectedTimelineSource]);

  useEffect(() => saveUnlockedAchievements(unlockedAchievementIds), [unlockedAchievementIds]);
  useEffect(() => saveFlags(flags), [flags]);
  useEffect(() => saveKnownSecrets(knownSecretIds), [knownSecretIds]);
  useEffect(() => saveAdminMode(adminMode), [adminMode]);
  useEffect(() => saveMockAuthSession(mockAuthSession), [mockAuthSession]);

  useEffect(() => {
    setLimeState((current) => {
      const withUnlock = { ...current, unlocked: current.unlocked || limeUnlocked };
      const { state: progressed, gainedLimes } = applyOfflineProgress(withUnlock, new Date());
      setLimeOfflineGains(gainedLimes > 0 ? gainedLimes : 0);
      return progressed;
    });
  }, [limeUnlocked]);

  useEffect(() => {
    if (limeState.unlocked && !limeUnlocked) {
      setLimeUnlocked(true);
      saveLimeUnlocked(true);
    }
  }, [limeState.unlocked, limeUnlocked]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      let unlockedOrange = false;
      let enteredDebt = false;
      let recoveredDebt = false;
      setLimeState((current) => {
        const beforeCount = Number(current.limeCount || 0);
        const offline = applyOfflineProgress(current, now);
        let nextState = offline.state;
        let nextFruitState = maybeSpawnFruitEvent(limeFruitStateRef.current, {
          unlocked: Boolean(nextState.unlocked || limeUnlocked),
          now,
        });
        if (!limeFruitStateRef.current?.orange && nextFruitState?.orange) {
          unlockedOrange = true;
        }
        const orangeBoost = computeOrangeBoost(nextFruitState, now);
        if (orangeBoost > 1 && offline.elapsedSeconds > 0) {
          const basePerSecond = calculateLimesPerSecond(current);
          const bonus = basePerSecond * (orangeBoost - 1) * offline.elapsedSeconds;
          nextState = {
            ...nextState,
            limeCount: Number(nextState.limeCount || 0) + bonus,
            totalLimesEarned: Number(nextState.totalLimesEarned || 0) + bonus,
            updatedAt: now.toISOString(),
            lastUpdatedAt: now.toISOString(),
          };
        }

        const lemonResult = applyLemonSteal(nextState, nextFruitState, now);
        nextState = lemonResult.limeState;
        nextFruitState = lemonResult.fruitState;
        const afterCount = Number(nextState.limeCount || 0);
        if (beforeCount >= 0 && afterCount < 0) enteredDebt = true;
        if (beforeCount < 0 && afterCount >= 0) recoveredDebt = true;
        if (lemonResult.enteredDebt) enteredDebt = true;
        limeFruitStateRef.current = nextFruitState;
        setLimeFruitState(nextFruitState);
        return nextState;
      });
      if (unlockedOrange) unlockLimevementId("first_orange");
      if (enteredDebt) unlockLimevementId("entered_debt");
      if (recoveredDebt) unlockLimevementId("recovered_from_debt");
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [limeUnlocked, unlockLimevementId]);

  useEffect(() => {
    queueLimeSave(limeState);
  }, [limeState, queueLimeSave]);

  useEffect(() => {
    if (Number(limeState.totalLimesEarned || 0) >= 100) {
      unlockLimevementId("hundred_limes");
    }
    if (Number(limeState.totalLimesEarned || 0) >= 1000) {
      unlockLimevementId("thousand_limes");
    }
  }, [limeState.totalLimesEarned, unlockLimevementId]);

  useEffect(() => {
    function flushLimeProgress(now = new Date()) {
      setLimeState((current) => {
        const { state: progressed, gainedLimes } = applyOfflineProgress(current, now);
        if (gainedLimes > 0.1) setLimeOfflineGains(gainedLimes);
        persistLimeStateNow(progressed);
        return progressed;
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        flushLimeProgress(new Date());
      } else {
        flushLimeProgress(new Date());
      }
    }

    function handleBeforeUnload() {
      const { state: progressed } = applyOfflineProgress(limeStateRef.current, new Date());
      saveLimeState(progressed);
      saveLimeUnlocked(Boolean(progressed.unlocked));
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistLimeStateNow]);

  useEffect(() => {
    return () => revokeObjectUrls(exampleMediaItems);
  }, [exampleMediaItems]);

  useEffect(() => {
    return () => {
      window.clearTimeout(systemToastTimer.current);
      window.clearTimeout(limeSaveTimerRef.current);
      timelineChangeTimers.current.forEach((timer) => window.clearTimeout(timer));
      timelineChangeTimers.current = [];
      peerSessionRef.current?.closeSession?.();
      peerSessionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mockAuthSession?.username) {
      setPeerDisplayName((current) => (current?.trim() ? current : mockAuthSession.username));
    }
  }, [mockAuthSession?.username]);

  useEffect(() => {
    setPersistentPeerSessions(loadPersistentPeerSessions());
  }, []);

  useEffect(() => {
    setPeerStatusMessage("");
    setPeerInviteCode("");
    setPeerAnswerCode("");
    setPeerGuests([]);
  }, [peerMode]);

  function hashText(input) {
    const source = String(input || "");
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(index);
      hash |= 0;
    }
    return `h${Math.abs(hash)}`;
  }

  function buildTimelineChecksumForBinding(binding = shareBinding) {
    if (!binding) return null;
    const timelineEvents = binding.sharedTimelineId === activeLocalTimelineId
      ? disasters
      : localTimelineSource.listEvents(binding.sharedTimelineId);
    const revision = Number(localTimelines.find((timeline) => timeline.id === binding.sharedTimelineId)?.revision || 0);
    return {
      timelineCode: binding.sharedTimelineCode || "",
      revision,
      eventCount: timelineEvents.length,
      hash: hashText(JSON.stringify(timelineEvents)),
    };
  }

  function closePeerSession() {
    peerSessionRef.current?.closeSession?.();
    peerSessionRef.current = null;
    setPeerConnectionState("disconnected");
    setPeerStatusMessage("Disconnected");
  }

  function upsertPeerGuest(nextGuest) {
    setPeerGuests((current) => {
      const existing = current.find((guest) => guest.guestId === nextGuest.guestId);
      if (!existing) return [...current, nextGuest];
      return current.map((guest) => (guest.guestId === nextGuest.guestId ? { ...guest, ...nextGuest } : guest));
    });
  }

  function rememberPersistentSession(sessionPatch) {
    const saved = upsertPersistentPeerSession(sessionPatch);
    if (!saved) return;
    setPersistentPeerSessions(loadPersistentPeerSessions());
  }

  function attachPeerSessionListeners(session) {
    session.onStateChange((state) => {
      setPeerConnectionState(state.connectionState);
      if (state.connectionState === "connected") {
        setPeerStatusMessage("Connected");
        rememberPersistentSession({
          sessionId: state.sessionId,
          hostName: state.hostDisplayName || "Host",
          timelineName: state.sharedTimelineName || "Shared Timeline",
          timelineCode: state.sharedTimelineCode || "",
          guestDisplayName: state.guestDisplayName || peerDisplayName || "Guest",
          permissions: defaultPeerPermissions,
          lastSeenAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          status: "connected",
          encrypted: Boolean(state.hasCryptoKey),
          cachedTimelineSnapshot: {
            events: displayDisasters,
            tags,
            plannedGames,
          },
        });
      }
    });

    session.onSystem((event) => {
      if (event.type === "security-key-mismatch") {
        setPeerStatusMessage(event.message || "Security key mismatch.");
        showSystemToast(event.message || "Security key mismatch.");
        return;
      }
      if (event.type === "channel-open") {
        setPeerStatusMessage("Connected");
        return;
      }
      if (event.type === "channel-close") {
        setPeerStatusMessage("Disconnected");
      }
    });

    session.onMessage((message) => {
      if (!message?.type) return;
      if (message.type === PEER_MESSAGE_TYPES.GUEST_RENAMED) {
        if (message.guestId) {
          upsertPeerGuest({
            guestId: message.guestId,
            displayName: message.newName || message.displayName || "Guest",
            connectionState: "connected",
            permissions: clonePeerPermissions(defaultPeerPermissions),
            joinedAt: message.sentAt || new Date().toISOString(),
            lastSeenAt: message.sentAt || new Date().toISOString(),
          });
        }
        return;
      }
      if (message.type === PEER_MESSAGE_TYPES.CHAT_MESSAGE) {
        setPeerChatMessages((current) => [
          ...current.slice(-99),
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            fromName: message.fromName || "Peer",
            text: message.text || "",
            sentAt: message.sentAt || new Date().toISOString(),
          },
        ]);
        return;
      }
      if (message.type === PEER_MESSAGE_TYPES.TIMELINE_CHECKSUM) {
        const localChecksum = buildTimelineChecksumForBinding();
        if (
          localChecksum
          && message.hash
          && message.hash !== localChecksum.hash
          && message.timelineCode === localChecksum.timelineCode
        ) {
          setPeerStatusMessage("Sync mismatch detected. Requesting snapshot repair...");
          void session.sendMessage({
            type: PEER_MESSAGE_TYPES.REQUEST_TIMELINE_SNAPSHOT,
            reason: "checksum-mismatch",
          });
        }
      }
    });
  }

  const markTimelineChange = useCallback((eventId, type, origin = "local") => {
    if (!eventId) return;
    const timestamp = Date.now();
    setRecentTimelineChanges((current) => ({
      ...current,
      [eventId]: { type, origin, timestamp },
    }));
    const timer = window.setTimeout(() => {
      setRecentTimelineChanges((current) => {
        if (current[eventId]?.timestamp !== timestamp) return current;
        const next = { ...current };
        delete next[eventId];
        return next;
      });
    }, type === "deleted" ? 900 : 2600);
    timelineChangeTimers.current.push(timer);
  }, []);

  const refreshLocalTimelineList = useCallback(() => {
    const timelines = localTimelineSource.getTimelines();
    setLocalTimelines(timelines);
    setActiveLocalTimelineId(localTimelineSource.getActiveTimelineId());
    return timelines;
  }, []);

  const loadLocalTimelineData = useCallback((timelineId = localTimelineSource.getActiveTimelineId()) => {
    const timeline = localTimelineSource.setActiveTimeline(timelineId);
    setActiveLocalTimelineId(timeline.id);
    setLocalTimelines(localTimelineSource.getTimelines());
    setDisasters(localTimelineSource.listEvents(timeline.id));
    setTags(localTimelineSource.listTags(timeline.id, defaultTags));
    setPlannedGames(localTimelineSource.listPlannedGames(timeline.id, defaultPlannedGames));
    mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
    return timeline;
  }, []);

  const loadMockSyncedData = useCallback(() => {
    const snapshot = mockSyncedTimelineSource.getSnapshot();
    mockRevisionRef.current = snapshot.revision;
    setDisasters(snapshot.events);
    setTags(mockSyncedTimelineSource.listTags(null, defaultTags));
    setPlannedGames(mockSyncedTimelineSource.listPlannedGames(null, defaultPlannedGames));
    setSyncStatus(mockSyncedTimelineSource.getStatus());
    return snapshot;
  }, []);

  const clearExampleSessionArtifacts = useCallback(async () => {
    const cleanup = exampleModeCleanupRef.current;
    exampleModeCleanupRef.current = () => {};
    try {
      await cleanup?.();
    } catch {
      // Example cleanup failures should not block source switching.
    }
  }, []);

  const leaveExampleMode = useCallback(() => {
    setExampleMode(false);
    setExampleSessionEvents([]);
    setDetailDisasterId(null);
    setShowForm(false);
    setEditingId(null);
    setExampleSourceLabel("");
    setExampleFallbackNotice("");
    setExampleMediaStatus("");
    setExampleLoadState({ phase: "idle", message: "" });
    clearExampleSessionArtifacts();
  }, [clearExampleSessionArtifacts]);

  const enterExampleMode = useCallback(async () => {
    setExampleLoadState({
      phase: "loading",
      message: "Asking GitHub for the sample crime scene...",
    });
    setExampleMediaStatus("Loading remote demo evidence...");
    setShowForm(false);
    setEditingId(null);
    setDetailDisasterId(null);
    setExampleFallbackNotice("");
    await clearExampleSessionArtifacts();

    try {
      const loaded = await loadExampleTimelineSource({
        config: exampleRemoteConfig,
        onStatus: (message) => setExampleLoadState({ phase: "loading", message }),
      });

      const timelineTags = uniqueByName([
        ...defaultTags,
        ...(loaded.tags || []),
        ...loaded.events.map((eventItem) => eventItem.tag).filter(Boolean),
      ]);
      const nextPlannedGames = uniqueByName(loaded.plannedGames || []);

      setSelectedTimelineSource(SOURCE_TYPES.EXAMPLE);
      setExampleMode(true);
      setExampleSessionEvents(loaded.events);
      setTags(timelineTags);
      setPlannedGames(nextPlannedGames);
      setExampleMediaStatus(
        loaded.usedFallback
          ? "Built-in example loaded. The archive improvised."
          : "Remote example loaded from GitHub. Session-only edits remain temporary.",
      );
      setExampleSourceLabel(loaded.sourceLabel || "Built-in fallback");
      setExampleFallbackNotice(loaded.fallbackNotice || "");
      setExampleLoadState({
        phase: loaded.usedFallback ? "fallback" : "success",
        message: loaded.usedFallback
          ? "Remote example failed. Using emergency nonsense."
          : "Remote Example Loaded",
      });

      if (loaded.source === "remote-github-uhoh") {
        exampleModeCleanupRef.current = async () => {
          await deleteMediaByTimelineId(REMOTE_EXAMPLE_TIMELINE_ID);
        };
      } else {
        exampleModeCleanupRef.current = () => {};
      }
      globalThis.console.info("[example] source", loaded.source);
      if (loaded.usedFallback) {
        showSystemToast("Remote example unavailable. Built-in demo loaded instead.");
      } else {
        showSystemToast("Remote example loaded.");
      }
    } catch (error) {
      globalThis.console.warn("Example mode failed", error);
      setExampleLoadState({
        phase: "failed",
        message: "Example Failed",
      });
      setExampleMediaStatus("The archive failed to load both remote and built-in example data.");
      setExampleMode(false);
      showSystemToast("Example failed to load. The archive has no backup nonsense right now.");
    }
  }, [clearExampleSessionArtifacts, showSystemToast]);

  const selectTimelineSource = useCallback((source) => {
    if (source === SOURCE_TYPES.EXAMPLE) {
      void enterExampleMode();
      return;
    }

    leaveExampleMode();
    setSelectedTimelineSource(source);
    if (source === SOURCE_TYPES.SYNCED_MOCK) {
      loadMockSyncedData();
      showSystemToast("Mock sync active. The server is imaginary, but the anxiety is real.");
      return;
    }

    loadLocalTimelineData(activeLocalTimelineId);
  }, [activeLocalTimelineId, enterExampleMode, leaveExampleMode, loadLocalTimelineData, loadMockSyncedData, showSystemToast]);

  const switchLocalTimeline = useCallback((timelineId) => {
    leaveExampleMode();
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    const timeline = loadLocalTimelineData(timelineId);
    showSystemToast("Switched timeline. Reality has been reassigned.");
    return timeline;
  }, [leaveExampleMode, loadLocalTimelineData, showSystemToast]);

  const createLocalTimeline = useCallback((name, data = {}) => {
    leaveExampleMode();
    const timeline = localTimelineSource.createTimeline(name, data);
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    refreshLocalTimelineList();
    loadLocalTimelineData(timeline.id);
    showSystemToast("New timeline created. Fresh crime scene.");
    return timeline;
  }, [leaveExampleMode, loadLocalTimelineData, refreshLocalTimelineList, showSystemToast]);

  const renameLocalTimeline = useCallback((timelineId, name) => {
    localTimelineSource.renameTimeline(timelineId, name);
    refreshLocalTimelineList();
    showSystemToast("Timeline renamed. The paperwork is pretending this was always true.");
  }, [refreshLocalTimelineList, showSystemToast]);

  const duplicateLocalTimeline = useCallback((timelineId) => {
    leaveExampleMode();
    const timeline = localTimelineSource.duplicateTimeline(timelineId);
    if (!timeline) return;
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    refreshLocalTimelineList();
    loadLocalTimelineData(timeline.id);
    showSystemToast("Timeline cloned. Ethically questionable, technically useful.");
  }, [leaveExampleMode, loadLocalTimelineData, refreshLocalTimelineList, showSystemToast]);

  const deleteLocalTimeline = useCallback((timelineId) => {
    const result = localTimelineSource.deleteTimeline(timelineId);
    if (!result.deleted) {
      showSystemToast("Cannot delete the last local timeline. The archive needs at least one bunker.");
      return;
    }
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    refreshLocalTimelineList();
    loadLocalTimelineData(result.activeTimeline.id);
    showSystemToast("Timeline deleted. The archive will deny it ever existed.");
  }, [loadLocalTimelineData, refreshLocalTimelineList, showSystemToast]);

  function diffTimelineEvents(previousEvents, nextEvents) {
    const previousById = new Map(previousEvents.map((event) => [event.id, event]));
    const nextById = new Map(nextEvents.map((event) => [event.id, event]));
    const added = nextEvents.filter((event) => !previousById.has(event.id));
    const removed = previousEvents.filter((event) => !nextById.has(event.id));
    const updated = nextEvents.filter((event) => {
      const previous = previousById.get(event.id);
      return previous && JSON.stringify(previous) !== JSON.stringify(event);
    });

    return { added, removed, updated };
  }

  const applySyncedSnapshot = useCallback((snapshot) => {
    const diff = diffTimelineEvents(disastersRef.current, snapshot.events);
    [...diff.added, ...diff.updated].forEach((event) => {
      markTimelineChange(event.id, diff.added.includes(event) ? "created" : "updated", "sync");
    });
    diff.removed.forEach((event) => markTimelineChange(event.id, "deleted", "sync"));

    const applyData = () => {
      setDisasters(snapshot.events);
      setTags(mockSyncedTimelineSource.listTags(null, defaultTags));
      setPlannedGames(mockSyncedTimelineSource.listPlannedGames(null, defaultPlannedGames));
      setSyncStatus(mockSyncedTimelineSource.getStatus());
    };

    if (diff.removed.length) {
      window.setTimeout(applyData, 430);
    } else {
      applyData();
    }

    if (diff.added.length || diff.removed.length || diff.updated.length) {
      const parts = [
        diff.added.length ? `${diff.added.length} added` : "",
        diff.removed.length ? `${diff.removed.length} removed` : "",
        diff.updated.length ? `${diff.updated.length} updated` : "",
      ].filter(Boolean);
      showSystemToast(parts.length > 1 ? `Shared timeline updated: ${parts.join(", ")}.` : "Shared timeline updated. The archive twitched.");
    }
  }, [markTimelineChange, showSystemToast]);

  useEffect(() => {
    if (!exampleMode || exampleSessionEvents.length) return;
    setExampleSessionEvents(buildExampleEvents(exampleMediaItems));
    setExampleMediaStatus("Example mode edits are temporary. The archive will deny everything later.");
  }, [buildExampleEvents, exampleMediaItems, exampleMode, exampleSessionEvents.length]);

  useEffect(() => {
    if (selectedTimelineSource !== SOURCE_TYPES.SYNCED_MOCK || exampleMode) return undefined;
    let stopped = false;
    setSyncStatus((current) => ({ ...current, label: "Checking...", detail: "Checking shared timeline... yelling into localStorage." }));

    const poll = () => {
      if (stopped || document.hidden) return;
      const snapshot = mockSyncedTimelineSource.getSnapshot();
      if (snapshot.revision !== mockRevisionRef.current) {
        mockRevisionRef.current = snapshot.revision;
        applySyncedSnapshot(snapshot);
      } else {
        setSyncStatus(mockSyncedTimelineSource.getStatus());
      }
    };

    poll();
    const intervalId = window.setInterval(poll, mockSyncedTimelineSource.SYNC_POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [applySyncedSnapshot, exampleMode, selectedTimelineSource]);

  useEffect(() => {
    const rescueMessages = [
      "Window containment restored.",
      "Offscreen escape attempt denied.",
      "The archive dragged that back before you lost it forever.",
      "Nice try. The window has been returned from the void.",
      "Floating window privileges temporarily questioned.",
    ];
    function handleWindowRescued() {
      showSystemToast(pickRandom(rescueMessages));
    }

    window.addEventListener("twtaf:window-rescued", handleWindowRescued);
    return () => window.removeEventListener("twtaf:window-rescued", handleWindowRescued);
  }, [showSystemToast]);

  const unlock = useCallback((achievementId) => {
    setUnlockedAchievementIds((current) => {
      const result = unlockAchievement(current, achievementId);
      if (result.didUnlock) {
        window.setTimeout(() => setAchievementQueue((queue) => [...queue, result.achievement]), 0);
      }
      return result.nextIds;
    });
  }, []);

  const unlockLimevementId = useCallback((limevementId) => {
    setLimevementsState((current) => unlockLimevement(current, limevementId));
  }, []);

  useEffect(() => {
    if (toastAchievement || achievementQueue.length === 0) return;

    const [nextAchievement, ...remaining] = achievementQueue;
    setToastAchievement(nextAchievement);
    setAchievementQueue(remaining);
  }, [achievementQueue, toastAchievement]);

  const discoverSecret = useCallback((secretId) => {
    setKnownSecretIds((current) => (current.includes(secretId) ? current : [...current, secretId]));
  }, []);

  const showRandomAgeGate = useCallback(() => {
    setAgeGateMessage(pickRandom(ageGateMessages));
  }, []);

  const triggerManualAgeGate = useCallback(() => {
    discoverSecret("id");
    setAgeGateMessage(pickRandom(ageGateMessages));
    unlock("triggered_age_gate");
  }, [discoverSecret, unlock]);

  const triggerOrb = useCallback(() => {
    setOrb((current) => ({
      active: true,
      key: current.key + 1,
      path: generateOrbEscapePath(),
    }));
  }, []);

  const triggerManualOrb = useCallback(() => {
    discoverSecret("nrop");
    triggerOrb();
    unlock("triggered_orb");
  }, [discoverSecret, triggerOrb, unlock]);

  const triggerObservedOrb = useCallback(() => {
    triggerOrb();
    unlock("orb_observer");
  }, [triggerOrb, unlock]);

  const unlockLime = useCallback(() => {
    setLimeUnlocked(true);
    setLimeState((current) => {
      if (current.unlocked) return current;
      const now = new Date().toISOString();
      return {
        ...current,
        unlocked: true,
        createdAt: current.createdAt || now,
        updatedAt: now,
        lastUpdatedAt: now,
      };
    });
    saveLimeUnlocked(true);
    unlock("lime_unlocked");
    unlockLimevementId("lime_unlocked");
    showSystemToast("lime unlocked. Citrus has seized control.");
  }, [showSystemToast, unlock, unlockLimevementId]);

  const onOrbForegroundEscapeTap = useCallback(() => {
    if (limeUnlocked || limeState.unlocked) {
      showSystemToast("Tiny lime sparkle acknowledged.");
      return;
    }
    unlockLime();
  }, [limeState.unlocked, limeUnlocked, showSystemToast, unlockLime]);

  const onClickLime = useCallback(() => {
    setLimeOfflineGains(0);
    setLimeState((current) => {
      const { state: progressed } = applyOfflineProgress(current, new Date());
      const clickGain = calculateLimesPerClick(progressed) * computeOrangeBoost(limeFruitState, new Date());
      const now = new Date().toISOString();
      const nextCount = Number(progressed.limeCount || 0) + clickGain;
      const nextTotal = Number(progressed.totalLimesEarned || 0) + clickGain;
      return {
        ...progressed,
        unlocked: true,
        limeCount: nextCount,
        totalLimesEarned: nextTotal,
        totalClicks: Number(progressed.totalClicks || 0) + 1,
        updatedAt: now,
        lastUpdatedAt: now,
      };
    });
    unlockLimevementId("first_click");
    if (limeMode === "multiplayer") {
      unlockLimevementId("multiplayer_click");
    }
  }, [limeFruitState, limeMode, unlockLimevementId]);

  const onPurchaseLimeUpgrade = useCallback((upgradeId) => {
    const upgrade = getUpgradeById(upgradeId);
    if (!upgrade) return;
    setLimeState((current) => {
      const { state: progressed } = applyOfflineProgress(current, new Date());
      const result = purchaseUpgrade(progressed, upgrade);
      if (!result.purchased) return progressed;
      unlockLimevementId("first_upgrade");
      if (upgradeId === "tinyLimeIntern" || upgradeId === "limePress") {
        unlockLimevementId("first_auto");
      }
      if (limeMode === "multiplayer") {
        unlockLimevementId("multiplayer_upgrade");
      }
      return {
        ...result.state,
        unlocked: true,
      };
    });
  }, [limeMode, unlockLimevementId]);

  const resetLimeProgress = useCallback(() => {
    const reset = createDefaultLimeState();
    const now = new Date().toISOString();
    const next = {
      ...reset,
      unlocked: true,
      createdAt: limeState.createdAt || now,
      lastUpdatedAt: now,
      updatedAt: now,
    };
    setLimeUnlocked(true);
    setLimeState(next);
    setLimeFruitState(createInitialFruitEventState(new Date()));
    setLimeOfflineGains(0);
    saveLimeUnlocked(true);
    showSystemToast("Lime progress reset. Productivity has been juiced back to zero.");
  }, [limeState.createdAt, showSystemToast]);

  const clearActiveLemon = useCallback(() => {
    if (!limeFruitState?.lemon) return;
    setLimeFruitState((current) => clearLemonEvent(current, new Date()));
    unlockLimevementId("stopped_lemon");
    showSystemToast("Lemon evicted. Citrus theft halted.");
  }, [limeFruitState?.lemon, showSystemToast, unlockLimevementId]);

  const refreshLimeMultiplayerSessions = useCallback(() => {
    setLimeMultiplayerSessions(loadLimeMultiplayerSessions());
    setActiveLimeMultiplayerSessionIdState(getActiveLimeMultiplayerSessionId());
  }, []);

  const hostLimeMultiplayerSession = useCallback(() => {
    const hostName = peerDisplayName || mockAuthSession?.username || "Host";
    createLimeMultiplayerSession({
      name: "Lime Session",
      hostUserId: mockAuthSession?.username || "local-user",
      hostName,
      state: limeState,
    });
    refreshLimeMultiplayerSessions();
    setLimeMode("multiplayer");
    unlockLimevementId("multiplayer_started");
    showSystemToast("Multiplayer lime session hosted. Host-owned save is now canonical.");
  }, [limeState, mockAuthSession?.username, peerDisplayName, refreshLimeMultiplayerSessions, showSystemToast, unlockLimevementId]);

  const joinLimeMultiplayerSession = useCallback(() => {
    if (!activeLimeMultiplayerSessionId && limeMultiplayerSessions[0]) {
      setActiveLimeMultiplayerSessionId(limeMultiplayerSessions[0].id);
      setActiveLimeMultiplayerSessionIdState(limeMultiplayerSessions[0].id);
    }
    setLimeMode("multiplayer");
    showSystemToast("Joined multiplayer lime view. Solo stash remains untouched.");
  }, [activeLimeMultiplayerSessionId, limeMultiplayerSessions, showSystemToast]);

  const disconnectLimeMultiplayerSession = useCallback(() => {
    setLimeMode("solo");
    showSystemToast("Switched back to solo lime.");
  }, [showSystemToast]);

  const triggerFakeAd = useCallback(
    (manual = false) => {
      setFakeAd(pickRandom(fakeAds));
      if (manual) {
        discoverSecret("ads");
        unlock("triggered_ads");
      }
    },
    [discoverSecret, unlock],
  );

  const showTosBar = useCallback(
    (manual = false) => {
      setTosMessage(pickRandom(tosMessages));
      if (manual) {
        discoverSecret("tos");
        unlock("triggered_tos");
      }
    },
    [discoverSecret, unlock],
  );

  const triggerManualCaptcha = useCallback(() => {
    discoverSecret("cap");
    setCaptchaVariant(pickRandom(captchaVariants));
    unlock("captcha_done");
  }, [discoverSecret, unlock]);

  const openAchievementsWindow = useCallback(() => {
    setAchievementsOpen(true);
    unlock("opened_achievements");
  }, [unlock]);

  const triggerAdminMode = useCallback(() => {
    discoverSecret("admin");
    setAdminMode(true);
    setAdminPanelOpen(true);
    setAdminAnimationActive(true);
    setUnlockedAchievementIds(achievements.map((achievement) => achievement.id));
    setKnownSecretIds(typedSecrets.map((secret) => secret.id));
    window.setTimeout(() => setAdminAnimationActive(false), 4000);
  }, [discoverSecret]);

  const openWebsiteLoreHelper = useCallback(() => {
    if (!adminMode) return;

    discoverSecret("lore");
    setLoreHelperOpen(true);
    unlock("website_lore_ledger");
  }, [adminMode, discoverSecret, unlock]);

  const triggerFromAdmin = useCallback((action) => {
    setAdminPanelOpen(false);
    setLoreHelperOpen(false);
    window.setTimeout(action, 150);
  }, []);

  useEffect(() => {
    function handleJokeButton() {
      unlock("button_whisperer");
    }

    window.addEventListener("twtaf:joke-button", handleJokeButton);
    return () => window.removeEventListener("twtaf:joke-button", handleJokeButton);
  }, [unlock]);

  const openNodeWeb = useCallback(() => {
    setNodeWebOpen(true);
    unlock("opened_node_web");
  }, [unlock]);

  useEffect(() => {
    if (hasCheckedAgeGate.current) return;
    hasCheckedAgeGate.current = true;

    if (Math.random() < 0.1) {
      showRandomAgeGate();
    }
  }, [showRandomAgeGate]);

  useEffect(() => {
    return installKeyboardTriggers({
      onAgeGate: triggerManualAgeGate,
      onOrb: triggerManualOrb,
      onAds: () => triggerFakeAd(true),
      onTos: () => showTosBar(true),
      onCaptcha: triggerManualCaptcha,
      onAchievements: () => {
        discoverSecret("ach");
        openAchievementsWindow();
      },
      onAdmin: triggerAdminMode,
      onLore: openWebsiteLoreHelper,
    });
  }, [discoverSecret, openAchievementsWindow, openWebsiteLoreHelper, showTosBar, triggerAdminMode, triggerFakeAd, triggerManualAgeGate, triggerManualCaptcha, triggerManualOrb]);

  useEffect(() => {
    let stopped = false;
    let timerId;

    function scheduleOrbCheck() {
      const delay = 16000 + Math.random() * 9000;
      timerId = window.setTimeout(() => {
        if (stopped) return;
        if (Math.random() < 0.035) triggerOrb();
        scheduleOrbCheck();
      }, delay);
    }

    scheduleOrbCheck();

    return () => {
      stopped = true;
      window.clearTimeout(timerId);
    };
  }, [triggerOrb]);

  useEffect(() => {
    if (hasCheckedAd.current) return;
    hasCheckedAd.current = true;

    const timer = window.setTimeout(() => {
      if (Math.random() < 0.04 && !modalStateRef.current.majorWindowOpen) {
        triggerFakeAd(false);
      }
    }, 4500 + Math.random() * 6500);

    return () => window.clearTimeout(timer);
  }, [triggerFakeAd]);

  useEffect(() => {
    if (hasCheckedTerms.current || flags.tosDismissed) return;
    hasCheckedTerms.current = true;

    const timer = window.setTimeout(() => {
      if (Math.random() < 0.05 && !modalStateRef.current.majorWindowOpen) {
        showTosBar(false);
      }
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [flags.tosDismissed, showTosBar]);

  function openNewDisasterForm() {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. The archive has locked the pens.");
      return;
    }
    setEditingId(null);
    setShowForm(true);
    window.setTimeout(() => {
      document.getElementById("disaster-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openEditForm(id) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. The archive has locked the pens.");
      return;
    }
    setEditingId(id);
    setShowForm(true);
    window.setTimeout(() => {
      document.getElementById("disaster-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function reorderYear(year, orderedIds) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Time border control denied the clipboard.");
      return;
    }

    if (exampleMode) {
      setExampleSessionEvents((current) =>
        current.map((disaster) => {
          if (normalizeText(disaster.year) !== normalizeText(year)) return disaster;
          const nextOrder = orderedIds.indexOf(disaster.id);
          return nextOrder === -1 ? disaster : { ...disaster, sortOrder: nextOrder };
        }),
      );
      return;
    }

    setDisasters((current) => {
      const nextEvents = current.map((disaster) => {
        if (normalizeText(disaster.year) !== normalizeText(year)) return disaster;
        const nextOrder = orderedIds.indexOf(disaster.id);
        return nextOrder === -1 ? disaster : { ...disaster, sortOrder: nextOrder };
      });
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveEvents(null, nextEvents);
        setSyncStatus(mockSyncedTimelineSource.getStatus());
      }
      return nextEvents;
    });
  }

  function performExampleSave(draft) {
    const existingDisaster = draft.id ? exampleSessionEvents.find((disaster) => disaster.id === draft.id) : null;
    const yearChanged = existingDisaster && normalizeText(existingDisaster.year) !== normalizeText(draft.year);
    const yearPeerCount = exampleSessionEvents.filter(
      (disaster) => normalizeText(disaster.year) === normalizeText(draft.year) && disaster.id !== draft.id,
    ).length;
    const nextDisaster = {
      ...draft,
      id: draft.id || createId(),
      sortOrder:
        !draft.id || yearChanged || !Number.isFinite(Number(draft.sortOrder))
          ? yearPeerCount
          : Number(draft.sortOrder),
      media: Array.isArray(draft.media)
        ? draft.media.map((media, index) => ({
            ...media,
            disasterId: draft.id || media.disasterId || draft.id,
            order: Number.isFinite(Number(media.order)) ? Number(media.order) : index,
          }))
        : [],
    };
    nextDisaster.media = nextDisaster.media.map((media) => ({ ...media, disasterId: nextDisaster.id }));

    markTimelineChange(nextDisaster.id, draft.id ? "updated" : "created", "example");
    setExampleSessionEvents((current) => {
      if (draft.id) {
        return current.map((disaster) => (disaster.id === draft.id ? nextDisaster : disaster));
      }
      return [...current, nextDisaster];
    });

    showSystemToast("Example history rewritten. The real timeline remains smugly untouched.");
    closeForm();
    return true;
  }

  async function performSaveDisaster(draft, { closeAfterSave = false } = {}) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. The archive has locked the pens.");
      return false;
    }

    const existingDisaster = draft.id ? disasters.find((disaster) => disaster.id === draft.id) : null;
    const yearChanged = existingDisaster && normalizeText(existingDisaster.year) !== normalizeText(draft.year);
    const yearPeerCount = disasters.filter(
      (disaster) => normalizeText(disaster.year) === normalizeText(draft.year) && disaster.id !== draft.id,
    ).length;
    const nextDisaster = {
      ...draft,
      id: draft.id || createId(),
      sortOrder:
        !draft.id || yearChanged || !Number.isFinite(Number(draft.sortOrder))
          ? yearPeerCount
          : Number(draft.sortOrder),
    };
    const stagedDraftUrls = (Array.isArray(draft.media) ? draft.media : [])
      .map((media) => media?.objectUrl)
      .filter(Boolean);
    const timelineId = activeTimelineMetadata?.id || (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK ? "mock-real-timeline" : activeLocalTimelineId);
    const mediaPersistence = await persistDraftMediaForDisaster(draft.media || [], {
      timelineId,
      disasterId: nextDisaster.id,
    });
    revokePersistedMediaUrls(stagedDraftUrls);
    nextDisaster.media = mediaPersistence.media;
    const isNewDisaster = !draft.id;
    const isCustomTag = !tags.includes(nextDisaster.tag);

    setDisasters((current) => {
      let nextEvents;
      if (draft.id) {
        nextEvents = current.map((disaster) => (disaster.id === draft.id ? nextDisaster : disaster));
      } else {
        nextEvents = [...current, nextDisaster];
      }

      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveEvents(null, nextEvents);
        setSyncStatus(mockSyncedTimelineSource.getStatus());
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
      return nextEvents;
    });

    setTags((current) => {
      const nextTags = uniqueByName([...current, nextDisaster.tag]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveTags(null, nextTags);
        setSyncStatus(mockSyncedTimelineSource.getStatus());
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
      return nextTags;
    });
    markTimelineChange(nextDisaster.id, isNewDisaster ? "created" : "updated", selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK ? "sync" : "local");

    if (isNewDisaster) {
      unlock("first_disaster");
      if (disasters.length + 1 >= 5) unlock("five_disasters");
      if (disasters.length + 1 >= 10) unlock("ten_disasters");
    }

    if ((nextDisaster.directConnections || []).length > 0) {
      unlock("first_connection");
    }

    if (mediaPersistence.warnings.length > 0) {
      showSystemToast("Some media could not be saved. Missing evidence placeholders were attached instead.");
    }

    if (isCustomTag) {
      unlock("custom_tag");
    }

    showSystemToast(isNewDisaster ? "Disaster archived. The timeline got worse." : "History rewritten. Very normal behavior.");

    if (draft.id || closeAfterSave || isNewDisaster) {
      closeForm();
    }

    return true;
  }

  async function handleSaveDisaster(draft) {
    if (exampleMode) {
      return performExampleSave(draft);
    }

    if (!captchaVariant && Math.random() < 0.065) {
      setPendingDisaster(draft);
      setCaptchaVariant(pickRandom(captchaVariants));
      return false;
    }

    return performSaveDisaster(draft);
  }

  async function completeCaptcha(achievementId) {
    const disasterToSave = pendingDisaster;
    setCaptchaVariant(null);
    setPendingDisaster(null);
    unlock(achievementId || "captcha_done");

    if (disasterToSave) {
      await performSaveDisaster(disasterToSave, { closeAfterSave: true });
    }
  }

  function requestDeleteDisaster(id) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. The archive has locked the shredder.");
      return;
    }
    setPendingDeleteId(id);
  }

  function confirmDeleteDisaster() {
    if (!pendingDeleteId) return;
    if (!canEditCurrentTimeline) {
      setPendingDeleteId(null);
      showSystemToast(readOnlyReason || "This timeline is view-only. The archive has locked the shredder.");
      return;
    }

    if (exampleMode) {
      const deletingId = pendingDeleteId;
      markTimelineChange(deletingId, "deleted", "example");
      if (editingId === pendingDeleteId) closeForm();
      if (detailDisasterId === pendingDeleteId) setDetailDisasterId(null);
      setPendingDeleteId(null);
      showSystemToast("Example evidence deleted. It will grow back next session.");
      window.setTimeout(() => {
        setExampleSessionEvents((current) => current.filter((item) => item.id !== deletingId));
      }, 420);
      return;
    }

    const deletingId = pendingDeleteId;
    markTimelineChange(deletingId, "deleted", selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK ? "sync" : "local");

    if (editingId === pendingDeleteId) {
      closeForm();
    }

    if (detailDisasterId === pendingDeleteId) {
      setDetailDisasterId(null);
    }

    setPendingDeleteId(null);
    window.setTimeout(() => {
      setDisasters((current) => {
        const nextEvents = current.filter((item) => item.id !== deletingId);
        if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
          mockSyncedTimelineSource.saveEvents(null, nextEvents);
          setSyncStatus(mockSyncedTimelineSource.getStatus());
          mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
        }
        return nextEvents;
      });
    }, 420);
  }

  function addPlannedGame(game) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Future plans require fake clearance.");
      return;
    }
    setPlannedGames((current) => {
      const nextGames = uniqueByName([...current, game]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK && !exampleMode) {
        mockSyncedTimelineSource.savePlannedGames(null, nextGames);
        setSyncStatus(mockSyncedTimelineSource.getStatus());
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
      return nextGames;
    });
  }

  function removePlannedGame(index) {
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. The future is legally taped down.");
      return;
    }
    setPlannedGames((current) => {
      const nextGames = current.filter((_, itemIndex) => itemIndex !== index);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK && !exampleMode) {
        mockSyncedTimelineSource.savePlannedGames(null, nextGames);
        setSyncStatus(mockSyncedTimelineSource.getStatus());
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
      return nextGames;
    });
  }

  function acceptTerms() {
    setFlags((current) => ({ ...current, tosDismissed: true }));
    setTosMessage(null);
    setLongTosOpen(false);
    unlock("accepted_tos");
  }

  function reviewTerms() {
    setLongTosOpen(true);
    unlock("read_tos");
  }

  function dismissTerms() {
    setFlags((current) => ({ ...current, tosDismissed: true }));
    setTosMessage(null);
    setLongTosOpen(false);
  }

  function handleCanonLevelClick() {
    const now = performance.now();
    const recentClicks = [...canonClickTimes.current.filter((time) => now - time <= 4000), now];
    canonClickTimes.current = recentClicks;

    if (recentClicks.length >= 5) {
      canonClickTimes.current = [];
      openAchievementsWindow();
    }
  }

  function handleTitleBadgeClick(triggerMode = "click") {
    if (!adminMode) return;

    if (triggerMode === "long-press") {
      openWebsiteLoreHelper();
      return;
    }

    const now = performance.now();
    const recentClicks = [...titleBadgeClickTimes.current.filter((time) => now - time <= 4000), now];
    titleBadgeClickTimes.current = recentClicks;

    if (recentClicks.length >= 3) {
      titleBadgeClickTimes.current = [];
      openWebsiteLoreHelper();
    }
  }

  function exitExampleMode() {
    leaveExampleMode();
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    loadLocalTimelineData(activeLocalTimelineId);
    setExampleMediaStatus("");
  }

  async function loadExampleMediaFiles(files) {
    const currentEvents = exampleMode && exampleSessionEvents.length ? exampleSessionEvents : buildExampleEvents([]);
    const disasterIds = currentEvents.map((disaster) => disaster.id);
    const nextMedia = await filesToExampleMedia(files, disasterIds);

    setExampleMediaItems((current) => {
      revokeObjectUrls(current);
      return nextMedia;
    });

    if (exampleMode) {
      setExampleSessionEvents((current) => {
        const baseEvents = (current.length ? current : buildExampleEvents([])).map((disaster) => ({
          ...disaster,
          media: (disaster.media || []).filter((media) => media.storage !== "example-picker"),
        }));
        return attachMediaToDisasters(baseEvents, nextMedia);
      });
    }

    setExampleMediaStatus(
      nextMedia.length
        ? `Loaded ${nextMedia.length} example media file${nextMedia.length === 1 ? "" : "s"} into the demo timeline.`
        : "No usable evidence found. The archive is disappointed.",
    );
    showSystemToast(
      nextMedia.length
        ? `Loaded ${nextMedia.length} example media file${nextMedia.length === 1 ? "" : "s"} into the demo timeline.`
        : "No usable evidence found. The archive is disappointed.",
    );
  }

  async function loadExampleMediaFolder() {
    if (!("showDirectoryPicker" in window)) {
      setExampleMediaStatus("Folder picker is not available here. Use Select Example Files instead.");
      exampleFileInputRef.current?.click();
      return;
    }

    try {
      const directoryHandle = await window.showDirectoryPicker();
      const files = [];

      for await (const entry of directoryHandle.values()) {
        if (
          entry.kind !== "file" ||
          !exampleMediaConfig.supportedExtensions.some((extension) => entry.name.toLowerCase().endsWith(extension))
        ) {
          continue;
        }
        files.push(await entry.getFile());
      }

      await loadExampleMediaFiles(files);
    } catch (error) {
      if (error?.name === "AbortError") {
        setExampleMediaStatus("Folder selection cancelled. The evidence closet remains dramatically closed.");
        return;
      }
      setExampleMediaStatus("The archive failed to ingest your evidence. Suspicious.");
      showSystemToast("The archive failed to ingest your evidence. Suspicious.");
    }
  }

  function selectExampleMediaFiles(event) {
    const files = event.target.files;
    loadExampleMediaFiles(files).catch(() => {
      setExampleMediaStatus("The archive failed to ingest your evidence. Suspicious.");
      showSystemToast("The archive failed to ingest your evidence. Suspicious.");
    });
    event.target.value = "";
  }

  function resetExportProgress() {
    setExportProgress({
      active: false,
      phase: "",
      percent: 0,
      currentFile: "",
    });
  }

  function getSafeExportTimelineName(candidateName) {
    const cleaned = String(candidateName || "").trim();
    if (cleaned) return cleaned;
    const activeName = String(activeTimelineMetadata?.name || "").trim();
    if (activeName) return activeName;
    return "Untitled Timeline";
  }

  function setExportNamesFromTimelineName(timelineName) {
    const safeTimelineName = getSafeExportTimelineName(timelineName);
    setExportTimelineName(safeTimelineName);
    setExportFileName(buildAutoFileNameFromTimelineName(safeTimelineName, new Date()));
  }

  function openExportOptions() {
    if (activeSource === SOURCE_TYPES.EXAMPLE) {
      showSystemToast("Example Timeline export enabled. This is demo/test data, not your real timeline.");
    }
    setExportNamesFromTimelineName(activeTimelineMetadata?.name || "Local Timeline");
    setExportFileNameEdited(false);
    setTimelineManagerOpen(false);
    setExportOptionsOpen(true);
  }

  function onExportTimelineNameChange(nextName) {
    setExportTimelineName(nextName);
    if (!exportFileNameEdited) {
      const safeTimelineName = getSafeExportTimelineName(nextName);
      setExportFileName(buildAutoFileNameFromTimelineName(safeTimelineName, new Date()));
    }
  }

  function onExportFileNameChange(nextName) {
    setExportFileName(nextName);
    setExportFileNameEdited(true);
  }

  function matchExportFileNameToTimelineName() {
    const safeTimelineName = getSafeExportTimelineName(exportTimelineName);
    setExportFileName(buildAutoFileNameFromTimelineName(safeTimelineName, new Date()));
    setExportFileNameEdited(true);
  }

  function useCurrentTimelineNameForExport() {
    const safeTimelineName = getSafeExportTimelineName(activeTimelineMetadata?.name);
    setExportTimelineName(safeTimelineName);
    if (!exportFileNameEdited) {
      setExportFileName(buildAutoFileNameFromTimelineName(safeTimelineName, new Date()));
    }
  }

  async function runTimelineExport(mode) {
    const isExampleExport = activeSource === SOURCE_TYPES.EXAMPLE;
    const timelineType = isExampleExport ? "example" : activeTimelineMetadata?.type || activeSource;
    const chosenTimelineName = getSafeExportTimelineName(exportTimelineName);
    const exportDownloadName = toSafeUhohFileName(
      exportFileName,
      buildTimestampedFallbackFileName(new Date(), "timeline-export"),
    );
    const exportTimelineMetadata = {
      ...(activeTimelineMetadata || {}),
      name: chosenTimelineName,
    };
    const commonOptions = {
      events: displayDisasters,
      tags,
      plannedGames,
      knownSecrets: isExampleExport ? [] : knownSecretIds,
      achievements: isExampleExport ? [] : unlockedAchievementIds,
      timeline: exportTimelineMetadata,
      timelineType,
      isExampleExport,
    };

    setExportBusyMode(mode);
    setExportProgress({
      active: true,
      phase: "media",
      percent: 0,
      currentFile: "",
    });

    try {
      if (mode === "legacy") {
        const legacy = exportLegacyTimelineText(commonOptions);
        downloadUhohFile(legacy.text, exportDownloadName);
        setExportOptionsOpen(false);
        showSystemToast("Legacy text export complete. Photos/videos were not included.");
        return;
      }

      const exportFn = mode === "media" ? exportTimelineZipWithMedia : exportTimelineZip;
      const result = await exportFn({
        ...commonOptions,
        includeMedia: mode === "media",
        onProgress: (progress) => {
          if (progress.phase === "media") {
            const percent = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
            setExportProgress({
              active: true,
              phase: "media",
              percent,
              currentFile: progress.mediaFileName || "",
            });
            return;
          }

          setExportProgress({
            active: true,
            phase: "packing",
            percent: Number(progress.percent || 0),
            currentFile: progress.currentFile || "",
          });
        },
      });

      downloadUhohBlob(result.blob, exportDownloadName);
      setExportOptionsOpen(false);

      if (mode === "media") {
        const missingCount = result.warnings.length;
        if (missingCount > 0) {
          showSystemToast(
            `${missingCount} media file${missingCount === 1 ? "" : "s"} could not be found and ${missingCount === 1 ? "was" : "were"} marked missing.`,
          );
        } else {
          showSystemToast(
            `Export complete. This .uhoh includes ${result.mediaCount} media file${result.mediaCount === 1 ? "" : "s"}.`,
          );
        }
      } else {
        showSystemToast("Modern ZIP export complete. Photos/videos were not included.");
      }
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      if (message.includes("memory") || message.includes("out of memory")) {
        showSystemToast(PACK_MEDIA_MEMORY_MESSAGE);
      } else {
        showSystemToast(PACK_MEDIA_ERROR_MESSAGE);
      }
    } finally {
      setExportBusyMode("");
      resetExportProgress();
    }
  }

  async function exportTimelineDataOnly() {
    await runTimelineExport("data");
  }

  async function exportTimelineWithMedia() {
    await runTimelineExport("media");
  }

  async function exportTimelineLegacy() {
    await runTimelineExport("legacy");
  }

  function requestImportTimeline() {
    if (exampleMode) {
      showSystemToast("You are in Example Mode. Importing fake demo nonsense is probably not what you meant.");
    }
    setTimelineManagerOpen(false);
    importFileInputRef.current?.click();
  }

  function copyText(text) {
    if (!text) return;
    if (!globalThis?.navigator?.clipboard?.writeText) return;
    globalThis.navigator.clipboard.writeText(text).catch(() => {});
  }

  function openShareTimelineWindow() {
    const fallbackId = activeLocalTimelineId || localTimelineSource.getActiveTimelineId();
    setShareTimelineTargetId((current) => current || fallbackId);
    if (!peerPassphrase) {
      setPeerPassphrase(generateSecurityKey());
    }
    setTimelineManagerOpen(false);
    setShareTimelineWindowOpen(true);
  }

  function updateShareTimelineTarget(nextTimelineId) {
    if (shareBinding) {
      showSystemToast("Shared session is bound. Stop sharing to switch target timeline.");
      return;
    }
    setShareTimelineTargetId(nextTimelineId);
  }

  async function startPeerHostSession() {
    const timeline = localTimelines.find((item) => item.id === shareTimelineTargetId) || activeLocalTimeline;
    if (!timeline) {
      setPeerStatusMessage("No timeline selected for sharing.");
      return;
    }
    const passphrase = String(peerPassphrase || "").trim();
    if (!passphrase) {
      setPeerStatusMessage("Add a security key before starting peer sync.");
      return;
    }

    closePeerSession();
    const session = createHostSession({
      hostDisplayName: peerDisplayName || mockAuthSession?.username || "Host",
      sharedTimelineId: timeline.id,
      sharedTimelineCode: timeline.timelineCode || "",
      sharedTimelineName: timeline.name || "Local Timeline",
      getTimelineChecksum: () => buildTimelineChecksumForBinding({
        sharedTimelineId: timeline.id,
        sharedTimelineCode: timeline.timelineCode || "",
      }),
    });

    attachPeerSessionListeners(session);
    peerSessionRef.current = session;

    const cryptoSalt = await session.setSecurityPassphrase(passphrase, generateSalt());
    const offer = await session.createOffer();
    const invitePayload = {
      version: 1,
      kind: "offer",
      sessionId: session.sessionId,
      hostDisplayName: peerDisplayName || "Host",
      sharedTimelineId: timeline.id,
      sharedTimelineCode: timeline.timelineCode || "",
      sharedTimelineName: timeline.name || "Local Timeline",
      cryptoSalt,
      sessionDescription: offer,
    };
    const code = encodePeerCode(invitePayload);
    setPeerMode("host");
    setPeerInviteCode(code);
    setPeerAnswerCode("");
    setPeerStatusMessage("Invite code ready. Waiting for guest answer...");
    setShareBinding({
      sessionId: session.sessionId,
      sharedTimelineId: timeline.id,
      sharedTimelineCode: timeline.timelineCode || "",
      sharedTimelineName: timeline.name || "Local Timeline",
      hostDisplayName: peerDisplayName || "Host",
      createdAt: new Date().toISOString(),
      status: "waiting",
    });
  }

  async function applyPeerAnswerCode() {
    if (!peerSessionRef.current) {
      setPeerStatusMessage("Start host session before applying an answer code.");
      return;
    }
    try {
      const decoded = decodePeerCode(peerAnswerCode);
      const validity = validatePeerCode(decoded);
      if (!validity.valid || decoded.kind !== "answer") {
        setPeerStatusMessage("Invalid answer code.");
        return;
      }
      await peerSessionRef.current.acceptAnswer(decoded.sessionDescription);
      if (decoded.guestId || decoded.guestDisplayName) {
        upsertPeerGuest({
          guestId: decoded.guestId || `guest-${Date.now()}`,
          displayName: decoded.guestDisplayName || "Guest",
          joinedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          connectionState: "connecting",
          permissions: clonePeerPermissions(defaultPeerPermissions),
        });
      }
      setPeerStatusMessage("Answer accepted. Waiting for data channel...");
    } catch {
      setPeerStatusMessage("Could not decode answer code.");
    }
  }

  async function generatePeerAnswerCode() {
    const passphrase = String(peerPassphrase || "").trim();
    if (!passphrase) {
      setPeerStatusMessage("Enter the same security key as the host.");
      return;
    }

    try {
      const decoded = decodePeerCode(peerInviteCode);
      const validity = validatePeerCode(decoded);
      if (!validity.valid || decoded.kind !== "offer") {
        setPeerStatusMessage("Invalid invite code.");
        return;
      }

      closePeerSession();
      const session = createJoinSession({
        guestDisplayName: peerDisplayName || "Guest",
        hostDisplayName: decoded.hostDisplayName || "Host",
        sharedTimelineId: decoded.sharedTimelineId || "",
        sharedTimelineCode: decoded.sharedTimelineCode || "",
        sharedTimelineName: decoded.sharedTimelineName || "Shared Timeline",
      });
      attachPeerSessionListeners(session);
      peerSessionRef.current = session;
      await session.setSecurityPassphrase(passphrase, decoded.cryptoSalt || "");
      const answer = await session.acceptOfferAndCreateAnswer(decoded.sessionDescription);

      const answerPayload = {
        version: 1,
        kind: "answer",
        sessionId: decoded.sessionId || session.sessionId,
        guestId: `guest-${Date.now().toString(36)}`,
        guestDisplayName: peerDisplayName || "Guest",
        sessionDescription: answer,
      };
      setPeerMode("join");
      setPeerAnswerCode(encodePeerCode(answerPayload));
      setPeerStatusMessage("Answer code ready. Send it back to the host.");
      setShareBinding({
        sessionId: decoded.sessionId || session.sessionId,
        sharedTimelineId: decoded.sharedTimelineId || "",
        sharedTimelineCode: decoded.sharedTimelineCode || "",
        sharedTimelineName: decoded.sharedTimelineName || "Shared Timeline",
        hostDisplayName: decoded.hostDisplayName || "Host",
        createdAt: new Date().toISOString(),
        status: "joining",
      });
      void session.sendMessage({
        type: PEER_MESSAGE_TYPES.GUEST_RENAMED,
        guestId: answerPayload.guestId,
        oldName: "",
        newName: answerPayload.guestDisplayName,
      });
    } catch {
      setPeerStatusMessage("Could not decode invite code.");
    }
  }

  async function sendPeerChatMessage() {
    const text = String(peerChatDraft || "").trim();
    if (!text) return;
    setPeerChatDraft("");
    setPeerChatMessages((current) => [
      ...current.slice(-99),
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fromName: peerDisplayName || "You",
        text,
        sentAt: new Date().toISOString(),
      },
    ]);
    await peerSessionRef.current?.sendMessage({
      type: PEER_MESSAGE_TYPES.CHAT_MESSAGE,
      scope: "group",
      fromName: peerDisplayName || "You",
      text,
    });
  }

  function disconnectPeerSession() {
    closePeerSession();
    setShareBinding(null);
    setPeerInviteCode("");
    setPeerAnswerCode("");
    setPeerGuests([]);
    setPeerStatusMessage("Disconnected");
  }

  function updateGuestPermissions(guestId, permissions) {
    setPeerGuests((current) =>
      current.map((guest) => (guest.guestId === guestId ? { ...guest, permissions } : guest)),
    );
    void peerSessionRef.current?.sendMessage({
      type: PEER_MESSAGE_TYPES.PERMISSION_UPDATED,
      guestId,
      permissions,
    });
  }

  function forgetPersistentSession(sessionId) {
    removePersistentPeerSession(sessionId);
    setPersistentPeerSessions(loadPersistentPeerSessions());
  }

  async function selectImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const result = await importTimelineFile(file);
      if (!result.valid) {
        window.alert(result.errors?.[0] || CORRUPT_FILE_MESSAGE);
        showSystemToast(result.errors?.[0] || CORRUPT_FILE_MESSAGE);
        return;
      }
      setPendingImport(result);
    } catch {
      showSystemToast(CORRUPT_FILE_MESSAGE);
    }
  }

  async function materializeImport(mode, existingEvents, targetTimelineId) {
    const normalized = await normalizeImportedTimeline(pendingImport, {
      mode,
      existingEvents,
      targetTimelineId,
    });

    if (!normalized.valid || !normalized.data) {
      showSystemToast(CORRUPT_FILE_MESSAGE);
      return null;
    }

    if (normalized.missingMediaCount > 0) {
      showSystemToast(
        `${normalized.missingMediaCount} media file${normalized.missingMediaCount === 1 ? "" : "s"} ${normalized.missingMediaCount === 1 ? "was" : "were"} missing and marked as broken evidence.`,
      );
    }

    return normalized;
  }

  async function mergeImport() {
    if (!pendingImport?.data) return;
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Import merge denied by fake bureaucracy.");
      return;
    }

    if (exampleMode) {
      const normalized = await materializeImport("merge", exampleSessionEvents, "example");
      if (!normalized) return;
      normalized.data.events.forEach((eventItem) => markTimelineChange(eventItem.id, "created", "import"));
      setExampleSessionEvents((current) => [...current, ...normalized.data.events]);
      setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
      setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));
      setPendingImport(null);
      showSystemToast("Import merged into Example Mode. Demo nonsense has eaten more demo nonsense.");
      return;
    }

    const normalized = await materializeImport("merge", disasters, activeTimelineMetadata?.id || "");
    if (!normalized) return;
    normalized.data.events.forEach((eventItem) => markTimelineChange(eventItem.id, "created", "import"));
    const nextEvents = [...disasters, ...normalized.data.events];

    setDisasters(nextEvents);
    if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
      mockSyncedTimelineSource.saveEvents(null, nextEvents);
      mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
    }

    setTags((current) => {
      const nextTags = uniqueByName([...current, ...normalized.data.tags]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) mockSyncedTimelineSource.saveTags(null, nextTags);
      return nextTags;
    });
    setPlannedGames((current) => {
      const nextGames = uniqueByName([...current, ...normalized.data.plannedGames]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) mockSyncedTimelineSource.savePlannedGames(null, nextGames);
      return nextGames;
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));
    setSyncStatus(mockSyncedTimelineSource.getStatus());
    setPendingImport(null);
    showSystemToast("Import merged. The timeline absorbed more evidence.");
  }

  function getLocalTimelineSnapshot(timelineId) {
    if (!timelineId) return { events: [], tags: defaultTags, plannedGames: defaultPlannedGames };
    if (selectedTimelineSource === SOURCE_TYPES.LOCAL && timelineId === activeLocalTimelineId) {
      return {
        events: disasters,
        tags,
        plannedGames,
      };
    }
    return {
      events: localTimelineSource.listEvents(timelineId),
      tags: localTimelineSource.listTags(timelineId, defaultTags),
      plannedGames: localTimelineSource.listPlannedGames(timelineId, defaultPlannedGames),
    };
  }

  function applyLocalTimelineSnapshot(timelineId, snapshot, { renameTo } = {}) {
    if (!timelineId) return;
    localTimelineSource.saveEvents(timelineId, snapshot.events || []);
    localTimelineSource.saveTags(timelineId, snapshot.tags || []);
    localTimelineSource.savePlannedGames(timelineId, snapshot.plannedGames || []);
    if (renameTo) {
      localTimelineSource.renameTimeline(timelineId, renameTo);
    }
    refreshLocalTimelineList();
    if (selectedTimelineSource === SOURCE_TYPES.LOCAL && timelineId === activeLocalTimelineId) {
      setDisasters(snapshot.events || []);
      setTags(uniqueByName([...(snapshot.tags || []), ...defaultTags]));
      setPlannedGames(snapshot.plannedGames || []);
    }
  }

  async function mergeIntoMatchingTimeline({ timelineId } = {}) {
    if (!pendingImport?.data || !timelineId) return;
    const existing = getLocalTimelineSnapshot(timelineId);
    const normalized = await materializeImport("merge", existing.events, timelineId);
    if (!normalized) return;
    const merged = mergeTimelineData(
      {
        events: existing.events,
        tags: existing.tags,
        plannedGames: existing.plannedGames,
      },
      normalized.data,
      { conflictStrategy: "keep-local" },
    );

    applyLocalTimelineSnapshot(timelineId, {
      events: merged.events,
      tags: uniqueByName([...(merged.tags || []), ...defaultTags]),
      plannedGames: merged.plannedGames,
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));
    setPendingImport(null);
    showSystemToast("Merged into matching timeline by timeline code.");
  }

  async function updateExistingTimelineFromImport({ timelineId } = {}) {
    if (!pendingImport?.data || !timelineId) return;
    const existing = getLocalTimelineSnapshot(timelineId);
    const normalized = await materializeImport("replace", existing.events, timelineId);
    if (!normalized) return;
    const updated = updateTimelineData(
      {
        events: existing.events,
        tags: existing.tags,
        plannedGames: existing.plannedGames,
      },
      normalized.data,
      {
        conflictStrategy: "imported-wins",
        keepLocalOnlyEvents: false,
      },
    );
    applyLocalTimelineSnapshot(timelineId, {
      events: updated.events,
      tags: uniqueByName([...(updated.tags || []), ...defaultTags]),
      plannedGames: updated.plannedGames,
    }, {
      renameTo: pendingImport.summary?.timelineName || undefined,
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));
    setPendingImport(null);
    showSystemToast("Existing timeline updated from matching timeline export.");
  }

  function ensureUniqueTimelineName(preferredName) {
    const cleaned = String(preferredName || "").trim() || "Imported Timeline";
    const existingLower = new Set(localTimelines.map((timeline) => String(timeline.name || "").toLowerCase()));
    if (!existingLower.has(cleaned.toLowerCase())) return cleaned;
    let suffix = 1;
    let candidate = `${cleaned} (Imported)`;
    while (existingLower.has(candidate.toLowerCase())) {
      suffix += 1;
      candidate = `${cleaned} (Imported ${suffix})`;
    }
    return candidate;
  }

  async function importAsNewTimeline({ timelineName, importAsNewCopy = false } = {}) {
    if (!pendingImport?.data) return;
    const isNewCopy = Boolean(importAsNewCopy);
    const sourceName = String(
      timelineName
        || pendingImport.summary?.timelineName
        || (pendingImport.summary?.isExampleExport ? "Example Timeline Imported" : "Imported Timeline"),
    ).trim() || "Imported Timeline";
    const newTimelineId = `local-${createId()}`;
    const normalized = await materializeImport("new", [], newTimelineId);
    if (!normalized) return;
    const timeline = createLocalTimeline(ensureUniqueTimelineName(sourceName), {
      id: newTimelineId,
      events: normalized.data.events,
      tags: uniqueByName([...defaultTags, ...normalized.data.tags]),
      plannedGames: uniqueByName(normalized.data.plannedGames),
      ...(isNewCopy
        ? {
            lineage: {
              originalTimelineCode: pendingImport.summary?.timelineCode || "",
            },
            copiedFromTimelineCode: pendingImport.summary?.timelineCode || "",
            copiedFromTimelineName: pendingImport.summary?.timelineName || "",
          }
        : {
            timelineCode: pendingImport.summary?.timelineCode || "",
          }),
      importedByName: peerDisplayName || mockAuthSession?.username || "You",
      importedAt: new Date().toISOString(),
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));
    normalized.data.events.forEach((eventItem) => markTimelineChange(eventItem.id, "created", "import"));
    setPendingImport(null);
    showSystemToast(`Imported as ${timeline.name}. The current timeline was spared.`);
  }

  async function replaceImport(options = {}) {
    if (!pendingImport?.data) return;
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Replace denied before history got splattered.");
      return;
    }

    const replaceTargetTimelineId = activeTimelineMetadata?.id || "";
    const normalized = await materializeImport("replace", [], replaceTargetTimelineId);
    if (!normalized) return;
    const nextEvents = normalized.data.events;
    nextEvents.forEach((eventItem) => markTimelineChange(eventItem.id, "created", "import"));

    if (exampleMode) {
      setExampleSessionEvents(nextEvents);
    } else {
      setDisasters(nextEvents);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveEvents(null, nextEvents);
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
    }

    const nextTags = uniqueByName([...defaultTags, ...normalized.data.tags]);
    const nextPlannedGames = uniqueByName(normalized.data.plannedGames);
    setTags(nextTags);
    setPlannedGames(nextPlannedGames);
    if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK && !exampleMode) {
      mockSyncedTimelineSource.saveTags(null, nextTags);
      mockSyncedTimelineSource.savePlannedGames(null, nextPlannedGames);
      setSyncStatus(mockSyncedTimelineSource.getStatus());
    }
    setKnownSecretIds((current) => uniqueByName([...current, ...normalized.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...normalized.data.achievements]));

    if (!exampleMode && selectedTimelineSource === SOURCE_TYPES.LOCAL && activeLocalTimelineId) {
      const importedName = String(pendingImport.summary?.timelineName || "").trim();
      const currentName = String(activeTimelineMetadata?.name || "Local Timeline").trim() || "Local Timeline";
      let requestedName = currentName;
      if (options.namingMode === "use-imported") {
        requestedName = importedName || currentName;
      } else if (options.namingMode === "custom") {
        requestedName = String(options.customName || "").trim() || currentName;
      }
      localTimelineSource.renameTimeline(activeLocalTimelineId, requestedName);
      refreshLocalTimelineList();
    }

    setPendingImport(null);
    setDetailDisasterId(null);
    setShowForm(false);
    setEditingId(null);
    showSystemToast("Timeline replaced. History has been legally rearranged.");
  }

  function resetWebsite() {
    clearAppStorage();
    cleanupOrphanedMedia([]).catch(() => {
      // If IndexedDB cleanup fails, localStorage wipe still succeeded.
    });
    const resetLocal = localTimelineSource.ensureLocalTimelineStorage();
    const activeId = resetLocal.activeTimelineId;
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    setLocalTimelines(resetLocal.timelines);
    setActiveLocalTimelineId(activeId);
    setDisasters([]);
    setTags(defaultTags);
    setPlannedGames(defaultPlannedGames);
    setUnlockedAchievementIds([]);
    setKnownSecretIds([]);
    setFlags({});
    setAdminMode(false);
    setAdminPanelOpen(false);
    setLoreHelperOpen(false);
    setAchievementsOpen(false);
    setExampleMode(false);
    setExampleSessionEvents([]);
    setFakeAd(null);
    setTosMessage(null);
    setAgeGateMessage(null);
    setCaptchaVariant(null);
    setPendingDisaster(null);
    setLongTosOpen(false);
    setDetailDisasterId(null);
    setPendingDeleteId(null);
    setPendingImport(null);
    setTimelineManagerOpen(false);
    setShareTimelineWindowOpen(false);
    disconnectPeerSession();
    setPersistentPeerSessions([]);
    setExportOptionsOpen(false);
    setExportBusyMode("");
    setExportTimelineName("");
    setExportFileName("");
    setExportFileNameEdited(false);
    resetExportProgress();
    setAccountOpen(false);
    setMockAuthSession(null);
    setSyncStatus(mockSyncedTimelineSource.getStatus());
    setRecentTimelineChanges({});
    setExampleMediaItems((current) => {
      revokeObjectUrls(current);
      return [];
    });
    setExampleMediaStatus("");
    setExampleLoadState({ phase: "idle", message: "" });
    setExampleSourceLabel("");
    setExampleFallbackNotice("");
    setLimeUnlocked(false);
    const resetLime = createDefaultLimeState();
    setLimeState(resetLime);
    setLimeFruitState(createInitialFruitEventState(new Date()));
    setLimevementsState(resetLimevementsState());
    setLimevementsOpen(false);
    clearLimeMultiplayerSessions();
    setLimeMultiplayerSessions([]);
    setActiveLimeMultiplayerSessionIdState("");
    setLimeMode("solo");
    setLimeWindowOpen(false);
    setLimeOfflineGains(0);
    setLimeSaveStatus("Saved");
    closeForm();
    showSystemToast("Website data wiped. Only app-specific evidence was harmed.");
  }

  function loginMockAccount(username) {
    const session = createMockSession(username);
    setMockAuthSession(session);
    return session;
  }

  function logoutMockAccount() {
    setMockAuthSession(null);
  }

  function simulateRemoteUpdate() {
    mockSyncedTimelineSource.simulateRemoteUpdate();
    setSyncStatus((current) => ({
      ...current,
      label: "Checking...",
      detail: "Checking shared timeline... yelling into localStorage.",
    }));
    showSystemToast("Simulated remote update queued. The next poll will act surprised.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-100 selection:bg-red-400/40 selection:text-white">
      <BackgroundLights />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <Header
            onAddDisaster={openNewDisasterForm}
            onOpenNodeWeb={openNodeWeb}
            adminMode={adminMode}
            onSecretBadgeClick={handleTitleBadgeClick}
            onAdminLongPress={triggerAdminMode}
            canEdit={canEditCurrentTimeline}
            readOnlyReason={readOnlyReason}
          />
          <GamesPanel
            gameStats={gameStats}
            plannedGames={plannedGames}
            onAddPlannedGame={addPlannedGame}
            onRemovePlannedGame={removePlannedGame}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-zinc-900/80 px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-50 transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {mockAuthSession ? mockAuthSession.username : "Account"}
          </button>
          {adminMode ? (
            <button
              type="button"
              onClick={() => setAdminPanelOpen(true)}
              className="min-h-11 rounded-full border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              ADMIN
            </button>
          ) : null}
          <AnimatePresence>
            {limeUnlocked || limeState.unlocked ? <LimeButton onOpen={() => setLimeWindowOpen(true)} /> : null}
          </AnimatePresence>
        </div>

        {exampleMode ? (
          <ExampleModeBanner
            onExit={exitExampleMode}
            onLoadFolder={loadExampleMediaFolder}
            onSelectFiles={selectExampleMediaFiles}
            mediaCount={exampleMediaItems.length}
            generatedMediaCount={generatedExampleMedia.length}
            mediaStatus={exampleMediaStatus}
            sourceLabel={exampleSourceLabel}
            fallbackNotice={exampleFallbackNotice}
            fileInputRef={exampleFileInputRef}
          />
        ) : null}

        <AnimatePresence>
          {showForm ? (
            <DisasterForm
              disasters={displayDisasters}
              games={games}
              tags={tags}
              editingDisaster={editingDisaster}
              onSave={handleSaveDisaster}
              onDelete={requestDeleteDisaster}
              onClose={closeForm}
            />
          ) : null}
        </AnimatePresence>

        <SearchBar value={search} onChange={setSearch} />

        <Timeline
          disasters={filteredDisasters}
          totalCount={displayDisasters.length}
          onEdit={openEditForm}
          onDelete={requestDeleteDisaster}
          onOpenDetail={setDetailDisasterId}
          onReorderYear={reorderYear}
          sourceSelector={
            <TimelineManagerButton
              sourceType={activeSource}
              activeTimelineName={activeTimelineMetadata?.name}
              onOpen={() => setTimelineManagerOpen(true)}
            />
          }
          recentChanges={recentTimelineChanges}
          canEdit={canEditCurrentTimeline}
          readOnlyReason={readOnlyReason}
        />
      </main>

      <footer className="relative z-10 mx-5 mb-8 max-w-7xl rounded-3xl border border-white/15 bg-zinc-900/70 p-6 text-center text-sm font-medium text-zinc-100 shadow-2xl shadow-black/25 backdrop-blur md:mx-8 xl:mx-auto">
        {footerMessage.before}{" "}
        <button
          type="button"
          onClick={handleCanonLevelClick}
          className="cursor-help font-semibold text-sky-100 transition hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/30"
        >
          {footerMessage.canon}
        </button>
        : {footerMessage.after}
        {/* This website's code is sadly made by AI. */}
            <span className="sr-only">This website&apos;s code is sadly made by AI.</span>
      </footer>

      <AnimatePresence>
        {nodeWebOpen ? (
          <NodeWebModal
            disasters={displayDisasters}
            onClose={() => setNodeWebOpen(false)}
            onNodeBashAchievement={() => unlock("node_basher")}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {ageGateMessage ? <AgeGateModal message={ageGateMessage} onClose={() => setAgeGateMessage(null)} /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {fakeAd ? <FakeAdWindow ad={fakeAd} onClose={() => setFakeAd(null)} /> : null}
      </AnimatePresence>
      <AnimatePresence>
        {detailDisaster ? (
          <DisasterDetailWindow
            disaster={detailDisaster}
            onClose={() => setDetailDisasterId(null)}
            onEdit={openEditForm}
            onDelete={requestDeleteDisaster}
            onOpenNodeWeb={openNodeWeb}
            canEdit={canEditCurrentTimeline}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {achievementsOpen ? (
          <AchievementsWindow
            unlockedIds={unlockedAchievementIds}
            knownSecretIds={knownSecretIds}
            adminMode={adminMode}
            onClose={() => setAchievementsOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {adminPanelOpen ? (
          <AdminPanel
            onClose={() => setAdminPanelOpen(false)}
            onOpenAchievements={() => triggerFromAdmin(openAchievementsWindow)}
            onOpenTimelineManager={() => triggerFromAdmin(() => setTimelineManagerOpen(true))}
            onOpenNodeWeb={() => triggerFromAdmin(openNodeWeb)}
            onShowTos={() => triggerFromAdmin(() => showTosBar(true))}
            onTriggerCaptcha={() => triggerFromAdmin(triggerManualCaptcha)}
            onTriggerAd={() => triggerFromAdmin(() => triggerFakeAd(true))}
            onTriggerOrb={() => triggerFromAdmin(triggerManualOrb)}
            onEnterExampleMode={() => {
              setAdminPanelOpen(false);
              setTimelineManagerOpen(true);
            }}
            onExitExampleMode={exitExampleMode}
            onLoadExampleMediaFolder={loadExampleMediaFolder}
            onReset={resetWebsite}
            onSimulateRemoteUpdate={simulateRemoteUpdate}
            exampleMode={exampleMode}
            counts={{
              disasters: displayDisasters.length,
              achievements: unlockedAchievementIds.length,
              mode: activeSource === SOURCE_TYPES.SYNCED_MOCK ? "Mock Sync" : activeSource === SOURCE_TYPES.EXAMPLE ? "Example" : "Local",
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {timelineManagerOpen ? (
          <TimelineManagerWindow
            onClose={() => setTimelineManagerOpen(false)}
            selectedSource={activeSource}
            activeTimelineMetadata={activeTimelineMetadata}
            activeLocalTimelineId={activeLocalTimelineId}
            localTimelines={localTimelines}
            syncStatus={syncStatus}
            canEditSharedTimeline={Boolean(mockAuthSession?.canEditRealTimeline)}
            onSelectSource={selectTimelineSource}
            onSwitchLocalTimeline={switchLocalTimeline}
            onCreateLocalTimeline={createLocalTimeline}
            onRenameLocalTimeline={renameLocalTimeline}
            onDuplicateLocalTimeline={duplicateLocalTimeline}
            onDeleteLocalTimeline={deleteLocalTimeline}
            onOpenExport={openExportOptions}
            onOpenImport={requestImportTimeline}
            onOpenShareTimeline={openShareTimelineWindow}
            onEnterExampleMode={enterExampleMode}
            onExitExampleMode={exitExampleMode}
            exampleMode={exampleMode}
            exampleLoadState={exampleLoadState}
            exampleSourceLabel={exampleSourceLabel}
            exampleFallbackNotice={exampleFallbackNotice}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {shareTimelineWindowOpen ? (
          <ShareTimelineWindow
            onClose={() => setShareTimelineWindowOpen(false)}
            localTimelines={localTimelines}
            sharedTimelineId={shareTimelineTargetId}
            onSharedTimelineChange={updateShareTimelineTarget}
            shareStatus={{
              boundTimelineName: shareBinding?.sharedTimelineName || "",
              connectionState: peerConnectionState,
            }}
            inviteFlowProps={{
              mode: peerMode,
              connectionState: peerConnectionState,
              displayName: peerDisplayName,
              passphrase: peerPassphrase,
              inviteCode: peerInviteCode,
              answerCode: peerAnswerCode,
              statusMessage: peerStatusMessage,
              waitingForAnswer: peerConnectionState !== "connected",
              onDisplayNameChange: setPeerDisplayName,
              onPassphraseChange: setPeerPassphrase,
              onInviteCodeChange: setPeerInviteCode,
              onAnswerCodeChange: setPeerAnswerCode,
              onStartHost: startPeerHostSession,
              onGenerateAnswer: generatePeerAnswerCode,
              onApplyAnswer: applyPeerAnswerCode,
              onCopyInviteCode: () => copyText(peerInviteCode),
              onCopyAnswerCode: () => copyText(peerAnswerCode),
              onDisconnect: disconnectPeerSession,
            }}
            guests={peerGuests}
            onUpdateGuestPermissions={updateGuestPermissions}
            persistentSessions={persistentPeerSessions}
            onForgetPersistentSession={forgetPersistentSession}
            onViewCachedSession={() => showSystemToast("Cached session view scaffolded. Full cached reader TODO.")}
            onTryReconnectSession={() => showSystemToast("Reconnect scaffolded. Paste latest invite/answer codes to reconnect.")}
            onSaveSessionAsLocalCopy={() => showSystemToast("Save-as-local-copy scaffolded. Local copy materializer TODO.")}
            chatMessages={peerChatMessages}
            chatDraft={peerChatDraft}
            onChatDraftChange={setPeerChatDraft}
            onSendChatMessage={sendPeerChatMessage}
            peerMode={peerMode}
            onPeerModeChange={setPeerMode}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {exportOptionsOpen ? (
          <ExportOptionsWindow
            summary={exportMediaSummary}
            progress={exportProgress}
            busyMode={exportBusyMode}
            timelineName={exportTimelineName}
            fileName={exportFileName}
            currentTimelineName={activeTimelineMetadata?.name || "Local Timeline"}
            onTimelineNameChange={onExportTimelineNameChange}
            onFileNameChange={onExportFileNameChange}
            onMatchFileNameToTimeline={matchExportFileNameToTimelineName}
            onUseCurrentTimelineName={useCurrentTimelineNameForExport}
            onExportDataOnly={exportTimelineDataOnly}
            onExportWithMedia={exportTimelineWithMedia}
            onExportLegacy={exportTimelineLegacy}
            onCancel={() => {
              if (exportBusyMode) return;
              setExportOptionsOpen(false);
              setExportFileNameEdited(false);
              resetExportProgress();
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {loreHelperOpen ? (
          <WebsiteLoreHelper
            onClose={() => setLoreHelperOpen(false)}
            knownSecretIds={knownSecretIds}
            adminMode={adminMode}
            limeUnlocked={limeUnlocked || limeState.unlocked}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {accountOpen ? (
          <AccountWindow
            session={mockAuthSession}
            onLogin={loginMockAccount}
            onLogout={logoutMockAccount}
            onClose={() => setAccountOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {captchaVariant ? (
          <FakeCaptchaModal
            variant={captchaVariant}
            onComplete={completeCaptcha}
            closeOnOutsideClick={!pendingDisaster}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {longTosOpen ? (
          <LongTosWindow
            onAccept={acceptTerms}
            onJokeClose={() => setLongTosOpen(false)}
            onClose={() => setLongTosOpen(false)}
            onScrolledBottom={() => unlock("scrolled_tos")}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {tosMessage ? (
          <TermsBar
            message={tosMessage}
            onAccept={acceptTerms}
            onReview={reviewTerms}
            onDismiss={dismissTerms}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {toastAchievement ? (
          <AchievementToast achievement={toastAchievement} onClose={() => setToastAchievement(null)} />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{systemToast ? <TimelineToast message={systemToast} /> : null}</AnimatePresence>
      <AnimatePresence>
        {limeWindowOpen ? (
          <LimeClickerWindow
            state={limeState}
            limesPerClick={limePerClick}
            limesPerSecond={limePerSecond}
            saveStatus={limeSaveStatus}
            offlineGains={limeOfflineGains}
            onClickLime={onClickLime}
            onPurchaseUpgrade={onPurchaseLimeUpgrade}
            onReset={resetLimeProgress}
            limeMode={limeMode}
            onSetLimeMode={setLimeMode}
            onHostMultiplayer={hostLimeMultiplayerSession}
            onJoinMultiplayer={joinLimeMultiplayerSession}
            onDisconnectMultiplayer={disconnectLimeMultiplayerSession}
            multiplayerSessionName={activeLimeMultiplayerSession?.name || ""}
            multiplayerPeersCount={activeLimeMultiplayerSession?.peers?.length || 0}
            multiplayerSyncStatus={limeMode === "multiplayer" ? "Peer Lime requires the host tab to stay open. No host, no shared citrus." : "No multiplayer session active."}
            fruitState={limeFruitState}
            onClearLemon={clearActiveLemon}
            limevementsState={limevementsState}
            limevementsOpen={limevementsOpen}
            onToggleLimevements={() => setLimevementsOpen((current) => !current)}
            onClose={() => setLimeWindowOpen(false)}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {pendingDeleteId ? (
          <DeleteConfirmWindow
            disaster={pendingDeleteDisaster}
            onCancel={() => setPendingDeleteId(null)}
            onConfirm={confirmDeleteDisaster}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {pendingImport ? (
          <ImportPreviewWindow
            importResult={pendingImport}
            currentTimelineName={activeTimelineMetadata?.name || "Local Timeline"}
            existingTimelineNames={existingTimelineNames}
            matchingTimeline={matchingImportTimeline}
            onImportAsNew={importAsNewTimeline}
            onMerge={mergeImport}
            onMergeExisting={mergeIntoMatchingTimeline}
            onUpdateExisting={updateExistingTimelineFromImport}
            onReplace={replaceImport}
            onCancel={() => setPendingImport(null)}
          />
        ) : null}
      </AnimatePresence>
      <input
        ref={importFileInputRef}
        type="file"
        accept=".uhoh,.json,text/plain,application/json,application/zip,application/octet-stream"
        className="sr-only"
        onChange={selectImportFile}
      />
      <ChaosOrb
        active={orb.active}
        path={orb.path}
        triggerKey={orb.key}
        onComplete={() => setOrb((current) => ({ ...current, active: false }))}
        onHoverTrigger={triggerObservedOrb}
        onForegroundEscapeTap={onOrbForegroundEscapeTap}
      />
      <AdminModeOverlay active={adminAnimationActive} />
      <ReactionOverlayHost />
    </div>
  );
}
