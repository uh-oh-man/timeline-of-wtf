const PEER_CODE_PREFIX = "TWTAF_PEER_V1:";

function toBase64(value) {
  const utf8 = new globalThis.TextEncoder().encode(value);
  let binary = "";
  utf8.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return globalThis.btoa(binary);
}

function fromBase64(value) {
  const binary = globalThis.atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new globalThis.TextDecoder().decode(bytes);
}

export function encodePeerCode(payload) {
  const serialized = JSON.stringify(payload);
  return `${PEER_CODE_PREFIX}${toBase64(serialized)}`;
}

export function decodePeerCode(code) {
  const raw = String(code || "").trim();
  if (!raw.startsWith(PEER_CODE_PREFIX)) {
    throw new Error("Invalid peer code prefix.");
  }
  const encoded = raw.slice(PEER_CODE_PREFIX.length);
  const parsed = JSON.parse(fromBase64(encoded));
  return parsed;
}

export function validatePeerCode(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, reason: "invalid-payload" };
  }
  if (!payload.version || Number(payload.version) !== 1) {
    return { valid: false, reason: "unsupported-version" };
  }
  if (!payload.kind || !["offer", "answer"].includes(payload.kind)) {
    return { valid: false, reason: "invalid-kind" };
  }
  if (!payload.sessionDescription || typeof payload.sessionDescription !== "object") {
    return { valid: false, reason: "missing-session-description" };
  }
  if (!payload.sessionDescription.type || !payload.sessionDescription.sdp) {
    return { valid: false, reason: "invalid-session-description" };
  }
  return { valid: true };
}

export { PEER_CODE_PREFIX };
