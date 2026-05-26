import {
  createMessage,
  createHeartbeat,
  createTimelineChecksum,
  HEARTBEAT_INTERVAL_MS,
  CHECKSUM_INTERVAL_MS,
  PEER_MESSAGE_TYPES,
} from "./peerMessages";
import { createEncryptedEnvelope, derivePeerKey, generateSalt, openEncryptedEnvelope } from "./peerCrypto";

const DEFAULT_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
    ],
  },
];
const ICE_MIN_WAIT_MS = 500;
const ICE_PREFERRED_TIMEOUT_MS = 3500;
const ICE_EMERGENCY_TIMEOUT_MS = 8000;
const VERIFIED_CONNECTION_TIMEOUT_MS = 15000;

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function waitForIceGatheringReady(peerConnection, getCandidateCount) {
  const startedAt = nowMs();
  if (peerConnection.iceGatheringState === "complete") {
    return Promise.resolve({
      reason: "complete",
      candidateCount: getCandidateCount(),
      elapsedMs: Math.round(nowMs() - startedAt),
      warning: "",
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    let minWaitDone = false;
    const timers = [
      window.setTimeout(() => {
        minWaitDone = true;
        maybeFinishPartial();
      }, ICE_MIN_WAIT_MS),
      window.setTimeout(() => {
        if (getCandidateCount() > 0) finish("partial");
      }, ICE_PREFERRED_TIMEOUT_MS),
      window.setTimeout(() => finish(getCandidateCount() > 0 ? "timeout-partial" : "timeout-empty"), ICE_EMERGENCY_TIMEOUT_MS),
    ];

    function cleanup() {
      timers.forEach((timer) => window.clearTimeout(timer));
      peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
      peerConnection.removeEventListener("icecandidate", handleCandidate);
    }

    function finish(reason) {
      if (settled) return;
      settled = true;
      cleanup();
      const candidateCount = getCandidateCount();
      resolve({
        reason,
        candidateCount,
        elapsedMs: Math.round(nowMs() - startedAt),
        warning: candidateCount === 0 ? "No connection candidates gathered yet. This may fail." : "",
      });
    }

    function maybeFinishPartial() {
      if (minWaitDone && getCandidateCount() > 0 && peerConnection.iceGatheringState !== "gathering") {
        finish("partial");
      }
    }

    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") finish("complete");
    }

    function handleCandidate() {
      maybeFinishPartial();
    }

    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
    peerConnection.addEventListener("icecandidate", handleCandidate);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function createSessionId() {
  return `peer_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

class PeerSyncSession {
  constructor({
    role,
    sessionId,
    hostDisplayName,
    guestDisplayName,
    sharedTimelineId,
    sharedTimelineCode,
    sharedTimelineName,
    getTimelineChecksum,
    iceServers = DEFAULT_ICE_SERVERS,
  }) {
    this.role = role;
    this.sessionId = sessionId || createSessionId();
    this.hostDisplayName = hostDisplayName || "Host";
    this.guestDisplayName = guestDisplayName || "Guest";
    this.sharedTimelineId = sharedTimelineId || "";
    this.sharedTimelineCode = sharedTimelineCode || "";
    this.sharedTimelineName = sharedTimelineName || "Local Timeline";
    this.getTimelineChecksum = typeof getTimelineChecksum === "function" ? getTimelineChecksum : null;
    this.iceServers = iceServers;

    this.peerConnection = null;
    this.dataChannel = null;
    this.connectionState = "disconnected";
    this.messageListeners = new Set();
    this.stateListeners = new Set();
    this.systemListeners = new Set();
    this.heartbeatTimer = null;
    this.checksumTimer = null;
    this.cryptoSalt = "";
    this.cryptoKey = null;
    this.peerVerified = false;
    this.answerApplied = false;
    this.iceCandidateCount = 0;
    this.lastError = "";
    this.lastIceWarning = "";
    this.lastIceGatheringMs = 0;
    this.connectionAttemptMs = 0;
    this.dataChannelOpenResolvers = [];
    this.verifiedConnectionResolvers = [];
  }

  emitState() {
    const debug = this.getDebugState();
    const payload = {
      sessionId: this.sessionId,
      role: this.role,
      connectionState: this.getConnectionState(),
      sharedTimelineId: this.sharedTimelineId,
      sharedTimelineCode: this.sharedTimelineCode,
      sharedTimelineName: this.sharedTimelineName,
      hostDisplayName: this.hostDisplayName,
      guestDisplayName: this.guestDisplayName,
      hasCryptoKey: Boolean(this.cryptoKey),
      cryptoSalt: this.cryptoSalt,
      debug,
    };
    this.stateListeners.forEach((listener) => listener(payload));
  }

  emitSystem(event) {
    this.systemListeners.forEach((listener) => listener(event));
  }

  registerPeerConnectionHandlers() {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      this.connectionState = this.peerConnection?.connectionState || "disconnected";
      this.emitState();
      if (this.connectionState === "connected") {
        this.startIntervals();
      }
      if (["disconnected", "failed", "closed"].includes(this.connectionState)) {
        this.stopIntervals();
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidateCount += 1;
        this.emitState();
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState || "unknown";
      this.emitSystem({
        type: "ice-state",
        state,
        sentAt: nowIso(),
      });

      if (["failed", "closed"].includes(state)) {
        if (state === "failed") {
          this.lastError = "Peer connection failed. This usually means the network blocked direct browser-to-browser connection.";
        }
        const resolvers = this.dataChannelOpenResolvers.splice(0);
        resolvers.forEach((resolve) => resolve(false));
        const verifiedResolvers = this.verifiedConnectionResolvers.splice(0);
        verifiedResolvers.forEach((resolve) => resolve(false));
      }
    };

    this.peerConnection.onicecandidateerror = (event) => {
      this.lastError = event?.errorText || event?.message || "ICE candidate error";
      this.emitState();
      this.emitSystem({
        type: "ice-candidate-error",
        error: event?.errorText || event?.message || "ICE candidate error",
        code: event?.errorCode || "unknown",
        url: event?.url || "",
        sentAt: nowIso(),
      });
    };

    this.peerConnection.ondatachannel = (event) => {
      this.attachDataChannel(event.channel);
    };
  }

  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;
    this.peerConnection = new globalThis.RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10,
    });
    this.registerPeerConnectionHandlers();
    return this.peerConnection;
  }

  attachDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.onopen = () => {
      this.connectionState = "verifying";
      this.emitState();
      this.emitSystem({
        type: "channel-open",
        sentAt: nowIso(),
      });
      const resolvers = this.dataChannelOpenResolvers.splice(0);
      resolvers.forEach((resolve) => resolve(true));
      if (this.role === "host") {
        void this.sendPeerPing();
      }
    };
    this.dataChannel.onclose = () => {
      this.connectionState = this.peerConnection?.connectionState || "disconnected";
      this.peerVerified = false;
      this.stopIntervals();
      this.emitState();
      this.emitSystem({
        type: "channel-close",
        sentAt: nowIso(),
      });
      const resolvers = this.dataChannelOpenResolvers.splice(0);
      resolvers.forEach((resolve) => resolve(false));
      const verifiedResolvers = this.verifiedConnectionResolvers.splice(0);
      verifiedResolvers.forEach((resolve) => resolve(false));
    };
    this.dataChannel.onerror = (error) => {
      this.lastError = String(error?.message || error || "unknown-datachannel-error");
      this.emitSystem({
        type: "channel-error",
        error: String(error?.message || error || "unknown-datachannel-error"),
        sentAt: nowIso(),
      });
    };
    this.dataChannel.onmessage = async (event) => {
      await this.handleRawMessage(event.data);
    };
  }

  async setSecurityPassphrase(passphrase, salt = "") {
    const resolvedSalt = salt || this.cryptoSalt || generateSalt();
    this.cryptoSalt = resolvedSalt;
    this.cryptoKey = await derivePeerKey(passphrase, resolvedSalt);
    this.emitState();
    return resolvedSalt;
  }

  async handleRawMessage(raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      let message = parsed;
      if (parsed?.encrypted) {
        if (!this.cryptoKey) {
          this.emitSystem({
            type: "security-key-mismatch",
            message: "Security key mismatch. The peer is connected, but the messages are encrypted nonsense soup.",
            sentAt: nowIso(),
          });
          return;
        }
        try {
          message = await openEncryptedEnvelope(parsed, this.cryptoKey);
        } catch {
          this.lastError = "Security key mismatch.";
          this.emitSystem({
            type: "security-key-mismatch",
            message: "Security key mismatch. The peer is connected, but the messages are encrypted nonsense soup.",
            sentAt: nowIso(),
          });
          const verifiedResolvers = this.verifiedConnectionResolvers.splice(0);
          verifiedResolvers.forEach((resolve) => resolve(false));
          return;
        }
      }

      if (message?.type === PEER_MESSAGE_TYPES.PEER_PING && this.role === "guest") {
        this.peerVerified = true;
        this.connectionState = "connected";
        this.startIntervals();
        this.emitState();
        this.emitSystem({ type: "peer-verified", sentAt: nowIso() });
        await this.sendMessage({
          type: PEER_MESSAGE_TYPES.PEER_PONG,
          pingId: message.pingId || "",
        });
        return;
      }

      if (message?.type === PEER_MESSAGE_TYPES.PEER_PONG && this.role === "host") {
        this.peerVerified = true;
        this.connectionState = "connected";
        this.startIntervals();
        this.emitState();
        this.emitSystem({ type: "peer-verified", sentAt: nowIso() });
        const verifiedResolvers = this.verifiedConnectionResolvers.splice(0);
        verifiedResolvers.forEach((resolve) => resolve(true));
        return;
      }
      this.messageListeners.forEach((listener) => listener(message));
    } catch (error) {
      this.lastError = String(error?.message || error || "unknown-message-error");
      this.emitSystem({
        type: "message-error",
        error: String(error?.message || error || "unknown-message-error"),
        sentAt: nowIso(),
      });
    }
  }

  async sendMessage(message) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") return false;
    const payload = {
      ...createMessage(message?.type || "message", message || {}),
      sessionId: this.sessionId,
      sharedTimelineId: this.sharedTimelineId,
      sharedTimelineCode: this.sharedTimelineCode,
    };

    if (this.cryptoKey) {
      const encrypted = await createEncryptedEnvelope(payload, this.cryptoKey);
      this.dataChannel.send(JSON.stringify(encrypted));
      return true;
    }

    this.dataChannel.send(JSON.stringify(payload));
    return true;
  }

  async sendPeerPing() {
    return this.sendMessage({
      type: PEER_MESSAGE_TYPES.PEER_PING,
      pingId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  startIntervals() {
    this.stopIntervals();
    this.heartbeatTimer = window.setInterval(() => {
      void this.sendMessage(createHeartbeat(this.sessionId));
    }, HEARTBEAT_INTERVAL_MS);
    this.checksumTimer = window.setInterval(() => {
      if (!this.getTimelineChecksum) return;
      const checksum = this.getTimelineChecksum();
      void this.sendMessage(createTimelineChecksum(checksum || {}));
    }, CHECKSUM_INTERVAL_MS);
  }

  stopIntervals() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.checksumTimer) {
      window.clearInterval(this.checksumTimer);
      this.checksumTimer = null;
    }
  }

  onMessage(handler) {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  onStateChange(handler) {
    this.stateListeners.add(handler);
    handler?.({
      sessionId: this.sessionId,
      role: this.role,
      connectionState: this.getConnectionState(),
      sharedTimelineId: this.sharedTimelineId,
      sharedTimelineCode: this.sharedTimelineCode,
      sharedTimelineName: this.sharedTimelineName,
      hostDisplayName: this.hostDisplayName,
      guestDisplayName: this.guestDisplayName,
      hasCryptoKey: Boolean(this.cryptoKey),
      cryptoSalt: this.cryptoSalt,
      debug: this.getDebugState(),
    });
    return () => this.stateListeners.delete(handler);
  }

  onSystem(handler) {
    this.systemListeners.add(handler);
    return () => this.systemListeners.delete(handler);
  }

  getConnectionState() {
    if (this.peerVerified && this.dataChannel?.readyState === "open") return "connected";
    if (this.dataChannel?.readyState === "open") return "verifying";
    const peerState = this.peerConnection?.connectionState || this.connectionState || "disconnected";
    return peerState === "connected" ? "connecting" : peerState;
  }

  async createOffer() {
    const peer = this.createPeerConnection();
    const channel = peer.createDataChannel("twtaf-peer-sync", { ordered: true });
    this.attachDataChannel(channel);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const iceResult = await waitForIceGatheringReady(peer, () => this.iceCandidateCount);
    this.lastIceWarning = iceResult.warning || "";
    this.lastIceGatheringMs = iceResult.elapsedMs;
    this.emitState();
    return peer.localDescription;
  }

  async acceptOfferAndCreateAnswer(offerDescription) {
    const peer = this.createPeerConnection();
    await peer.setRemoteDescription(new globalThis.RTCSessionDescription(offerDescription));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const iceResult = await waitForIceGatheringReady(peer, () => this.iceCandidateCount);
    this.lastIceWarning = iceResult.warning || "";
    this.lastIceGatheringMs = iceResult.elapsedMs;
    this.emitState();
    return peer.localDescription;
  }

  async acceptAnswer(answerDescription) {
    const peer = this.createPeerConnection();
    if (this.answerApplied || peer.remoteDescription?.type === "answer" || peer.signalingState === "stable") {
      this.emitSystem({
        type: "answer-already-accepted",
        message: "That response code was already accepted. Wait for the connection or reset pairing before trying another code.",
        sentAt: nowIso(),
      });
      return false;
    }
    await peer.setRemoteDescription(new globalThis.RTCSessionDescription(answerDescription));
    this.answerApplied = true;
    this.emitState();
    return true;
  }

  waitForDataChannelOpen(timeoutMs = VERIFIED_CONNECTION_TIMEOUT_MS) {
    if (this.dataChannel?.readyState === "open") return Promise.resolve(true);
    if (!this.dataChannel) return Promise.resolve(false);

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        this.peerConnection?.removeEventListener("connectionstatechange", handleConnectionState);
        this.peerConnection?.removeEventListener("iceconnectionstatechange", handleIceState);
      };
      const finish = (value) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };
      const handleConnectionState = () => {
        const state = this.peerConnection?.connectionState;
        if (["failed", "closed"].includes(state)) finish(false);
      };
      const handleIceState = () => {
        const state = this.peerConnection?.iceConnectionState;
        if (["failed", "closed"].includes(state)) finish(false);
      };
      const timeoutId = window.setTimeout(() => finish(false), timeoutMs);
      this.peerConnection?.addEventListener("connectionstatechange", handleConnectionState);
      this.peerConnection?.addEventListener("iceconnectionstatechange", handleIceState);
      this.dataChannelOpenResolvers.push(finish);
    });
  }

  waitForVerifiedConnection(timeoutMs = VERIFIED_CONNECTION_TIMEOUT_MS) {
    if (this.peerVerified && this.dataChannel?.readyState === "open") return Promise.resolve(true);
    const startedAt = nowMs();

    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        this.peerConnection?.removeEventListener("connectionstatechange", handleConnectionState);
        this.peerConnection?.removeEventListener("iceconnectionstatechange", handleIceState);
      };
      const finish = (value) => {
        if (settled) return;
        settled = true;
        this.connectionAttemptMs = Math.round(nowMs() - startedAt);
        cleanup();
        resolve(value);
      };
      const handleConnectionState = () => {
        const state = this.peerConnection?.connectionState;
        if (["failed", "closed"].includes(state)) finish(false);
      };
      const handleIceState = () => {
        const state = this.peerConnection?.iceConnectionState;
        if (["failed", "closed"].includes(state)) finish(false);
      };
      const timeoutId = window.setTimeout(() => finish(false), timeoutMs);
      this.peerConnection?.addEventListener("connectionstatechange", handleConnectionState);
      this.peerConnection?.addEventListener("iceconnectionstatechange", handleIceState);
      this.verifiedConnectionResolvers.push(finish);
      if (this.dataChannel?.readyState === "open" && this.role === "host") {
        void this.sendPeerPing();
      }
    });
  }

  getDebugState() {
    return {
      role: this.role,
      connectionState: this.peerConnection?.connectionState || this.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState || "unknown",
      iceGatheringState: this.peerConnection?.iceGatheringState || "unknown",
      signalingState: this.peerConnection?.signalingState || "unknown",
      dataChannelState: this.dataChannel?.readyState || "missing",
      hasLocalDescription: Boolean(this.peerConnection?.localDescription),
      hasRemoteDescription: Boolean(this.peerConnection?.remoteDescription),
      answerApplied: this.answerApplied,
      peerVerified: this.peerVerified,
      candidatesGathered: this.iceCandidateCount,
      generationTimeMs: this.lastIceGatheringMs,
      connectionAttemptTimeMs: this.connectionAttemptMs,
      lastError: this.lastError,
      iceWarning: this.lastIceWarning,
    };
  }

  closeSession() {
    this.stopIntervals();
    try {
      this.dataChannel?.close();
    } catch {
      // no-op
    }
    try {
      this.peerConnection?.close();
    } catch {
      // no-op
    }
    const resolvers = this.dataChannelOpenResolvers.splice(0);
    resolvers.forEach((resolve) => resolve(false));
    const verifiedResolvers = this.verifiedConnectionResolvers.splice(0);
    verifiedResolvers.forEach((resolve) => resolve(false));
    this.dataChannel = null;
    this.peerConnection = null;
    this.connectionState = "closed";
    this.peerVerified = false;
    this.answerApplied = false;
    this.iceCandidateCount = 0;
    this.emitState();
  }
}

export function createHostSession({
  hostDisplayName,
  sharedTimelineId,
  sharedTimelineCode,
  sharedTimelineName,
  getTimelineChecksum,
  sessionId,
} = {}) {
  return new PeerSyncSession({
    role: "host",
    sessionId,
    hostDisplayName,
    sharedTimelineId,
    sharedTimelineCode,
    sharedTimelineName,
    getTimelineChecksum,
  });
}

export function createJoinSession({
  guestDisplayName,
  hostDisplayName,
  sharedTimelineId,
  sharedTimelineCode,
  sharedTimelineName,
  getTimelineChecksum,
  sessionId,
} = {}) {
  return new PeerSyncSession({
    role: "guest",
    sessionId,
    guestDisplayName,
    hostDisplayName,
    sharedTimelineId,
    sharedTimelineCode,
    sharedTimelineName,
    getTimelineChecksum,
  });
}
