function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickSide() {
  return ["left", "right", "top", "bottom", "inside"][randomInt(0, 4)];
}

function pointForSide(side, width, height) {
  const margin = 160;

  if (side === "left") return { x: -margin, y: randomBetween(-40, height + 40) };
  if (side === "right") return { x: width + margin, y: randomBetween(-40, height + 40) };
  if (side === "top") return { x: randomBetween(-40, width + 40), y: -margin };
  if (side === "bottom") return { x: randomBetween(-40, width + 40), y: height + margin };

  return { x: randomBetween(width * 0.12, width * 0.88), y: randomBetween(height * 0.12, height * 0.82) };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function generateOrbEscapePath() {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const height = typeof window === "undefined" ? 720 : window.innerHeight;
  const start = pointForSide(pickSide(), width, height);
  let exit = pointForSide(pickSide(), width, height);

  if (Math.abs(start.x - exit.x) < width * 0.25 && Math.abs(start.y - exit.y) < height * 0.25) {
    exit = pointForSide(start.x < width / 2 ? "right" : "left", width, height);
  }

  const pointCount = randomInt(5, 9);
  const x = [start.x];
  const y = [start.y];
  const scale = [randomBetween(0.55, 0.95)];
  const rotate = [0];
  const direction = Math.random() > 0.5 ? 1 : -1;
  let spin = 0;

  for (let index = 1; index < pointCount - 1; index += 1) {
    const progress = index / (pointCount - 1);
    const panicX = randomBetween(-width * 0.28, width * 0.28);
    const panicY = randomBetween(-height * 0.3, height * 0.3);

    x.push(clamp(start.x + (exit.x - start.x) * progress + panicX, -190, width + 190));
    y.push(clamp(start.y + (exit.y - start.y) * progress + panicY, -190, height + 190));
    scale.push(randomBetween(0.62, 1.48));
    spin += direction * randomBetween(95, 310);
    rotate.push(spin);
  }

  x.push(exit.x);
  y.push(exit.y);
  scale.push(0.08);
  rotate.push(spin + direction * randomBetween(160, 420));

  return {
    x,
    y,
    scale,
    rotate,
    wobble: {
      skewX: [0, randomBetween(-9, -4), randomBetween(4, 11), randomBetween(-5, 5), 0],
      skewY: [0, randomBetween(3, 9), randomBetween(-10, -4), randomBetween(-4, 6), 0],
    },
    pulseDuration: randomBetween(0.24, 0.46),
    duration: randomBetween(2.1, 3.2),
  };
}

export function generateIdleOrbPosition() {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const height = typeof window === "undefined" ? 720 : window.innerHeight;

  return {
    x: randomBetween(width * 0.05, width * 0.82),
    y: randomBetween(height * 0.08, height * 0.72),
    driftX: [0, randomBetween(-70, 90), randomBetween(-40, 60), 0],
    driftY: [0, randomBetween(-50, 65), randomBetween(-60, 40), 0],
    duration: randomBetween(24, 38),
  };
}

export function generateOrbPanicExit(idle) {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const height = typeof window === "undefined" ? 720 : window.innerHeight;
  const side = ["left", "right", "top", "bottom"][randomInt(0, 3)];
  const startX = idle?.x || idle?.left || width * 0.5;
  const startY = idle?.y || idle?.top || height * 0.5;
  const exit =
    side === "left"
      ? { x: -220, y: startY + randomBetween(-90, 90) }
      : side === "right"
        ? { x: width + 220, y: startY + randomBetween(-90, 90) }
        : side === "top"
          ? { x: startX + randomBetween(-140, 140), y: -220 }
          : { x: startX + randomBetween(-140, 140), y: height + 220 };

  return {
    x: [startX, startX + randomBetween(-40, 40), exit.x],
    y: [startY, startY + randomBetween(-40, 40), exit.y],
    scale: [0.88, 1.08, 0.72],
    rotate: [0, randomBetween(-120, 120), randomBetween(220, 520)],
    duration: randomBetween(0.5, 0.9),
  };
}

export function generateOrbReturnPath(path, idle) {
  const width = typeof window === "undefined" ? 1280 : window.innerWidth;
  const height = typeof window === "undefined" ? 720 : window.innerHeight;
  const startX = Array.isArray(path?.x) ? path.x[path.x.length - 1] : randomBetween(-140, width + 140);
  const startY = Array.isArray(path?.y) ? path.y[path.y.length - 1] : randomBetween(-140, height + 140);
  const targetX = idle?.x || idle?.left || width * 0.45;
  const targetY = idle?.y || idle?.top || height * 0.35;
  const driftX = targetX + randomBetween(-36, 36);
  const driftY = targetY + randomBetween(-28, 28);

  return {
    x: [startX, driftX, targetX],
    y: [startY, driftY, targetY],
    scale: [0.22, 0.68, 0.5],
    rotate: [
      randomBetween(-120, 120),
      randomBetween(120, 260),
      randomBetween(260, 420),
    ],
    duration: randomBetween(0.7, 1.2),
  };
}
