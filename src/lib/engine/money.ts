/** Numeric safety + formatting helpers. No NaN / Infinity may ever escape. */

export const safe = (n: unknown, fallback = 0): number => {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return v;
};

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, safe(n, min)));

export const nonNegative = (n: unknown): number => Math.max(0, safe(n, 0));

/** Rounds to a sensible planning precision (avoids false precision). */
export const roundPlanning = (n: number): number => {
  const v = nonNegative(n);
  if (v === 0) return 0;
  if (v < 10_000) return Math.round(v / 100) * 100;
  if (v < 1_000_000) return Math.round(v / 1_000) * 1_000;
  if (v < 100_000_000) return Math.round(v / 10_000) * 10_000;
  return Math.round(v / 100_000) * 100_000;
};

export const formatNaira = (n: number, opts?: { decimals?: boolean }): string => {
  const v = safe(n, 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  return `${sign}₦${abs.toLocaleString('en-NG', {
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  })}`;
};

/** Compact display, e.g. ₦8.4m — used for headline cards and charts. */
export const formatCompact = (n: number): string => {
  const v = safe(n, 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}bn`;
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}m`;
  if (abs >= 1_000) return `${sign}₦${Math.round(abs / 1_000)}k`;
  return `${sign}₦${Math.round(abs)}`;
};

export const formatRange = (low: number, high: number): string =>
  `${formatCompact(low)} – ${formatCompact(high)}`;

export const formatPercent = (n: number, decimals = 0): string =>
  `${safe(n, 0).toFixed(decimals)}%`;

export const pct = (part: number, whole: number): number => {
  const w = safe(whole, 0);
  if (w === 0) return 0;
  return clamp((safe(part, 0) / w) * 100, -999, 999);
};
