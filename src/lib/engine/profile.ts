import { z } from 'zod';
import type { ChildPlan, HouseholdProfile } from './types';
import { DEFAULT_ASSUMPTIONS } from '@/data/assumptions';

/** Validation schema — the same schema is used by the API layer (edge function). */
export const childSchema = z.object({
  id: z.string(),
  currentAge: z.number().min(-10).max(30),
  existing: z.boolean(),
  primaryOptionId: z.string(),
  secondaryOptionId: z.string(),
  tertiaryOptionId: z.string(),
});

export const profileSchema = z.object({
  countryCode: z.string().min(2),
  state: z.string(),
  cityId: z.string(),
  settlement: z.enum(['urban', 'suburban', 'rural']),
  spouses: z.number().min(0).max(10),
  separateHouseholds: z.boolean(),
  children: z.array(childSchema).max(30),
  otherDependents: z.number().min(0).max(20),
  housingStatus: z.enum(['rent', 'own', 'family', 'mortgage']),
  housingTier: z.enum(['basic', 'moderate', 'comfortable', 'premium']),
  bedrooms: z.number().min(1).max(10),
  customAnnualRent: z.number().min(0).max(500_000_000).nullable(),
  propertyPurchasePrice: z.number().min(0).max(5_000_000_000).nullable(),
  mortgageDownPaymentShare: z.number().min(0.05).max(1),
  lifestyle: z.enum(['essential', 'modest', 'comfortable', 'high']),
  domesticHelp: z.boolean(),
  communityObligationsMonthly: z.number().min(0).max(100_000_000),
  lifestyleOverrides: z.record(z.number().min(0).max(100_000_000)),
  healthInsurance: z.enum(['none', 'nhia', 'private']),
  maternityPlan: z.enum(['none', 'public', 'private']),
  plannedBirths: z.number().min(0).max(12),
  transportId: z.string(),
  buyVehicle: z.boolean(),
  weddingTierId: z.string(),
  customWeddingBudget: z.number().min(0).max(1_000_000_000).nullable(),
  includeHouseSetup: z.boolean(),
  monthlyIncome: z.number().min(0).max(1_000_000_000),
  spouseMonthlyIncome: z.number().min(0).max(1_000_000_000),
  otherMonthlyIncome: z.number().min(0).max(1_000_000_000),
  savings: z.number().min(0).max(100_000_000_000),
  investments: z.number().min(0).max(100_000_000_000),
  otherAssets: z.number().min(0).max(100_000_000_000),
  debtTotal: z.number().min(0).max(100_000_000_000),
  monthlyDebtRepayment: z.number().min(0).max(1_000_000_000),
  inflationScenario: z.enum(['low', 'baseline', 'high']),
  customInflationRate: z.number().min(0).max(200).nullable(),
  incomeGrowthRate: z.number().min(0).max(60),
  emergencyFundMonths: z.number().min(1).max(24),
});

export const makeChild = (age = 0, existing = false): ChildPlan => ({
  id: `c-${Math.random().toString(36).slice(2, 9)}`,
  currentAge: age,
  existing,
  primaryOptionId: 'primary-public',
  secondaryOptionId: 'secondary-private',
  tertiaryOptionId: 'tertiary-public',
});

export const DEFAULT_PROFILE: HouseholdProfile = {
  countryCode: 'NG',
  state: 'Enugu',
  cityId: 'enugu',
  settlement: 'urban',
  spouses: 1,
  separateHouseholds: false,
  children: [makeChild(-1), makeChild(-3)],
  otherDependents: 0,
  housingStatus: 'rent',
  housingTier: 'moderate',
  bedrooms: 2,
  customAnnualRent: null,
  propertyPurchasePrice: null,
  mortgageDownPaymentShare: 0.3,
  lifestyle: 'modest',
  domesticHelp: false,
  communityObligationsMonthly: 0,
  lifestyleOverrides: {},
  healthInsurance: 'nhia',
  maternityPlan: 'public',
  plannedBirths: 2,
  transportId: 'public',
  buyVehicle: false,
  weddingTierId: 'modest',
  customWeddingBudget: null,
  includeHouseSetup: true,
  monthlyIncome: 450000,
  spouseMonthlyIncome: 250000,
  otherMonthlyIncome: 0,
  savings: 1500000,
  investments: 0,
  otherAssets: 0,
  debtTotal: 0,
  monthlyDebtRepayment: 0,
  inflationScenario: 'baseline',
  customInflationRate: null,
  incomeGrowthRate: DEFAULT_ASSUMPTIONS.incomeGrowthRate,
  emergencyFundMonths: DEFAULT_ASSUMPTIONS.emergencyFundMonths,
};

/** Sanitises anything (localStorage, API body) into a valid profile. */
export const coerceProfile = (input: unknown): HouseholdProfile => {
  const merged = { ...DEFAULT_PROFILE, ...(typeof input === 'object' && input ? input : {}) } as HouseholdProfile;
  const parsed = profileSchema.safeParse({ ...merged, lifestyleOverrides: merged.lifestyleOverrides ?? {} });
  if (parsed.success) return parsed.data as unknown as HouseholdProfile;

  return DEFAULT_PROFILE;
};

/* ---- Preset comparison scenarios (single source of truth) ---- */
export interface PresetScenario {
  id: string;
  name: string;
  summary: string;
  patch: Partial<HouseholdProfile>;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'a',
    name: 'Scenario A',
    summary: '1 spouse · 2 children · public education · modest lifestyle · Enugu',
    patch: {
      state: 'Enugu', cityId: 'enugu', spouses: 1, lifestyle: 'modest', housingTier: 'moderate', bedrooms: 2,
      transportId: 'public', weddingTierId: 'modest',
      children: [
        { ...makeChild(-1), secondaryOptionId: 'secondary-public', tertiaryOptionId: 'tertiary-public' },
        { ...makeChild(-3), secondaryOptionId: 'secondary-public', tertiaryOptionId: 'tertiary-public' },
      ],
    },
  },
  {
    id: 'b',
    name: 'Scenario B',
    summary: '1 spouse · 3 children · private education · comfortable lifestyle · Lagos Mainland',
    patch: {
      state: 'Lagos', cityId: 'lagos-mainland', spouses: 1, lifestyle: 'comfortable', housingTier: 'comfortable',
      bedrooms: 3, transportId: 'one-car', buyVehicle: true, weddingTierId: 'moderate', healthInsurance: 'private',
      children: [
        { ...makeChild(2), primaryOptionId: 'primary-private', secondaryOptionId: 'secondary-private', tertiaryOptionId: 'tertiary-private' },
        { ...makeChild(-1), primaryOptionId: 'primary-private', secondaryOptionId: 'secondary-private', tertiaryOptionId: 'tertiary-private' },
        { ...makeChild(-4), primaryOptionId: 'primary-private', secondaryOptionId: 'secondary-private', tertiaryOptionId: 'tertiary-private' },
      ],
    },
  },
  {
    id: 'c',
    name: 'Scenario C',
    summary: '2 spouses · 6 children · private education · premium lifestyle · Abuja Central',
    patch: {
      state: 'FCT Abuja', cityId: 'abuja-central', spouses: 2, separateHouseholds: false, lifestyle: 'high',
      housingTier: 'premium', bedrooms: 5, transportId: 'two-cars', buyVehicle: true, weddingTierId: 'large',
      healthInsurance: 'private', domesticHelp: true,
      children: [4, 6, 9, 12, -1, -3].map((age) => ({
        ...makeChild(age),
        primaryOptionId: 'primary-private',
        secondaryOptionId: 'secondary-boarding',
        tertiaryOptionId: 'tertiary-private',
      })),
    },
  },
];
