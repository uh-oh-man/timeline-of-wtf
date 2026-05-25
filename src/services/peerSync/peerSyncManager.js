import { createMessage, createHeartbeat, createTimelineChecksum, HEARTBEAT_INTERVAL_MS, CHECKSUM_INTERVAL_MS } from "./peerMessages";
import { createEncryptedEnvelope, derivePeerKey, generateSalt, openEncryptedEnvelope } from "./peerCrypto";

const DEFAULT_ICE_SERVERS = [];

function waitForIceGatheringComplete(peerConnection) {
  if (peerConnection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    function handleStateChange() {
      if (peerConnection.iceGatheringState === "complete") {
        peerConnection.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve();
      }
    }
    peerConnection.addEventListener("icegatheringstatechange", handleStateChange);
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
  }

  emitState() {
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

    this.peerConnection.oniceconnectionstatechange = () => {
      this.emitSystem({
        type: "ice-state",
        state: this.peerConnection?.iceConnectionState || "unknown",
        sentAt: nowIso(),
      });
    };

    this.peerConnection.ondatachannel = (event) => {
      this.attachDataChannel(event.channel);
    };
  }

  createPeerConnection() {
    if (this.peerConnection) return this.peerConnection;
    this.peerConnection = new globalThis.RTCPeerConnection({ iceServers: this.iceServers });
    this.registerPeerConnectionHandlers();
    return this.peerConnection;
  }

  attachDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.onopen = () => {
      this.emitState();
      this.emitSystem({
        type: "channel-open",
        sentAt: nowIso(),
      });
    };
    this.dataChannel.onclose = () => {
      this.emitState();
      this.emitSystem({
        type: "channel-close",
        sentAt: nowIso(),
      });
    };
    this.dataChannel.onerror = (error) => {
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
        message = await openEncryptedEnvelope(parsed, this.cryptoKey);
      }
      this.messageListeners.forEach((listener) => listener(message));
    } catch (error) {
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
    });
    return () => this.stateListeners.delete(handler);
  }

  onSystem(handler) {
    this.systemListeners.add(handler);
    return () => this.systemListeners.delete(handler);
  }

  getConnectionState() {
    if (this.dataChannel?.readyState === "open") return "connected";
    return this.peerConnection?.connectionState || this.connectionState || "disconnected";
  }

  async createOffer() {
    const peer = this.createPeerConnection();
    const channel = peer.createDataChannel("twtaf-peer-sync", { ordered: true });
    this.attachDataChannel(channel);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitForIceGatheringComplete(peer);
    this.emitState();
    return peer.localDescription;
  }

  async acceptOfferAndCreateAnswer(offerDescription) {
    const peer = this.createPeerConnection();
    await peer.setRemoteDescription(new globalThis.RTCSessionDescription(offerDescription));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitForIceGatheringComplete(peer);
    this.emitState();
    return peer.localDescription;
  }

  async acceptAnswer(answerDescription) {
    const peer = this.createPeerConnection();
    await peer.setRemoteDescription(new globalThis.RTCSessionDescription(answerDescription));
    this.emitState();
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
    this.dataChannel = null;
    this.peerConnection = null;
    this.connectionState = "closed";
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
