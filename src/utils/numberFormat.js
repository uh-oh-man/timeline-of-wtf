function createFormatter(options) {
  try {
    return new Intl.NumberFormat(undefined, options);
  } catch {
    return null;
  }
}

const compactFormatter = createFormatter({
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = createFormatter({
  maximumFractionDigits: 0,
});

function fallbackIntegerFormat(value) {
  const sign = value < 0 ? "-" : "";
  const digits = String(Math.abs(Math.trunc(value)));
  return `${sign}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatLimeNumber(value = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  const absolute = Math.abs(numeric);
  if (absolute >= 10000 && compactFormatter) return compactFormatter.format(numeric);
  if (integerFormatter) return integerFormatter.format(Math.floor(numeric));
  return fallbackIntegerFormat(Math.floor(numeric));
}

export function formatLimesLabel(value = 0) {
  return `${formatLimeNumber(value)} limes`;
}

export function formatRate(value = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  if (Math.abs(numeric) < 0.1) return numeric.toFixed(2);
  if (Math.abs(numeric) < 10) return numeric.toFixed(1);
  return formatLimeNumber(numeric);
}
