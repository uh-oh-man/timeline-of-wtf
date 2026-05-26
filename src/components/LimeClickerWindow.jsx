import { MessageCircle, Sparkles, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import FloatingWindow from "./FloatingWindow";
import FruitAscensionWindow from "./FruitAscensionWindow";
import FruitClickerPanel from "./FruitClickerPanel";
import LimevementsPanel from "./LimevementsPanel";
import PeerLiveChatPanel from "./PeerLiveChatPanel";
import { fruitClickerRegistry, fruitClickerRegistryById } from "../data/fruitClickerRegistry";
import {
  applyFruitOfflineProgress,
  calculateFruitPerClick,
  calculateFruitPerSecond,
  clickFruitState,
  purchaseFruitUpgrade,
} from "../services/clickers/fruitClickerMath";
import {
  createDefaultFruitState,
  loadFruitState,
  loadFruitUnlocked,
  saveFruitState,
  unlockFruitClicker,
} from "../services/clickers/fruitClickerStorage";
import { ascendFruitAndResetAll } from "../services/clickers/ascension";
import { cx } from "../utils/helpers";

const NON_LIME_GAME_IDS = fruitClickerRegistry.filter((game) => game.id !== "lime").map((game) => game.id);

function loadLocalFruitStatesWithProgress() {
  const now = new Date();
  const states = {};
  const offlineGains = {};

  NON_LIME_GAME_IDS.forEach((gameId) => {
    const loaded = loadFruitState(gameId);
    if (loaded.unlocked || loadFruitUnlocked(gameId)) {
      const { state, gained } = applyFruitOfflineProgress(gameId, { ...loaded, unlocked: true }, now);
      states[gameId] = state;
      offlineGains[gameId] = gained;
      saveFruitState(gameId, state);
    } else {
      states[gameId] = loaded;
      offlineGains[gameId] = 0;
    }
  });

  return { states, offlineGains };
}

function isStateUnlocked(state) {
  return Boolean(state?.unlocked);
}

export default function LimeClickerWindow({
  state,
  limesPerClick,
  limesPerSecond,
  saveStatus,
  offlineGains,
  onClickLime,
  onPurchaseUpgrade,
  onReplaceLimeState,
  onClose,
  onReset,
  limeMode = "solo",
  onSetLimeMode,
  sharedLimeAvailable = false,
  multiplayerSessionName = "",
  multiplayerPeersCount = 0,
  multiplayerSyncStatus = "No multiplayer session active.",
  limevementsState = null,
  limevementsOpen = false,
  onToggleLimevements,
  peerConnected = false,
  chatOpen = false,
  onToggleChat,
  chatMessages = [],
  chatDraft = "",
  onChatDraftChange,
  onSendChatMessage,
  fruitStateRefreshKey = 0,
  onFruitSavesChanged,
  onNotice,
}) {
  const initialLocalState = useMemo(() => loadLocalFruitStatesWithProgress(), []);
  const [activeFruitId, setActiveFruitId] = useState("lime");
  const [fruitStates, setFruitStates] = useState(initialLocalState.states);
  const [fruitOfflineGains, setFruitOfflineGains] = useState(initialLocalState.offlineGains);
  const [fruitSaveStatus, setFruitSaveStatus] = useState({});
  const [ascensionOpen, setAscensionOpen] = useState(false);
  const [selectedAscensionFruitId, setSelectedAscensionFruitId] = useState("lime");
  const rareVariants = useMemo(
    () =>
      Object.fromEntries(
        fruitClickerRegistry.map((game) => [
          game.id,
          Boolean(game.imageAssets?.rareVariant && Math.random() < Number(game.imageAssets.rareVariant.chance || 0)),
        ]),
      ),
    [],
  );

  const isFruitUnlocked = useCallback(
    (gameId) => {
      if (gameId === "lime") return true;
      return isStateUnlocked(fruitStates[gameId]) || loadFruitUnlocked(gameId);
    },
    [fruitStates],
  );

  const notify = useCallback((message) => {
    onNotice?.(message);
  }, [onNotice]);

  const markFruitSavesChanged = useCallback(() => {
    onFruitSavesChanged?.();
  }, [onFruitSavesChanged]);

  const reloadLocalFruitStates = useCallback(() => {
    const loaded = loadLocalFruitStatesWithProgress();
    setFruitStates(loaded.states);
    setFruitOfflineGains(loaded.offlineGains);
  }, []);

  useEffect(() => {
    reloadLocalFruitStates();
  }, [fruitStateRefreshKey, reloadLocalFruitStates]);

  useEffect(() => {
    if (activeFruitId !== "lime" && !isFruitUnlocked(activeFruitId)) {
      setActiveFruitId("lime");
    }
  }, [activeFruitId, isFruitUnlocked]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      setFruitStates((current) => {
        let changed = false;
        const next = { ...current };
        NON_LIME_GAME_IDS.forEach((gameId) => {
          const existing = next[gameId] || createDefaultFruitState(gameId);
          if (!existing.unlocked) return;
          const progressed = applyFruitOfflineProgress(gameId, existing, now);
          next[gameId] = progressed.state;
          if (progressed.gained > 0 || progressed.elapsedSeconds > 0) {
            saveFruitState(gameId, progressed.state);
            changed = true;
          }
        });
        return changed ? next : current;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleBeforeUnload() {
      NON_LIME_GAME_IDS.forEach((gameId) => {
        const current = fruitStates[gameId];
        if (current?.unlocked) {
          const progressed = applyFruitOfflineProgress(gameId, current, new Date()).state;
          saveFruitState(gameId, progressed);
        }
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [fruitStates]);

  const visibleTabs = useMemo(
    () =>
      fruitClickerRegistry.filter((game) => {
        if (game.id === "lime") return true;
        if (isFruitUnlocked(game.id)) return true;
        if (game.id === "apple") return true;
        return game.unlockSource?.gameId && isFruitUnlocked(game.unlockSource.gameId);
      }),
    [isFruitUnlocked],
  );

  const localUnlockedGames = useMemo(
    () => fruitClickerRegistry.filter((game) => isFruitUnlocked(game.id)),
    [isFruitUnlocked],
  );

  const allFruitStates = useMemo(
    () => ({
      lime: state,
      ...fruitStates,
    }),
    [fruitStates, state],
  );

  const appleUnlocked = isFruitUnlocked("apple");
  const activeGame = fruitClickerRegistryById[activeFruitId] || fruitClickerRegistryById.lime;
  const activeNonLimeState = activeFruitId === "lime" ? null : (fruitStates[activeFruitId] || createDefaultFruitState(activeFruitId));
  const activePerClick = activeFruitId === "lime" ? limesPerClick : calculateFruitPerClick(activeFruitId, activeNonLimeState);
  const activePerSecond = activeFruitId === "lime" ? limesPerSecond : calculateFruitPerSecond(activeFruitId, activeNonLimeState);

  function isUpgradeMaxed(upgrade) {
    if (upgrade.type === "unlockClicker" && upgrade.unlocksGameId && isFruitUnlocked(upgrade.unlocksGameId)) {
      return true;
    }
    return false;
  }

  const handleClickLocalFruit = useCallback((gameId) => {
    setFruitOfflineGains((current) => ({ ...current, [gameId]: 0 }));
    setFruitStates((current) => {
      const base = current[gameId] || createDefaultFruitState(gameId, { unlocked: true });
      const { state: nextState } = clickFruitState(gameId, { ...base, unlocked: true }, new Date());
      saveFruitState(gameId, nextState);
      setFruitSaveStatus((statuses) => ({ ...statuses, [gameId]: "Saved" }));
      markFruitSavesChanged();
      return { ...current, [gameId]: nextState };
    });
  }, [markFruitSavesChanged]);

  const handlePurchaseLocalFruitUpgrade = useCallback((gameId, upgradeId) => {
    const game = fruitClickerRegistryById[gameId];
    const upgrade = game?.upgrades.find((candidate) => candidate.id === upgradeId);
    if (!upgrade) return;

    setFruitStates((current) => {
      const base = current[gameId] || createDefaultFruitState(gameId, { unlocked: true });
      const progressed = applyFruitOfflineProgress(gameId, { ...base, unlocked: true }, new Date()).state;
      const result = purchaseFruitUpgrade(gameId, progressed, upgrade, {
        isTargetUnlocked: (targetGameId) => isStateUnlocked(current[targetGameId]) || loadFruitUnlocked(targetGameId),
      });

      if (result.alreadyUnlocked) {
        notify(`${fruitClickerRegistryById[upgrade.unlocksGameId]?.name || "Fruit"} is already unlocked.`);
        return { ...current, [gameId]: progressed };
      }
      if (!result.purchased) return { ...current, [gameId]: progressed };

      const next = { ...current, [gameId]: result.state };
      saveFruitState(gameId, result.state);

      if (result.unlockedGameId) {
        const unlockedState = unlockFruitClicker(result.unlockedGameId);
        next[result.unlockedGameId] = unlockedState;
        setActiveFruitId(result.unlockedGameId);
        notify(`${fruitClickerRegistryById[result.unlockedGameId]?.name || "Fruit"} unlocked.`);
      }

      setFruitSaveStatus((statuses) => ({ ...statuses, [gameId]: "Saved" }));
      markFruitSavesChanged();
      return next;
    });
  }, [markFruitSavesChanged, notify]);

  const handleAscend = useCallback((gameId) => {
    const game = fruitClickerRegistryById[gameId];
    if (!game) return;
    const confirmed = window.confirm(
      `Ascend ${game.name}? This resets all fruit counts, upgrades, active boosts, and fruit event mess. Unlocks and ascension levels stay.`,
    );
    if (!confirmed) return;

    const result = ascendFruitAndResetAll(gameId, allFruitStates);
    if (!result.ascended) {
      notify(`${game.name} cannot ascend yet. The fruit economy demands more numbers.`);
      return;
    }

    const nextStates = result.states || {};
    if (nextStates.lime) onReplaceLimeState?.(nextStates.lime);
    const nextLocalStates = {};
    NON_LIME_GAME_IDS.forEach((localGameId) => {
      nextLocalStates[localGameId] = nextStates[localGameId] || createDefaultFruitState(localGameId);
      saveFruitState(localGameId, nextLocalStates[localGameId]);
    });
    setFruitStates(nextLocalStates);
    setFruitOfflineGains({});
    setAscensionOpen(false);
    markFruitSavesChanged();
    notify(`${game.name} ascended. The produce department has been reset with benefits.`);
  }, [allFruitStates, markFruitSavesChanged, notify, onReplaceLimeState]);

  const limeUtilityChildren = (
    <>
      <button
        type="button"
        onClick={onToggleLimevements}
        className="inline-flex items-center gap-2 rounded-xl border border-lime-300/25 bg-lime-500/10 px-3 py-2 text-xs font-black text-lime-100 transition hover:bg-lime-500/20 focus:outline-none focus:ring-4 focus:ring-lime-300/25"
      >
        <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
        Limevements
      </button>
      {peerConnected ? (
        <button
          type="button"
          onClick={onToggleChat}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-500/20 focus:outline-none focus:ring-4 focus:ring-sky-300/25"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Live Chat
        </button>
      ) : null}
    </>
  );

  return (
    <>
      <FloatingWindow
        title="lime"
        subtitle="Fruit-based productivity simulator"
        onClose={onClose}
        widthClass="max-w-5xl"
        zIndexClass="z-[69]"
        bodyClassName="bg-zinc-950 p-4 md:p-5"
      >
        <div className="grid gap-4">
          <section className="rounded-3xl border border-white/12 bg-black/25 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSetLimeMode?.("solo")}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-sky-300/25",
                  limeMode === "solo"
                    ? "border-sky-200/35 bg-sky-500/20 text-sky-50"
                    : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
                )}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => onSetLimeMode?.("multiplayer")}
                disabled={!sharedLimeAvailable}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-sky-300/25 disabled:cursor-not-allowed disabled:opacity-45",
                  limeMode === "multiplayer"
                    ? "border-emerald-300/35 bg-emerald-500/20 text-emerald-50"
                    : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800",
                )}
              >
                Shared Lime
              </button>
              <span className="text-xs text-zinc-400">Mode: {limeMode === "multiplayer" ? "Shared Lime" : "Solo"}</span>
            </div>
            {limeMode === "multiplayer" ? (
              <div className="mt-3 grid gap-2">
                <p className="text-xs text-zinc-300">
                  Session: {multiplayerSessionName || "Lime Session"} | Peers: {multiplayerPeersCount}
                </p>
                <p className="text-xs text-zinc-400">{multiplayerSyncStatus}</p>
              </div>
            ) : !sharedLimeAvailable ? (
              <p className="mt-3 text-xs text-zinc-400">Connect to a peer to share lime. Solo citrus remains available.</p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/12 bg-black/25 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {visibleTabs.map((game) => {
                const unlocked = isFruitUnlocked(game.id);
                const active = activeFruitId === game.id;
                return (
                  <button
                    key={game.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => unlocked && setActiveFruitId(game.id)}
                    className={cx(
                      "rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition focus:outline-none focus:ring-4 focus:ring-lime-300/25 disabled:cursor-not-allowed disabled:opacity-45",
                      active
                        ? "border-lime-300/40 bg-lime-500/20 text-lime-50"
                        : "border-white/15 bg-zinc-900/75 text-zinc-300 hover:bg-zinc-800",
                    )}
                  >
                    {game.name}
                    {!unlocked ? " Locked" : ""}
                  </button>
                );
              })}
              {appleUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAscensionFruitId(activeFruitId);
                    setAscensionOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-50 transition hover:bg-amber-500/25 focus:outline-none focus:ring-4 focus:ring-amber-300/25"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Ascension
                </button>
              ) : null}
            </div>
            {activeFruitId !== "lime" ? (
              <p className="mt-2 text-xs text-zinc-400">
                {activeGame.name} is its own local save. Export/import uses the mini-game save system.
              </p>
            ) : null}
          </section>

          {activeFruitId === "lime" ? (
            <>
              <FruitClickerPanel
                key="lime"
                game={fruitClickerRegistryById.lime}
                state={state}
                perClick={limesPerClick}
                perSecond={limesPerSecond}
                saveStatus={saveStatus}
                offlineGains={offlineGains}
                onClickFruit={onClickLime}
                onPurchaseUpgrade={onPurchaseUpgrade}
                onReset={onReset}
                resetLabel="Reset Lime Progress"
                resetConfirmText="Reset lime progress? Your friend will feel less productive."
                utilityChildren={limeUtilityChildren}
                rareVariantEnabled={rareVariants.lime}
                isUpgradeMaxed={isUpgradeMaxed}
              />
              {chatOpen && peerConnected ? (
                <PeerLiveChatPanel
                  connected={peerConnected}
                  messages={chatMessages}
                  draft={chatDraft}
                  onDraftChange={onChatDraftChange}
                  onSend={onSendChatMessage}
                />
              ) : null}
              {limevementsOpen ? (
                <div className="rounded-2xl border border-white/12 bg-black/25 p-3">
                  <LimevementsPanel state={limevementsState} />
                </div>
              ) : null}
            </>
          ) : (
            <FruitClickerPanel
              key={activeFruitId}
              game={activeGame}
              state={activeNonLimeState}
              perClick={activePerClick}
              perSecond={activePerSecond}
              saveStatus={fruitSaveStatus[activeFruitId] || "Saved"}
              offlineGains={fruitOfflineGains[activeFruitId] || 0}
              onClickFruit={() => handleClickLocalFruit(activeFruitId)}
              onPurchaseUpgrade={(upgradeId) => handlePurchaseLocalFruitUpgrade(activeFruitId, upgradeId)}
              rareVariantEnabled={rareVariants[activeFruitId]}
              isUpgradeMaxed={isUpgradeMaxed}
            />
          )}
        </div>
      </FloatingWindow>

      {ascensionOpen ? (
        <FruitAscensionWindow
          games={localUnlockedGames}
          statesByGameId={allFruitStates}
          selectedGameId={selectedAscensionFruitId}
          onSelectGame={setSelectedAscensionFruitId}
          onAscend={handleAscend}
          onClose={() => setAscensionOpen(false)}
        />
      ) : null}
    </>
  );
}
