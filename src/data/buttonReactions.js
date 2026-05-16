export const buttonReactions = {
  happy: {
    overlay: "spark",
    duration: 640,
    motion: { rotate: [0, -3, 3, -2, 0], scale: [1, 1.05, 0.98, 1.02, 1] },
    messages: [
      "The button enjoyed that.",
      "Button morale increased.",
      "The button feels seen.",
      "Do not encourage the button.",
      "The button is now emotionally invested.",
    ],
  },
  nervous: {
    overlay: "bubble",
    duration: 560,
    motion: { x: [0, -4, 5, -3, 2, 0], scale: [1, 0.98, 1.02, 1] },
    messages: [
      "The button panicked.",
      "Button confidence failed.",
      "The button regrets being clickable.",
      "The button has requested reassignment.",
    ],
  },
  bureaucratic: {
    overlay: "progress",
    duration: 820,
    motion: { y: [0, 1, -1, 0], scale: [1, 0.99, 1.01, 1] },
    messages: [
      "Filing paperwork...",
      "Stamping nonsense...",
      "Submitting to the Department of Canon Safety...",
      "Request ignored successfully.",
      "Please wait while nothing meaningful happens.",
    ],
  },
  petty: {
    overlay: "bubble",
    duration: 620,
    motion: { x: [0, 8, -2, 0], rotate: [0, 1, -1, 0] },
    messages: [
      "Clicked under protest.",
      "The button will remember this.",
      "Fine.",
      "Rude.",
      "Interaction logged emotionally.",
    ],
  },
  orbTouched: {
    overlay: "orb",
    duration: 720,
    motion: { scale: [1, 1.04, 1], boxShadow: ["0 0 0 rgba(14,165,233,0)", "0 0 24px rgba(14,165,233,0.5)", "0 0 0 rgba(220,38,38,0)"] },
    messages: [
      "Orb residue detected.",
      "The orb approved this interaction.",
      "This button has been canonized.",
      "A tiny amount of orb leaked into the UI.",
    ],
  },
  dramatic: {
    overlay: "stamp",
    duration: 760,
    motion: { scale: [1, 1.08, 0.98, 1], rotate: [0, -1, 1, 0] },
    messages: [
      "APPROVED",
      "DENIED",
      "CANONIZED",
      "IGNORED",
      "LEGALLY DUBIOUS",
      "FILED INCORRECTLY",
    ],
  },
};
