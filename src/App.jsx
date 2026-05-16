import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import LongTosWindow from "./components/LongTosWindow";
import NodeWebModal from "./components/NodeWebModal";
import SearchBar from "./components/SearchBar";
import TermsBar from "./components/TermsBar";
import Timeline from "./components/Timeline";
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
import {
  clearAppStorage,
  loadAdminMode,
  loadDisasters,
  loadFlags,
  loadKnownSecrets,
  loadPlannedGames,
  loadTags,
  loadUnlockedAchievements,
  saveAdminMode,
  saveDisasters,
  saveFlags,
  saveKnownSecrets,
  savePlannedGames,
  saveTags,
  saveUnlockedAchievements,
} from "./utils/storage";

export default function App() {
  const [disasters, setDisasters] = useState(() => loadDisasters());
  const [tags, setTags] = useState(() => loadTags(defaultTags));
  const [plannedGames, setPlannedGames] = useState(() => loadPlannedGames(defaultPlannedGames));
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
  const [exampleMode, setExampleMode] = useState(false);
  const [exampleSessionEvents, setExampleSessionEvents] = useState([]);
  const [exampleMediaItems, setExampleMediaItems] = useState([]);
  const [exampleMediaStatus, setExampleMediaStatus] = useState("");
  const [detailDisasterId, setDetailDisasterId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [loreLedgerOpen, setLoreLedgerOpen] = useState(false);
  const hasCheckedAgeGate = useRef(false);
  const hasCheckedAd = useRef(false);
  const hasCheckedTerms = useRef(false);
  const modalStateRef = useRef({});
  const canonClickTimes = useRef([]);
  const titleBadgeClickTimes = useRef([]);
  const exampleFileInputRef = useRef(null);
  const systemToastTimer = useRef(null);
  const footerMessage = useMemo(() => pickRandom(footerMessages), []);

  const buildExampleEvents = useCallback((extraMedia = []) => {
    const disasterIds = exampleTimeline.map((disaster) => disaster.id);
    const generatedMedia = distributeGeneratedMedia(generatedExampleMedia, disasterIds);
    return attachMediaToDisasters(exampleTimeline, [...generatedMedia, ...extraMedia]);
  }, []);

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
      pendingDeleteId,
  );

  useEffect(() => {
    modalStateRef.current = { majorWindowOpen };
  }, [majorWindowOpen]);

  useEffect(() => saveDisasters(disasters), [disasters]);
  useEffect(() => saveTags(tags), [tags]);
  useEffect(() => savePlannedGames(plannedGames), [plannedGames]);
  useEffect(() => saveUnlockedAchievements(unlockedAchievementIds), [unlockedAchievementIds]);
  useEffect(() => saveFlags(flags), [flags]);
  useEffect(() => saveKnownSecrets(knownSecretIds), [knownSecretIds]);
  useEffect(() => saveAdminMode(adminMode), [adminMode]);

  useEffect(() => {
    return () => revokeObjectUrls(exampleMediaItems);
  }, [exampleMediaItems]);

  useEffect(() => {
    return () => window.clearTimeout(systemToastTimer.current);
  }, []);

  const showSystemToast = useCallback((message) => {
    setSystemToast(message);
    window.clearTimeout(systemToastTimer.current);
    systemToastTimer.current = window.setTimeout(() => setSystemToast(""), 2800);
  }, []);

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
  }, []);

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
    if (exampleMode) {
      setExampleMode(false);
      setExampleSessionEvents([]);
    }
    setEditingId(null);
    setShowForm(true);
    window.setTimeout(() => {
      document.getElementById("disaster-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function openEditForm(id) {
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

    setDisasters((current) =>
      current.map((disaster) => {
        if (normalizeText(disaster.year) !== normalizeText(year)) return disaster;
        const nextOrder = orderedIds.indexOf(disaster.id);
        return nextOrder === -1 ? disaster : { ...disaster, sortOrder: nextOrder };
      }),
    );
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
      if (draft.id) {
        return current.map((disaster) => (disaster.id === draft.id ? nextDisaster : disaster));
      }

      return [...current, nextDisaster];
    });

    setTags((current) => uniqueByName([...current, nextDisaster.tag]));

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
    setPendingDeleteId(id);
  }

  function confirmDeleteDisaster() {
    if (!pendingDeleteId) return;

    if (exampleMode) {
      setExampleSessionEvents((current) => current.filter((item) => item.id !== pendingDeleteId));
      if (editingId === pendingDeleteId) closeForm();
      if (detailDisasterId === pendingDeleteId) setDetailDisasterId(null);
      setPendingDeleteId(null);
      showSystemToast("Example evidence deleted. It will grow back next session.");
      return;
    }

    setDisasters((current) => current.filter((item) => item.id !== pendingDeleteId));

    if (editingId === pendingDeleteId) {
      closeForm();
    }

    if (detailDisasterId === pendingDeleteId) {
      setDetailDisasterId(null);
    }

    setPendingDeleteId(null);
  }

  function addPlannedGame(game) {
    setPlannedGames((current) => uniqueByName([...current, game]));
  }

  function removePlannedGame(index) {
    setPlannedGames((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
      setAchievementsOpen(true);
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
    setExampleMode(true);
    setExampleSessionEvents(buildExampleEvents(exampleMediaItems));
    setShowForm(false);
    setEditingId(null);
    setExampleMediaStatus("Example mode edits are temporary. The archive will deny everything later.");
  }

  function exitExampleMode() {
    setExampleMode(false);
    setExampleSessionEvents([]);
    setDetailDisasterId(null);
    setShowForm(false);
    setEditingId(null);
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

  function resetWebsite() {
    clearAppStorage();
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
    setExampleMediaItems((current) => {
      revokeObjectUrls(current);
      return [];
    });
    setExampleMediaStatus("");
    closeForm();
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
          />
          <GamesPanel
            gameStats={gameStats}
            plannedGames={plannedGames}
            onAddPlannedGame={addPlannedGame}
            onRemovePlannedGame={removePlannedGame}
          />
        </div>

        {adminMode ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAdminPanelOpen(true)}
              className="rounded-full border border-sky-300/30 bg-sky-500/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-sky-50 transition hover:bg-sky-500/25 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
            >
              ADMIN
            </button>
          </div>
        ) : null}

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
          onOpenNodeWeb={openNodeWeb}
          onReorderYear={reorderYear}
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
        {nodeWebOpen ? <NodeWebModal disasters={displayDisasters} onClose={() => setNodeWebOpen(false)} /> : null}
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
            onOpenAchievements={() => triggerFromAdmin(() => setAchievementsOpen(true))}
            onOpenLore={() => triggerFromAdmin(openWebsiteLoreLedger)}
            onOpenNodeWeb={() => triggerFromAdmin(openNodeWeb)}
            onShowTos={() => triggerFromAdmin(() => showTosBar(true))}
            onTriggerCaptcha={() => triggerFromAdmin(triggerManualCaptcha)}
            onTriggerAd={() => triggerFromAdmin(() => triggerFakeAd(true))}
            onTriggerOrb={() => triggerFromAdmin(triggerManualOrb)}
            onEnterExampleMode={enterExampleMode}
            onExitExampleMode={exitExampleMode}
            onLoadExampleMediaFolder={loadExampleMediaFolder}
            onReset={resetWebsite}
            exampleMode={exampleMode}
            counts={{
              disasters: disasters.length,
              achievements: unlockedAchievementIds.length,
            }}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {loreLedgerOpen ? (
          <WebsiteLoreLedger
            onClose={() => setLoreLedgerOpen(false)}
            onOpenAchievements={() => triggerFromAdmin(() => setAchievementsOpen(true))}
            onOpenNodeWeb={() => triggerFromAdmin(openNodeWeb)}
            onShowTos={() => triggerFromAdmin(() => showTosBar(true))}
            onTriggerCaptcha={() => triggerFromAdmin(triggerManualCaptcha)}
            onTriggerAd={() => triggerFromAdmin(() => triggerFakeAd(true))}
            onTriggerOrb={() => triggerFromAdmin(triggerManualOrb)}
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
      <ChaosOrb
        active={orb.active}
        path={orb.path}
        triggerKey={orb.key}
        onComplete={() => setOrb((current) => ({ ...current, active: false }))}
      />
      <AdminModeOverlay active={adminAnimationActive} />
    </div>
  );
}
