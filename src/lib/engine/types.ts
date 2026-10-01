import type { HousingTierId, LifestyleId } from '@/data/costBaselines';
import type { SettlementId } from '@/data/locations';
import type { PlanningAssumptions } from '@/data/assumptions';

export interface ChildPlan {
  id: string;
  /** Current age; a planned (unborn) child has a negative "age" = years until birth. */
  currentAge: number;
  existing: boolean;
  primaryOptionId: string;
  secondaryOptionId: string;
  tertiaryOptionId: string;
}

export interface HouseholdProfile {
  /* location */
  countryCode: string;
  state: string;
  cityId: string;
  settlement: SettlementId;

  /* family structure */
  spouses: number;
  separateHouseholds: boolean;
  children: ChildPlan[];
  otherDependents: number;

  /* housing */
  housingStatus: 'rent' | 'own' | 'family' | 'mortgage';
  housingTier: HousingTierId;
  bedrooms: number;
  customAnnualRent: number | null;
  propertyPurchasePrice: number | null;
  mortgageDownPaymentShare: number;

  /* lifestyle */
  lifestyle: LifestyleId;
  domesticHelp: boolean;
  communityObligationsMonthly: number;
  lifestyleOverrides: Partial<Record<string, number>>;

  /* healthcare */
  healthInsurance: 'none' | 'nhia' | 'private';
  maternityPlan: 'none' | 'public' | 'private';
  plannedBirths: number;

  /* transport */
  transportId: string;
  buyVehicle: boolean;

  /* wedding */
  weddingTierId: string;
  customWeddingBudget: number | null;
  includeHouseSetup: boolean;

  /* financial position */
  monthlyIncome: number;
  spouseMonthlyIncome: number;
  otherMonthlyIncome: number;
  savings: number;
  investments: number;
  otherAssets: number;
  debtTotal: number;
  monthlyDebtRepayment: number;

  /* assumptions */
  inflationScenario: 'low' | 'baseline' | 'high';
  customInflationRate: number | null;
  incomeGrowthRate: number;
  emergencyFundMonths: number;
}

export interface CategoryLine {
  key: string;
  label: string;
  monthly: number;
  /** dominant provenance of this line */
  kind: 'verified' | 'derived' | 'estimated' | 'user';
  essential: boolean;
  detail?: { label: string; amount: number }[];
}

export interface OneOffLine {
  key: string;
  label: string;
  amount: number;
  note?: string;
}

export interface Range {
  low: number;
  point: number;
  high: number;
}

export interface ReadinessDimension {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  explanation: string;
}

export interface TimelinePoint {
  year: number;
  yearIndex: number;
  todaysMoney: number;
  nominal: number;
  income: number;
  events: string[];
}

export interface PlanResult {
  monthly: {
    lines: CategoryLine[];
    total: number;
    essentialTotal: number;
    range: Range;
  };
  annual: { total: number; range: Range };
  oneOff: { lines: OneOffLine[]; total: number; range: Range };
  emergencyFund: Range;
  initialReadiness: Range;
  requiredIncome: Range;
  income: {
    household: number;
    surplus: number;
    savingsRate: number;
    debtServiceRatio: number;
    housingRatio: number;
    monthlyGap: number;
    monthsOfRunway: number;
    yearsToInitialTarget: number | null;
  };
  projection: {
    timeline: TimelinePoint[];
    total18Year: Range;
    total5Year: Range;
    total10Year: Range;
    inflationRate: number;
  };
  readiness: {
    score: number;
    band: 'strong' | 'reasonable' | 'improve' | 'gap';
    dimensions: ReadinessDimension[];
  };
  drivers: { label: string; monthly: number; share: number }[];
  warnings: string[];
  meta: {
    datasetVersion: string;
    assumptionVersion: string;
    engineVersion: string;
    calculatedAt: string;
    inflationScenario: string;
    assumptions: PlanningAssumptions;
    cityLabel: string;
    householdSize: number;
  };
}
