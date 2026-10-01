/**
 * INFLATION DATA LAYER
 *
 * Historical figures are reported annual average headline CPI inflation for
 * Nigeria (NBS). NOTE: the CPI basket was rebased in 2025, so pre-2025 and
 * post-2025 headline figures are not on a like-for-like basis — this is
 * surfaced in the UI rather than hidden.
 *
 * Forward-looking numbers are NOT forecasts of fact. They are three bounded
 * SCENARIOS used for projection, and the user can override them.
 */
import type { DataKind } from './sources';

export interface InflationObservation {
  year: number;
  rate: number; // percent, annual average headline CPI
  kind: DataKind;
  sourceId: string;
  note?: string;
}

export const HISTORICAL_INFLATION: InflationObservation[] = [
  { year: 2015, rate: 9.0, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2016, rate: 15.7, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2017, rate: 16.5, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2018, rate: 12.1, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2019, rate: 11.4, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2020, rate: 13.2, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2021, rate: 17.0, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2022, rate: 18.8, kind: 'verified', sourceId: 'nbs-cpi' },
  { year: 2023, rate: 24.7, kind: 'verified', sourceId: 'nbs-cpi' },
  {
    year: 2024,
    rate: 33.2,
    kind: 'verified',
    sourceId: 'nbs-cpi',
    note: 'Old (pre-rebase) CPI basket.',
  },
  {
    year: 2025,
    rate: 23.0,
    kind: 'derived',
    sourceId: 'nbs-cpi',
    note: 'Rebased CPI basket — not directly comparable with earlier years. Treated as an approximate annual average.',
  },
];

export interface InflationScenario {
  id: 'low' | 'baseline' | 'high';
  label: string;
  rate: number; // long-run assumed annual rate, percent
  description: string;
  kind: DataKind;
  sourceId: string;
}

export const INFLATION_SCENARIOS: InflationScenario[] = [
  {
    id: 'low',
    label: 'Low inflation',
    rate: 11,
    description:
      'Assumes disinflation towards the lower end of Nigeria\'s last decade of experience, closer to the 2018–2019 period.',
    kind: 'estimated',
    sourceId: 'imf-weo',
  },
  {
    id: 'baseline',
    label: 'Baseline',
    rate: 17,
    description:
      'Approximately the 10-year average of reported annual headline inflation. Used as the default long-run planning assumption.',
    kind: 'derived',
    sourceId: 'nbs-cpi',
  },
  {
    id: 'high',
    label: 'High inflation',
    rate: 26,
    description:
      'Assumes a period similar to 2023–2024, when currency and fuel-price adjustments pushed headline inflation well above trend.',
    kind: 'estimated',
    sourceId: 'imf-weo',
  },
];

export const scenarioById = (id: string): InflationScenario =>
  INFLATION_SCENARIOS.find((s) => s.id === id) ?? INFLATION_SCENARIOS[1];

/** Ten-year average of the historical series, used to justify the baseline. */
export const historicalAverage = (years = 10): number => {
  const slice = HISTORICAL_INFLATION.slice(-years);
  if (!slice.length) return 0;
  return slice.reduce((sum, o) => sum + o.rate, 0) / slice.length;
};

/**
 * Category-relative inflation. Some categories have persistently run above or
 * below headline CPI (food above; communication below). These are DERIVED
 * relative weights applied to whichever headline scenario is selected.
 */
export const CATEGORY_INFLATION_WEIGHTS: Record<string, number> = {
  housing: 0.95,
  food: 1.15,
  education: 1.05,
  transportation: 1.1,
  healthcare: 1.05,
  utilities: 1.1,
  communication: 0.7,
  personal: 1.0,
  childcare: 1.0,
  other: 1.0,
};
