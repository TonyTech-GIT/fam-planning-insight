/**
 * COST BASELINE DATA LAYER  (assumption set v1)
 *
 * All figures are monthly, in Naira, expressed for a NATIONAL URBAN REFERENCE
 * CITY (multiplier 1.00) and for ONE ADULT unless stated otherwise. The engine
 * applies location multipliers, household-size scaling and lifestyle tiers.
 *
 * Nothing here is presented as an official statistic. Each record carries a
 * `kind` and a `sourceId`, and every one of them is user-overridable.
 */
import type { DataKind } from './sources';

export interface CostRecord {
  id: string;
  label: string;
  value: number;
  unit: string;
  kind: DataKind;
  sourceId: string;
  note?: string;
}

export type LifestyleId = 'essential' | 'modest' | 'comfortable' | 'high';

export const LIFESTYLE_TIERS: { id: LifestyleId; label: string; factor: number; blurb: string }[] = [
  { id: 'essential', label: 'Essential', factor: 0.72, blurb: 'Needs-first spending, little discretionary budget.' },
  { id: 'modest', label: 'Modest', factor: 1.0, blurb: 'Covers needs with a small margin for social life.' },
  { id: 'comfortable', label: 'Comfortable', factor: 1.45, blurb: 'Room for leisure, better quality goods, some help.' },
  { id: 'high', label: 'High-comfort', factor: 2.2, blurb: 'Premium goods, travel, domestic staff, private services.' },
];

export const lifestyleFactor = (id: LifestyleId): number =>
  LIFESTYLE_TIERS.find((t) => t.id === id)?.factor ?? 1;

/* ------------------------------------------------------------------ */
/* MONTHLY PER-ADULT BASELINES (modest tier, reference city)          */
/* ------------------------------------------------------------------ */

export const MONTHLY_BASELINES: Record<string, CostRecord> = {
  foodPerAdult: {
    id: 'foodPerAdult',
    label: 'Food per adult',
    value: 78000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'nbs-household-survey',
    note: 'Modelled from NBS food CPI movement and household food expenditure shares. Food is the single largest driver of Nigerian household inflation.',
  },
  foodPerChild: {
    id: 'foodPerChild',
    label: 'Food per child',
    value: 46000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'nbs-household-survey',
    note: 'Approximately 60% of an adult food budget, averaged across ages.',
  },
  utilitiesBase: {
    id: 'utilitiesBase',
    label: 'Utilities — household base',
    value: 42000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
    note: 'Electricity (band-dependent), water, cooking gas, refuse. Highly sensitive to tariff band and generator/inverter use.',
  },
  utilitiesPerPerson: {
    id: 'utilitiesPerPerson',
    label: 'Utilities — per additional person',
    value: 7000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  communicationPerAdult: {
    id: 'communicationPerAdult',
    label: 'Airtime & data per adult',
    value: 16000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  internetHousehold: {
    id: 'internetHousehold',
    label: 'Home internet',
    value: 22000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  personalCarePerPerson: {
    id: 'personalCarePerPerson',
    label: 'Personal care & clothing per person',
    value: 18000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'nbs-household-survey',
  },
  householdRunning: {
    id: 'householdRunning',
    label: 'Household consumables & maintenance',
    value: 30000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  domesticHelp: {
    id: 'domesticHelp',
    label: 'Domestic help (if selected)',
    value: 70000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  childcarePerYoungChild: {
    id: 'childcarePerYoungChild',
    label: 'Childcare / nanny per child under 5',
    value: 55000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  entertainmentPerAdult: {
    id: 'entertainmentPerAdult',
    label: 'Entertainment & social per adult',
    value: 20000,
    unit: '₦ / month',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  communityObligations: {
    id: 'communityObligations',
    label: 'Religious / community obligations (optional)',
    value: 25000,
    unit: '₦ / month',
    kind: 'user',
    sourceId: 'internal-model',
    note: 'Entirely optional and user-selected. Not assumed by default beyond the amount you choose.',
  },
};

/* ------------------------------------------------------------------ */
/* HOUSING                                                            */
/* ------------------------------------------------------------------ */

export type HousingTierId = 'basic' | 'moderate' | 'comfortable' | 'premium';

export interface HousingTier {
  id: HousingTierId;
  label: string;
  /** annual rent, reference city, per bedroom-equivalent baseline */
  annualRentPerBedroom: number;
  setupPerBedroom: number;
  description: string;
  kind: DataKind;
  sourceId: string;
}

export const HOUSING_TIERS: HousingTier[] = [
  {
    id: 'basic',
    label: 'Basic',
    annualRentPerBedroom: 320000,
    setupPerBedroom: 350000,
    description: 'Face-me-I-face-you / basic self-contained standard, shared facilities common.',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    annualRentPerBedroom: 650000,
    setupPerBedroom: 700000,
    description: 'Self-contained flat in a serviceable neighbourhood, tiled, prepaid meter.',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  {
    id: 'comfortable',
    label: 'Comfortable',
    annualRentPerBedroom: 1200000,
    setupPerBedroom: 1300000,
    description: 'Modern flat in an estate, decent security, water supply, parking.',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  {
    id: 'premium',
    label: 'Premium',
    annualRentPerBedroom: 2600000,
    setupPerBedroom: 2600000,
    description: 'Serviced apartment or detached home in a high-demand area.',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
];

export const housingTier = (id: HousingTierId): HousingTier =>
  HOUSING_TIERS.find((t) => t.id === id) ?? HOUSING_TIERS[1];

export const HOUSING_EXTRAS: Record<string, CostRecord> = {
  agencyAndLegalShare: {
    id: 'agencyAndLegalShare',
    label: 'Agency + legal fees (share of first-year rent)',
    value: 0.2,
    unit: 'ratio',
    kind: 'estimated',
    sourceId: 'internal-model',
    note: 'Commonly 10% agency + 10% legal on first-year rent in Nigerian urban markets.',
  },
  cautionDepositShare: {
    id: 'cautionDepositShare',
    label: 'Caution / security deposit (share of annual rent)',
    value: 0.1,
    unit: 'ratio',
    kind: 'estimated',
    sourceId: 'internal-model',
  },
  ownerMonthlyMaintenanceShare: {
    id: 'ownerMonthlyMaintenanceShare',
    label: 'Owner-occupier maintenance & levies (share of equivalent rent)',
    value: 0.35,
    unit: 'ratio',
    kind: 'estimated',
    sourceId: 'internal-model',
    note: 'If you already own, you avoid rent but still carry maintenance, service charge and levies.',
  },
  mortgageRate: {
    id: 'mortgageRate',
    label: 'Assumed mortgage interest rate',
    value: 0.21,
    unit: 'annual rate',
    kind: 'estimated',
    sourceId: 'cbn-stats',
    note: 'Commercial mortgage pricing in Nigeria typically tracks well above the policy rate. NHF-backed loans can be materially cheaper but are supply-constrained.',
  },
};

/* ------------------------------------------------------------------ */
/* EDUCATION — annual, per child, reference city                      */
/* ------------------------------------------------------------------ */

export interface EducationOption {
  id: string;
  stage: 'primary' | 'secondary' | 'tertiary';
  label: string;
  tuition: number;
  accommodation: number;
  transport: number;
  materials: number;
  technology: number;
  feeding: number;
  misc: number;
  kind: DataKind;
  sourceId: string;
  note?: string;
}

const edu = (
  id: string,
  stage: EducationOption['stage'],
  label: string,
  parts: Omit<EducationOption, 'id' | 'stage' | 'label' | 'kind' | 'sourceId' | 'note'>,
  note?: string,
): EducationOption => ({ id, stage, label, ...parts, kind: 'estimated', sourceId: 'edu-published-fees', note });

export const EDUCATION_OPTIONS: EducationOption[] = [
  edu('primary-public', 'primary', 'Public primary school', {
    tuition: 25000, accommodation: 0, transport: 60000, materials: 45000, technology: 0, feeding: 120000, misc: 40000,
  }, 'Tuition is nominally free in many states; levies, uniforms, books and PTA charges still apply.'),
  edu('primary-private', 'primary', 'Private primary school', {
    tuition: 450000, accommodation: 0, transport: 180000, materials: 90000, technology: 40000, feeding: 200000, misc: 90000,
  }),
  edu('primary-premium', 'primary', 'Premium private primary', {
    tuition: 2200000, accommodation: 0, transport: 400000, materials: 200000, technology: 150000, feeding: 450000, misc: 300000,
  }),
  edu('secondary-public', 'secondary', 'Public secondary school', {
    tuition: 45000, accommodation: 0, transport: 90000, materials: 70000, technology: 20000, feeding: 180000, misc: 60000,
  }),
  edu('secondary-private', 'secondary', 'Private secondary (day)', {
    tuition: 750000, accommodation: 0, transport: 240000, materials: 120000, technology: 70000, feeding: 260000, misc: 140000,
  }),
  edu('secondary-boarding', 'secondary', 'Private secondary (boarding)', {
    tuition: 1600000, accommodation: 600000, transport: 150000, materials: 180000, technology: 100000, feeding: 0, misc: 250000,
  }, 'Feeding is generally inside boarding fees.'),
  edu('secondary-premium', 'secondary', 'Premium private secondary', {
    tuition: 4500000, accommodation: 1200000, transport: 300000, materials: 300000, technology: 250000, feeding: 0, misc: 600000,
  }),
  edu('tertiary-public', 'tertiary', 'Nigerian public university', {
    tuition: 180000, accommodation: 250000, transport: 200000, materials: 150000, technology: 250000, feeding: 700000, misc: 200000,
  }, 'Federal tuition is low but accommodation, feeding and materials dominate the real cost.'),
  edu('tertiary-poly', 'tertiary', 'Polytechnic / College of Education', {
    tuition: 150000, accommodation: 220000, transport: 180000, materials: 120000, technology: 200000, feeding: 620000, misc: 180000,
  }),
  edu('tertiary-private', 'tertiary', 'Nigerian private university', {
    tuition: 2600000, accommodation: 700000, transport: 250000, materials: 200000, technology: 350000, feeding: 400000, misc: 350000,
  }, 'Wide band: some private universities are far above this, a few below.'),
  edu('tertiary-foreign', 'tertiary', 'Foreign university', {
    tuition: 18000000, accommodation: 9000000, transport: 3000000, materials: 900000, technology: 900000, feeding: 4500000, misc: 2000000,
  }, 'Extremely sensitive to the exchange rate and destination country. Treat as a rough order of magnitude only.'),
  edu('tertiary-none', 'tertiary', 'No tertiary education budgeted', {
    tuition: 0, accommodation: 0, transport: 0, materials: 0, technology: 0, feeding: 0, misc: 0,
  }),
];

export const educationOption = (id: string): EducationOption | undefined =>
  EDUCATION_OPTIONS.find((e) => e.id === id);

export const educationTotal = (o: EducationOption): number =>
  o.tuition + o.accommodation + o.transport + o.materials + o.technology + o.feeding + o.misc;

export const EDUCATION_STAGES = {
  primary: { startAge: 5, endAge: 11, years: 7 },
  secondary: { startAge: 12, endAge: 17, years: 6 },
  tertiary: { startAge: 18, endAge: 21, years: 4 },
} as const;

export const ADMISSION_ONE_OFF: CostRecord = {
  id: 'admissionOneOff',
  label: 'Admission / acceptance one-off per stage',
  value: 0.25,
  unit: 'share of one year of that stage',
  kind: 'estimated',
  sourceId: 'internal-model',
};

/* ------------------------------------------------------------------ */
/* HEALTHCARE — annual per person                                     */
/* ------------------------------------------------------------------ */

export const HEALTHCARE: Record<string, CostRecord> = {
  routineAdult: {
    id: 'routineAdult', label: 'Routine care per adult', value: 90000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'nhia-scheme',
  },
  routineChild: {
    id: 'routineChild', label: 'Routine care per child', value: 120000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'nhia-scheme',
    note: 'Children under five typically have more frequent visits and immunisation costs.',
  },
  insuranceFamilyPlan: {
    id: 'insuranceFamilyPlan', label: 'Private HMO family plan', value: 420000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'nhia-scheme',
    note: 'HMO pricing is not centrally published; bands vary widely by provider and hospital tier.',
  },
  insurancePerExtraPerson: {
    id: 'insurancePerExtraPerson', label: 'HMO per additional person', value: 110000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'nhia-scheme',
  },
  dentalPerPerson: {
    id: 'dentalPerPerson', label: 'Dental per person', value: 45000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'internal-model',
  },
  medicationPerPerson: {
    id: 'medicationPerPerson', label: 'Medication allowance per person', value: 60000, unit: '₦ / year',
    kind: 'estimated', sourceId: 'internal-model',
  },
  maternityPublic: {
    id: 'maternityPublic', label: 'Maternity — public hospital, per birth', value: 350000, unit: '₦ / birth',
    kind: 'estimated', sourceId: 'internal-model',
  },
  maternityPrivate: {
    id: 'maternityPrivate', label: 'Maternity — private hospital, per birth', value: 1600000, unit: '₦ / birth',
    kind: 'estimated', sourceId: 'internal-model',
    note: 'A complicated delivery or caesarean section can exceed this substantially.',
  },
  emergencyBufferShare: {
    id: 'emergencyBufferShare', label: 'Medical emergency buffer (share of annual health spend)', value: 0.4,
    unit: 'ratio', kind: 'estimated', sourceId: 'internal-model',
    note: 'Medical costs are among the most volatile household expenses; a buffer is strongly recommended.',
  },
};

/* ------------------------------------------------------------------ */
/* TRANSPORTATION                                                     */
/* ------------------------------------------------------------------ */

export interface TransportOption {
  id: string;
  label: string;
  acquisition: number;      // one-time
  monthlyRunning: number;   // fuel + fares
  annualMaintenance: number;
  annualInsurance: number;
  annualRegistration: number;
  kind: DataKind;
  sourceId: string;
  note?: string;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'public', label: 'Public transport only', acquisition: 0, monthlyRunning: 55000, annualMaintenance: 0, annualInsurance: 0, annualRegistration: 0, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'ride-hailing', label: 'Mostly ride-hailing', acquisition: 0, monthlyRunning: 140000, annualMaintenance: 0, annualInsurance: 0, annualRegistration: 0, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'motorcycle', label: 'Motorcycle / tricycle', acquisition: 1400000, monthlyRunning: 40000, annualMaintenance: 120000, annualInsurance: 30000, annualRegistration: 25000, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'one-car', label: 'One used car', acquisition: 9000000, monthlyRunning: 130000, annualMaintenance: 500000, annualInsurance: 180000, annualRegistration: 90000, kind: 'estimated', sourceId: 'internal-model', note: 'Used-vehicle prices track the exchange rate and import duty closely.' },
  { id: 'one-car-new', label: 'One newer car', acquisition: 28000000, monthlyRunning: 150000, annualMaintenance: 700000, annualInsurance: 500000, annualRegistration: 120000, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'two-cars', label: 'Two cars', acquisition: 18000000, monthlyRunning: 240000, annualMaintenance: 950000, annualInsurance: 350000, annualRegistration: 170000, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'mixed', label: 'Mixed (one car + public transport)', acquisition: 9000000, monthlyRunning: 165000, annualMaintenance: 500000, annualInsurance: 180000, annualRegistration: 90000, kind: 'estimated', sourceId: 'internal-model' },
];

export const transportOption = (id: string): TransportOption =>
  TRANSPORT_OPTIONS.find((t) => t.id === id) ?? TRANSPORT_OPTIONS[0];

/* ------------------------------------------------------------------ */
/* WEDDING — one-time                                                 */
/* ------------------------------------------------------------------ */

export interface WeddingTier {
  id: string;
  label: string;
  total: number;
  guests: string;
  breakdown: { label: string; share: number }[];
  kind: DataKind;
  sourceId: string;
}

const WEDDING_SHARES = [
  { label: 'Traditional ceremony & bride-price obligations', share: 0.24 },
  { label: 'Venue & decoration', share: 0.16 },
  { label: 'Catering & drinks', share: 0.24 },
  { label: 'Clothing & beauty', share: 0.13 },
  { label: 'Photography & video', share: 0.08 },
  { label: 'Transport & logistics', share: 0.06 },
  { label: 'Guest accommodation', share: 0.04 },
  { label: 'Miscellaneous & contingency', share: 0.05 },
];

export const WEDDING_TIERS: WeddingTier[] = [
  { id: 'minimal', label: 'Minimal (court / small ceremony)', total: 900000, guests: 'Under 30 guests', breakdown: WEDDING_SHARES, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'modest', label: 'Modest', total: 3200000, guests: '50–120 guests', breakdown: WEDDING_SHARES, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'moderate', label: 'Moderate', total: 7500000, guests: '150–300 guests', breakdown: WEDDING_SHARES, kind: 'estimated', sourceId: 'internal-model' },
  { id: 'large', label: 'Large', total: 18000000, guests: '400+ guests', breakdown: WEDDING_SHARES, kind: 'estimated', sourceId: 'internal-model' },
];

export const weddingTier = (id: string): WeddingTier | undefined => WEDDING_TIERS.find((w) => w.id === id);

/* ------------------------------------------------------------------ */
/* HOUSEHOLD SETUP — one-time                                         */
/* ------------------------------------------------------------------ */

export const SETUP_ITEMS: CostRecord[] = [
  { id: 'furniture', label: 'Furniture (living, dining, bedroom)', value: 2200000, unit: '₦ one-time', kind: 'estimated', sourceId: 'internal-model' },
  { id: 'appliances', label: 'Appliances (fridge, cooker, washing machine)', value: 1500000, unit: '₦ one-time', kind: 'estimated', sourceId: 'internal-model' },
  { id: 'power', label: 'Power backup (inverter + batteries or generator)', value: 1400000, unit: '₦ one-time', kind: 'estimated', sourceId: 'internal-model' },
  { id: 'kitchen', label: 'Kitchen, bedding & household items', value: 600000, unit: '₦ one-time', kind: 'estimated', sourceId: 'internal-model' },
  { id: 'electronics', label: 'TV, laptop and electronics', value: 900000, unit: '₦ one-time', kind: 'estimated', sourceId: 'internal-model' },
];

export const SETUP_TIER_FACTOR: Record<HousingTierId, number> = {
  basic: 0.45,
  moderate: 1,
  comfortable: 1.8,
  premium: 3.2,
};

/** Convenience: every cost record in the layer, for the transparency page. */
export const ALL_COST_RECORDS: CostRecord[] = [
  ...Object.values(MONTHLY_BASELINES),
  ...Object.values(HOUSING_EXTRAS),
  ...Object.values(HEALTHCARE),
  ...SETUP_ITEMS,
  ADMISSION_ONE_OFF,
];
