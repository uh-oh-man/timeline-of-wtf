const PBKDF2_ITERATIONS = 150000;
const KEY_LENGTH = 256;

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return globalThis.btoa(binary);
}

function base64ToBytes(base64) {
  const binary = globalThis.atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function encodeJson(value) {
  return new globalThis.TextEncoder().encode(JSON.stringify(value));
}

function decodeJson(bytes) {
  return JSON.parse(new globalThis.TextDecoder().decode(bytes));
}

export function generateSalt() {
  return bytesToBase64(randomBytes(16));
}

export function generateIv() {
  return bytesToBase64(randomBytes(12));
}

export function generateSecurityKey() {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
  const chars = [];
  for (let index = 0; index < 20; index += 1) {
    chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return `${chars.slice(0, 5).join("")}-${chars.slice(5, 10).join("")}-${chars.slice(10, 15).join("")}-${chars.slice(15).join("")}`;
}

export async function derivePeerKey(passphrase, saltBase64) {
  const cleanPassphrase = String(passphrase || "");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new globalThis.TextEncoder().encode(cleanPassphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const salt = base64ToBytes(String(saltBase64 || ""));
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPeerMessage(messageObject, cryptoKey, ivBase64) {
  const iv = base64ToBytes(ivBase64);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encodeJson(messageObject),
  );
  return bytesToBase64(new Uint8Array(encrypted));
}

export async function decryptPeerMessage(encryptedPayload, cryptoKey, ivBase64) {
  const iv = base64ToBytes(ivBase64);
  const payloadBytes = base64ToBytes(encryptedPayload);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    payloadBytes,
  );
  return decodeJson(new Uint8Array(decrypted));
}

export async function createEncryptedEnvelope(messageObject, cryptoKey) {
  const iv = generateIv();
  const payload = await encryptPeerMessage(messageObject, cryptoKey, iv);
  return {
    encrypted: true,
    version: 1,
    iv,
    payload,
    sentAt: new Date().toISOString(),
  };
}

export async function openEncryptedEnvelope(envelope, cryptoKey) {
  if (!envelope?.encrypted || !envelope?.iv || !envelope?.payload) {
    throw new Error("Invalid encrypted envelope.");
  }
  return decryptPeerMessage(envelope.payload, cryptoKey, envelope.iv);
}
