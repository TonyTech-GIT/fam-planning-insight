/**
 * VERSIONED ASSUMPTION SET
 *
 * Every calculation stamps the versions below into its result, so a plan
 * produced today remains reproducible and explainable after datasets change.
 */
export const DATASET_VERSION = 'ng-dataset-2026.09';
export const ASSUMPTION_VERSION = 'assumptions-v1.2';
export const ENGINE_VERSION = 'engine-1.0.0';

export interface PlanningAssumptions {
  emergencyFundMonths: number;
  /** Share of the monthly budget treated as "essential" for the emergency fund. */
  essentialShareFallback: number;
  /** Assumed annual nominal income growth, percent. */
  incomeGrowthRate: number;
  /** Uncertainty band applied to point estimates when presenting ranges. */
  uncertaintyBandLow: number;
  uncertaintyBandHigh: number;
  /** Share of gross income considered a sustainable housing burden. */
  sustainableHousingShare: number;
  /** Share of gross income considered a sustainable debt-service burden. */
  sustainableDebtShare: number;
  /** Target savings rate used in the readiness score. */
  targetSavingsRate: number;
  /** Years of projection in the long-term model. */
  projectionYears: number;
}

export const DEFAULT_ASSUMPTIONS: PlanningAssumptions = {
  emergencyFundMonths: 6,
  essentialShareFallback: 0.78,
  incomeGrowthRate: 10,
  uncertaintyBandLow: 0.88,
  uncertaintyBandHigh: 1.18,
  sustainableHousingShare: 0.3,
  sustainableDebtShare: 0.36,
  targetSavingsRate: 0.2,
  projectionYears: 18,
};

export const ASSUMPTION_NOTES: { key: keyof PlanningAssumptions; label: string; rationale: string }[] = [
  {
    key: 'emergencyFundMonths',
    label: 'Emergency fund = 6 months of essential expenses',
    rationale:
      'Widely used personal-finance guidance is 3–6 months. In an economy with volatile prices and irregular income, the upper end of that range is the more resilient default. You can change it.',
  },
  {
    key: 'incomeGrowthRate',
    label: 'Nominal income growth = 10% per year',
    rationale:
      'Deliberately set below assumed baseline inflation, because nominal salary growth in Nigeria has frequently lagged headline CPI. Raising this assumption makes the plan look easier — treat it carefully.',
  },
  {
    key: 'sustainableHousingShare',
    label: 'Housing should stay under ~30% of gross income',
    rationale:
      'A conventional affordability threshold. Above it, housing crowds out savings and education funding.',
  },
  {
    key: 'sustainableDebtShare',
    label: 'Total debt service under ~36% of gross income',
    rationale: 'A widely used debt-to-income ceiling in lending practice.',
  },
  {
    key: 'targetSavingsRate',
    label: 'Target savings rate = 20% of income',
    rationale: 'Used only as a scoring benchmark, not as a prescription.',
  },
  {
    key: 'uncertaintyBandLow',
    label: 'Results presented as a −12% / +18% range',
    rationale:
      'The band is asymmetric on purpose: household costs surprise upward more often than downward, particularly medical, school and transport costs.',
  },
];

/** Income growth scenarios offered in the salary-growth simulator. */
export const INCOME_GROWTH_SCENARIOS = [0, 5, 10, 15, 20];
