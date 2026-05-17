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
import FakeAdWindow from "./components/FakeAdWindow";
import FakeCaptchaModal from "./components/FakeCaptchaModal";
import GamesPanel from "./components/GamesPanel";
import Header from "./components/Header";
import ImportPreviewWindow from "./components/ImportPreviewWindow";
import LongTosWindow from "./components/LongTosWindow";
import NodeWebModal from "./components/NodeWebModal";
import ReactionOverlayHost from "./components/ReactionOverlayHost";
import SearchBar from "./components/SearchBar";
import TermsBar from "./components/TermsBar";
import Timeline from "./components/Timeline";
import TimelineSourceSelector from "./components/TimelineSourceSelector";
import TimelineToast from "./components/TimelineToast";
import WebsiteLoreLedger from "./components/WebsiteLoreLedger";
import { ageGateMessages } from "./data/ageGateMessages";
import { captchaVariants } from "./data/captchaVariants";
import { defaultPlannedGames } from "./data/defaultPlannedGames";
import { defaultTags } from "./data/defaultTags";
import { exampleTimeline } from "./data/exampleTimeline";
import { exampleMediaConfig } from "./data/exampleMediaConfig";
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
import { createMockSession, loadMockAuthSession, saveMockAuthSession } from "./utils/mockAuth";
import {
  buildUhohFileName,
  downloadUhohFile,
  exportTimelineData,
  parseTimelineImportFile,
} from "./utils/exportImport";
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
  const [loreLedgerOpen, setLoreLedgerOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mockAuthSession, setMockAuthSession] = useState(() => loadMockAuthSession());
  const [syncStatus, setSyncStatus] = useState(() => mockSyncedTimelineSource.getStatus());
  const [recentTimelineChanges, setRecentTimelineChanges] = useState({});
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

  const majorWindowOpen = Boolean(
    ageGateMessage ||
      nodeWebOpen ||
      achievementsOpen ||
      captchaVariant ||
      fakeAd ||
      adminPanelOpen ||
      loreLedgerOpen ||
      longTosOpen ||
      detailDisaster ||
      pendingDeleteId ||
      pendingImport,
  );

  useEffect(() => {
    modalStateRef.current = { majorWindowOpen };
  }, [majorWindowOpen]);

  useEffect(() => {
    disastersRef.current = disasters;
  }, [disasters]);

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
    return () => revokeObjectUrls(exampleMediaItems);
  }, [exampleMediaItems]);

  useEffect(() => {
    return () => {
      window.clearTimeout(systemToastTimer.current);
      timelineChangeTimers.current.forEach((timer) => window.clearTimeout(timer));
      timelineChangeTimers.current = [];
    };
  }, []);

  const showSystemToast = useCallback((message) => {
    setSystemToast(message);
    window.clearTimeout(systemToastTimer.current);
    systemToastTimer.current = window.setTimeout(() => setSystemToast(""), 2800);
  }, []);

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

  const leaveExampleMode = useCallback(() => {
    setExampleMode(false);
    setExampleSessionEvents([]);
    setDetailDisasterId(null);
    setShowForm(false);
    setEditingId(null);
  }, []);

  const selectTimelineSource = useCallback((source) => {
    if (source === SOURCE_TYPES.EXAMPLE) {
      setSelectedTimelineSource(SOURCE_TYPES.EXAMPLE);
      setExampleMode(true);
      setExampleSessionEvents(buildExampleEvents(exampleMediaItems));
      setShowForm(false);
      setEditingId(null);
      setExampleMediaStatus("Example mode edits are temporary. The archive will deny everything later.");
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
  }, [activeLocalTimelineId, buildExampleEvents, exampleMediaItems, leaveExampleMode, loadLocalTimelineData, loadMockSyncedData, showSystemToast]);

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

  const openWebsiteLoreLedger = useCallback(() => {
    if (!adminMode) return;

    discoverSecret("lore");
    setLoreLedgerOpen(true);
    unlock("website_lore_ledger");
  }, [adminMode, discoverSecret, unlock]);

  const triggerFromAdmin = useCallback((action) => {
    setAdminPanelOpen(false);
    setLoreLedgerOpen(false);
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
      onLore: openWebsiteLoreLedger,
    });
  }, [discoverSecret, openAchievementsWindow, openWebsiteLoreLedger, showTosBar, triggerAdminMode, triggerFakeAd, triggerManualAgeGate, triggerManualCaptcha, triggerManualOrb]);

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

  function performSaveDisaster(draft, { closeAfterSave = false } = {}) {
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
    nextDisaster.media = Array.isArray(draft.media)
      ? draft.media.map((media, index) => ({
          ...media,
          disasterId: nextDisaster.id,
          order: Number.isFinite(Number(media.order)) ? Number(media.order) : index,
        }))
      : [];
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

    if (isCustomTag) {
      unlock("custom_tag");
    }

    showSystemToast(isNewDisaster ? "Disaster archived. The timeline got worse." : "History rewritten. Very normal behavior.");

    if (draft.id || closeAfterSave || isNewDisaster) {
      closeForm();
    }

    return true;
  }

  function handleSaveDisaster(draft) {
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

  function completeCaptcha(achievementId) {
    const disasterToSave = pendingDisaster;
    setCaptchaVariant(null);
    setPendingDisaster(null);
    unlock(achievementId || "captcha_done");

    if (disasterToSave) {
      performSaveDisaster(disasterToSave, { closeAfterSave: true });
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

  function handleTitleBadgeClick() {
    if (!adminMode) return;

    const now = performance.now();
    const recentClicks = [...titleBadgeClickTimes.current.filter((time) => now - time <= 4000), now];
    titleBadgeClickTimes.current = recentClicks;

    if (recentClicks.length >= 3) {
      titleBadgeClickTimes.current = [];
      openWebsiteLoreLedger();
    }
  }

  function enterExampleMode() {
    setSelectedTimelineSource(SOURCE_TYPES.EXAMPLE);
    setExampleMode(true);
    setExampleSessionEvents(buildExampleEvents(exampleMediaItems));
    setShowForm(false);
    setEditingId(null);
    setExampleMediaStatus("Example mode edits are temporary. The archive will deny everything later.");
  }

  function exitExampleMode() {
    leaveExampleMode();
    setSelectedTimelineSource(SOURCE_TYPES.LOCAL);
    loadLocalTimelineData(activeLocalTimelineId);
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

  function buildImportEvents(importedEvents, existingEvents = []) {
    const usedIds = new Set(existingEvents.map((event) => event.id).filter(Boolean));

    return importedEvents.map((event) => {
      const nextId = event.id && !usedIds.has(event.id) ? event.id : createId();
      usedIds.add(nextId);

      return {
        ...event,
        id: nextId,
        media: Array.isArray(event.media)
          ? event.media.map((media, index) => ({
              ...media,
              id: media.id || createId(),
              disasterId: nextId,
              order: Number.isFinite(Number(media.order)) ? Number(media.order) : index,
            }))
          : [],
      };
    });
  }

  function exportRealTimeline() {
    const isExampleExport = activeSource === SOURCE_TYPES.EXAMPLE;
    if (isExampleExport) {
      const confirmed = window.confirm(
        "You are exporting the Example Timeline. This is fake demo/testing nonsense, not your real timeline. Useful for testing. Terrible for court.",
      );
      if (!confirmed) {
        showSystemToast("Example export aborted. The real crimes remain unbothered.");
        return;
      }
    }

    const createdAt = new Date().toISOString();
    const text = exportTimelineData({
      events: displayDisasters,
      tags,
      plannedGames,
      knownSecrets: isExampleExport ? [] : knownSecretIds,
      achievements: isExampleExport ? [] : unlockedAchievementIds,
      timeline: activeTimelineMetadata,
      timelineType: isExampleExport ? "example" : activeTimelineMetadata?.type || activeSource,
      isExampleExport,
      createdAt,
    });
    downloadUhohFile(text, buildUhohFileName(new Date(createdAt)));
    showSystemToast(
      isExampleExport
        ? "Example Timeline exported. Fake nonsense bottled for science."
        : "Timeline exported. Media stayed home because evidence teleportation is still illegal.",
    );
  }

  function requestImportTimeline() {
    if (exampleMode) {
      showSystemToast("You are in Example Mode. Importing fake demo nonsense is probably not what you meant.");
    }
    importFileInputRef.current?.click();
  }

  async function selectImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseTimelineImportFile(text);
      if (!result.valid) {
        showSystemToast("The archive tried to read this file and immediately regretted it.");
        return;
      }
      setPendingImport(result);
    } catch {
      showSystemToast("The archive tried to read this file and immediately regretted it.");
    }
  }

  function mergeImport() {
    if (!pendingImport?.data) return;
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Import merge denied by fake bureaucracy.");
      return;
    }

    if (exampleMode) {
      const importedEvents = buildImportEvents(pendingImport.data.events, exampleSessionEvents);
      importedEvents.forEach((event) => markTimelineChange(event.id, "created", "import"));
      setExampleSessionEvents((current) => [...current, ...importedEvents]);
      setPendingImport(null);
      showSystemToast("Import merged into Example Mode. Demo nonsense has eaten more demo nonsense.");
      return;
    }

    setDisasters((current) => {
      const importedEvents = buildImportEvents(pendingImport.data.events, current);
      importedEvents.forEach((event) => markTimelineChange(event.id, "created", "import"));
      const nextEvents = [...current, ...importedEvents];
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveEvents(null, nextEvents);
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
      return nextEvents;
    });
    setTags((current) => {
      const nextTags = uniqueByName([...current, ...pendingImport.data.tags]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) mockSyncedTimelineSource.saveTags(null, nextTags);
      return nextTags;
    });
    setPlannedGames((current) => {
      const nextGames = uniqueByName([...current, ...pendingImport.data.plannedGames]);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) mockSyncedTimelineSource.savePlannedGames(null, nextGames);
      return nextGames;
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...pendingImport.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...pendingImport.data.achievements]));
    setSyncStatus(mockSyncedTimelineSource.getStatus());
    setPendingImport(null);
    showSystemToast("Import merged. The timeline absorbed more evidence.");
  }

  function importAsNewTimeline() {
    if (!pendingImport?.data) return;
    const sourceName = pendingImport.summary?.timelineName || "Imported Timeline";
    const suffix = pendingImport.summary?.isExampleExport ? " Example Import" : " Import";
    const importedEvents = buildImportEvents(pendingImport.data.events, []);
    const timeline = createLocalTimeline(`${sourceName}${suffix}`, {
      events: importedEvents,
      tags: uniqueByName([...defaultTags, ...pendingImport.data.tags]),
      plannedGames: uniqueByName(pendingImport.data.plannedGames),
    });
    setKnownSecretIds((current) => uniqueByName([...current, ...pendingImport.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...pendingImport.data.achievements]));
    importedEvents.forEach((event) => markTimelineChange(event.id, "created", "import"));
    setPendingImport(null);
    showSystemToast(`Imported as ${timeline.name}. The current timeline was spared.`);
  }

  function replaceImport() {
    if (!pendingImport?.data) return;
    if (!canEditCurrentTimeline) {
      showSystemToast(readOnlyReason || "This timeline is view-only. Replace denied before history got splattered.");
      return;
    }

    const nextEvents = buildImportEvents(pendingImport.data.events, []);
    nextEvents.forEach((event) => markTimelineChange(event.id, "created", "import"));

    if (exampleMode) {
      setExampleSessionEvents(nextEvents);
    } else {
      setDisasters(nextEvents);
      if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK) {
        mockSyncedTimelineSource.saveEvents(null, nextEvents);
        mockRevisionRef.current = mockSyncedTimelineSource.getRevision();
      }
    }

    const nextTags = uniqueByName([...defaultTags, ...pendingImport.data.tags]);
    const nextPlannedGames = uniqueByName(pendingImport.data.plannedGames);
    setTags(nextTags);
    setPlannedGames(nextPlannedGames);
    if (selectedTimelineSource === SOURCE_TYPES.SYNCED_MOCK && !exampleMode) {
      mockSyncedTimelineSource.saveTags(null, nextTags);
      mockSyncedTimelineSource.savePlannedGames(null, nextPlannedGames);
      setSyncStatus(mockSyncedTimelineSource.getStatus());
    }
    setKnownSecretIds((current) => uniqueByName([...current, ...pendingImport.data.knownSecrets]));
    setUnlockedAchievementIds((current) => uniqueByName([...current, ...pendingImport.data.achievements]));
    setPendingImport(null);
    setDetailDisasterId(null);
    setShowForm(false);
    setEditingId(null);
    showSystemToast("Timeline replaced. History has been legally rearranged.");
  }

  function resetWebsite() {
    clearAppStorage();
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
    setAccountOpen(false);
    setMockAuthSession(null);
    setSyncStatus(mockSyncedTimelineSource.getStatus());
    setRecentTimelineChanges({});
    setExampleMediaItems((current) => {
      revokeObjectUrls(current);
      return [];
    });
    setExampleMediaStatus("");
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
        </div>

        {exampleMode ? (
          <ExampleModeBanner
            onExit={exitExampleMode}
            onLoadFolder={loadExampleMediaFolder}
            onSelectFiles={selectExampleMediaFiles}
            mediaCount={exampleMediaItems.length}
            generatedMediaCount={generatedExampleMedia.length}
            mediaStatus={exampleMediaStatus}
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
            <TimelineSourceSelector
              selectedSource={activeSource}
              localTimelines={localTimelines}
              activeLocalTimelineId={activeLocalTimelineId}
              activeTimelineName={activeTimelineMetadata?.name}
              sourceStatus={syncStatus}
              onSelectSource={selectTimelineSource}
              onSwitchLocalTimeline={switchLocalTimeline}
              onCreateLocalTimeline={createLocalTimeline}
              onRenameLocalTimeline={renameLocalTimeline}
              onDuplicateLocalTimeline={duplicateLocalTimeline}
              onDeleteLocalTimeline={deleteLocalTimeline}
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
            onOpenLore={() => triggerFromAdmin(openWebsiteLoreLedger)}
            onOpenNodeWeb={() => triggerFromAdmin(openNodeWeb)}
            onShowTos={() => triggerFromAdmin(() => showTosBar(true))}
            onTriggerCaptcha={() => triggerFromAdmin(triggerManualCaptcha)}
            onTriggerAd={() => triggerFromAdmin(() => triggerFakeAd(true))}
            onTriggerOrb={() => triggerFromAdmin(triggerManualOrb)}
            onEnterExampleMode={enterExampleMode}
            onExitExampleMode={exitExampleMode}
            onLoadExampleMediaFolder={loadExampleMediaFolder}
            onExportTimeline={exportRealTimeline}
            onImportTimeline={requestImportTimeline}
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
        {loreLedgerOpen ? (
          <WebsiteLoreLedger
            onClose={() => setLoreLedgerOpen(false)}
            knownSecretIds={knownSecretIds}
            onOpenAchievements={() => triggerFromAdmin(openAchievementsWindow)}
            onOpenNodeWeb={() => triggerFromAdmin(openNodeWeb)}
            onTriggerAgeGate={() => triggerFromAdmin(triggerManualAgeGate)}
            onShowTos={() => triggerFromAdmin(() => showTosBar(true))}
            onTriggerCaptcha={() => triggerFromAdmin(triggerManualCaptcha)}
            onTriggerAd={() => triggerFromAdmin(() => triggerFakeAd(true))}
            onTriggerOrb={() => triggerFromAdmin(triggerManualOrb)}
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
            onImportAsNew={importAsNewTimeline}
            onMerge={mergeImport}
            onReplace={replaceImport}
            onCancel={() => setPendingImport(null)}
          />
        ) : null}
      </AnimatePresence>
      <input
        ref={importFileInputRef}
        type="file"
        accept=".uhoh,.json,text/plain,application/json"
        className="sr-only"
        onChange={selectImportFile}
      />
      <ChaosOrb
        active={orb.active}
        path={orb.path}
        triggerKey={orb.key}
        onComplete={() => setOrb((current) => ({ ...current, active: false }))}
        onHoverTrigger={triggerObservedOrb}
      />
      <AdminModeOverlay active={adminAnimationActive} />
      <ReactionOverlayHost />
    </div>
  );
}
