import { normalizeText } from "./helpers";

export function isTypingTarget(target) {
  if (!target) return false;

  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

export function installKeyboardTriggers({ onAgeGate, onOrb, onAds, onTos, onCaptcha, onAchievements, onAdmin, onLore }) {
  let typed = [];

  function onKeyDown(event) {
    if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key.length !== 1) return;

    const now = performance.now();
    typed = [...typed.filter((entry) => now - entry.time <= 3000), { key: normalizeText(event.key), time: now }];

    const sequence = typed.map((entry) => entry.key).join("");

    if (sequence.endsWith("id")) {
      typed = [];
      onAgeGate();
      return;
    }

    if (sequence.endsWith("nrop")) {
      typed = [];
      onOrb();
      return;
    }

    if (sequence.endsWith("ads")) {
      typed = [];
      onAds();
      return;
    }

    if (sequence.endsWith("tos")) {
      typed = [];
      onTos();
      return;
    }

    if (sequence.endsWith("cap")) {
      typed = [];
      onCaptcha();
      return;
    }

    if (sequence.endsWith("ach")) {
      typed = [];
      onAchievements();
      return;
    }

    if (sequence.endsWith("lore")) {
      typed = [];
      onLore?.();
      return;
    }

    if (sequence.endsWith("admin")) {
      typed = [];
      onAdmin();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
