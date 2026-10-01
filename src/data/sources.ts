/**
 * DATA SOURCE REGISTRY — single source of truth for provenance metadata.
 *
 * Every economic figure used anywhere in the application must reference a
 * source id defined here. The UI ("Where Our Numbers Come From") reads this
 * registry directly, so provenance can never drift out of sync with the data.
 */

export type Confidence = 'high' | 'medium' | 'low';

/**
 * VERIFIED  — taken directly from a trusted publication.
 * DERIVED   — computed from verified data (e.g. a ratio applied to a verified base).
 * ESTIMATED — a clearly-labelled placeholder because reliable granular data does not exist.
 * USER      — supplied by the person using the calculator.
 */
export type DataKind = 'verified' | 'derived' | 'estimated' | 'user';

export interface DataSource {
  id: string;
  organization: string;
  title: string;
  url: string;
  scope: string;
  period: string;
  lastReviewed: string; // ISO date this registry entry was last reviewed by a maintainer
  methodology: string;
  confidence: Confidence;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'nbs-cpi',
    organization: 'National Bureau of Statistics (Nigeria)',
    title: 'Consumer Price Index & Inflation Report',
    url: 'https://nigerianstat.gov.ng/elibrary',
    scope: 'Nigeria (national, with urban/rural split)',
    period: '2015 – 2025 (monthly, annual averages derived)',
    lastReviewed: '2026-09-01',
    methodology:
      'NBS collects prices for a national basket of goods and services and publishes headline, food and core CPI. The CPI basket and base year were rebased in 2025, which creates a discontinuity with pre-2025 headline figures. Annual average rates shown here are the published/reported annual averages.',
    confidence: 'high',
  },
  {
    id: 'cbn-stats',
    organization: 'Central Bank of Nigeria',
    title: 'Statistical Bulletin & Monetary Policy Communiqués',
    url: 'https://www.cbn.gov.ng/documents/statbulletin.html',
    scope: 'Nigeria',
    period: 'Rolling',
    lastReviewed: '2026-09-01',
    methodology:
      'Policy rate, credit conditions and CBN inflation outlook statements are used to bound the inflation scenario range rather than to set point forecasts.',
    confidence: 'high',
  },
  {
    id: 'worldbank-wdi',
    organization: 'World Bank',
    title: 'World Development Indicators — Nigeria',
    url: 'https://data.worldbank.org/country/nigeria',
    scope: 'Nigeria (national aggregates)',
    period: '1990 – latest available',
    lastReviewed: '2026-09-01',
    methodology:
      'Compiled from official national statistics. Used for long-run inflation context and household consumption structure.',
    confidence: 'high',
  },
  {
    id: 'imf-weo',
    organization: 'International Monetary Fund',
    title: 'World Economic Outlook database — Nigeria',
    url: 'https://www.imf.org/en/Publications/WEO',
    scope: 'Nigeria',
    period: 'Historical + medium-term projections',
    lastReviewed: '2026-09-01',
    methodology:
      'IMF staff projections for consumer prices. Used only to bound the low/baseline/high inflation scenarios, never as a guarantee.',
    confidence: 'medium',
  },
  {
    id: 'nbs-household-survey',
    organization: 'National Bureau of Statistics (Nigeria)',
    title: 'Nigeria Living Standards Survey / Household Consumption structure',
    url: 'https://nigerianstat.gov.ng/elibrary',
    scope: 'Nigeria, by state',
    period: '2018/19 survey, subsequent updates',
    lastReviewed: '2026-09-01',
    methodology:
      'Household consumption expenditure shares by category. Used to weight category baskets (food share, housing share, transport share) rather than to set absolute prices.',
    confidence: 'medium',
  },
  {
    id: 'nhia-scheme',
    organization: 'National Health Insurance Authority (Nigeria)',
    title: 'NHIA scheme structure and published contribution guidance',
    url: 'https://www.nhia.gov.ng/',
    scope: 'Nigeria',
    period: 'Rolling',
    lastReviewed: '2026-09-01',
    methodology:
      'Scheme design and family-plan structure inform the insurance component. Private HMO pricing is not centrally published, so premiums are modelled as a labelled estimate.',
    confidence: 'medium',
  },
  {
    id: 'edu-published-fees',
    organization: 'Nigerian universities & regulators (NUC, individual institutions)',
    title: 'Publicly published tuition and fee schedules',
    url: 'https://www.nuc.edu.ng/',
    scope: 'Nigeria',
    period: '2024 – 2026 published schedules',
    lastReviewed: '2026-09-01',
    methodology:
      'Institutions publish their own fee schedules; there is no single national dataset. Ranges here are compiled bands across institution types, not a single institution, and are therefore treated as ESTIMATED bands.',
    confidence: 'low',
  },
  {
    id: 'internal-model',
    organization: 'This platform (internal model)',
    title: 'Location cost multipliers & category baskets',
    url: '',
    scope: 'Nigeria, by state/city',
    period: 'Assumption set v1',
    lastReviewed: '2026-09-01',
    methodology:
      'Location multipliers are DERIVED from published state-level CPI variation and urban/rural cost differentials, then normalised so that a national urban reference city = 1.00. They are explicitly modelling assumptions, are versioned, and can be replaced by an administrator without code changes.',
    confidence: 'low',
  },
];

export const SOURCE_BY_ID: Record<string, DataSource> = DATA_SOURCES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<string, DataSource>,
);

export const KIND_LABEL: Record<DataKind, string> = {
  verified: 'Verified',
  derived: 'Derived',
  estimated: 'Estimated',
  user: 'Your input',
};

export const KIND_DESCRIPTION: Record<DataKind, string> = {
  verified: 'Taken directly from a named official publication.',
  derived: 'Calculated from verified data using a documented method.',
  estimated:
    'A labelled placeholder used because no sufficiently reliable granular dataset is published. Replace it with your own figure for a better estimate.',
  user: 'A value you entered yourself.',
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};
