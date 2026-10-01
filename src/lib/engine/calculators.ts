/**
 * CALCULATION ENGINE — pure functions, no UI, no side effects.
 * Independently testable (see selftest.ts).
 */
import {
  MONTHLY_BASELINES,
  HOUSING_EXTRAS,
  HEALTHCARE,
  SETUP_ITEMS,
  SETUP_TIER_FACTOR,
  ADMISSION_ONE_OFF,
  EDUCATION_STAGES,
  housingTier,
  lifestyleFactor,
  educationOption,
  educationTotal,
  transportOption,
  weddingTier,
} from '@/data/costBaselines';
import { cityById, settlementMultiplier } from '@/data/locations';
import { scenarioById, CATEGORY_INFLATION_WEIGHTS } from '@/data/inflation';
import {
  DEFAULT_ASSUMPTIONS,
  DATASET_VERSION,
  ASSUMPTION_VERSION,
  ENGINE_VERSION,
  type PlanningAssumptions,
} from '@/data/assumptions';
import { nonNegative, clamp, roundPlanning, safe, pct } from './money';
import type {
  CategoryLine,
  HouseholdProfile,
  OneOffLine,
  PlanResult,
  Range,
  ReadinessDimension,
  TimelinePoint,
} from './types';

/* ---------------------------------------------------------------- */
/* context                                                          */
/* ---------------------------------------------------------------- */

export interface CostContext {
  housingMultiplier: number;
  generalMultiplier: number;
  lifestyle: number;
  cityLabel: string;
  adults: number;
  children: number;
  people: number;
  youngChildren: number;
  households: number;
}

export const buildContext = (p: HouseholdProfile): CostContext => {
  const city = cityById(p.cityId);
  const settle = settlementMultiplier(p.settlement);
  const adults = clamp(1 + nonNegative(p.spouses), 1, 12);
  const children = clamp(p.children.length, 0, 30);
  const youngChildren = p.children.filter((c) => c.currentAge < 5).length;
  const dependents = clamp(nonNegative(p.otherDependents), 0, 20);
  return {
    housingMultiplier: (city?.housingMultiplier ?? 1) * settle,
    generalMultiplier: (city?.generalMultiplier ?? 1) * (0.6 + 0.4 * settle),
    lifestyle: lifestyleFactor(p.lifestyle),
    cityLabel: city ? `${city.name}, ${city.state}` : 'Nigeria (unspecified city)',
    adults,
    children,
    youngChildren,
    people: adults + children + dependents,
    households: p.separateHouseholds && p.spouses > 1 ? p.spouses : 1,
  };
};

/** Household economies of scale: cost per head falls as the household grows. */
export const scaleFactor = (people: number): number => {
  const n = clamp(people, 1, 40);
  return Math.pow(n, 0.82) / n; // per-person discount, applied to per-head lines
};

/* ---------------------------------------------------------------- */
/* category calculators                                             */
/* ---------------------------------------------------------------- */

export const calculateHousingCost = (p: HouseholdProfile, ctx: CostContext) => {
  const tier = housingTier(p.housingTier);
  const bedrooms = clamp(nonNegative(p.bedrooms) || 1, 1, 10);
  const baseAnnual =
    p.customAnnualRent !== null && p.customAnnualRent > 0
      ? nonNegative(p.customAnnualRent)
      : tier.annualRentPerBedroom * bedrooms * ctx.housingMultiplier;

  const annualRent = baseAnnual * ctx.households;

  if (p.housingStatus === 'own') {
    return {
      monthly: (annualRent / 12) * HOUSING_EXTRAS.ownerMonthlyMaintenanceShare.value,
      annualRentEquivalent: annualRent,
      moveInOneOff: 0,
      kind: 'derived' as const,
    };
  }
  if (p.housingStatus === 'family') {
    return {
      monthly: (annualRent / 12) * 0.15,
      annualRentEquivalent: annualRent,
      moveInOneOff: 0,
      kind: 'estimated' as const,
    };
  }
  if (p.housingStatus === 'mortgage') {
    const price =
      p.propertyPurchasePrice && p.propertyPurchasePrice > 0
        ? nonNegative(p.propertyPurchasePrice)
        : annualRent * 12;
    const down = clamp(p.mortgageDownPaymentShare, 0.05, 1) * price;
    const principal = Math.max(0, price - down);
    const r = HOUSING_EXTRAS.mortgageRate.value / 12;
    const n = 20 * 12;
    const payment = principal === 0 ? 0 : (principal * r) / (1 - Math.pow(1 + r, -n));
    return {
      monthly: payment + (annualRent / 12) * 0.2,
      annualRentEquivalent: annualRent,
      moveInOneOff: down,
      kind: 'derived' as const,
    };
  }

  const moveIn =
    annualRent * (1 + HOUSING_EXTRAS.agencyAndLegalShare.value + HOUSING_EXTRAS.cautionDepositShare.value) -
    annualRent; // fees + deposit, rent itself sits in monthly
  return {
    monthly: annualRent / 12,
    annualRentEquivalent: annualRent,
    moveInOneOff: moveIn + annualRent, // most Nigerian landlords require a year upfront
    kind: 'estimated' as const,
  };
};

export const calculateFoodCost = (p: HouseholdProfile, ctx: CostContext): number => {
  const perAdult = MONTHLY_BASELINES.foodPerAdult.value;
  const perChild = MONTHLY_BASELINES.foodPerChild.value;
  const gross = perAdult * ctx.adults + perChild * ctx.children;
  return gross * ctx.generalMultiplier * ctx.lifestyle * (0.85 + 0.15 * scaleFactor(ctx.people));
};

export const calculateEducationAnnual = (p: HouseholdProfile, ctx: CostContext) => {
  const details: { label: string; amount: number }[] = [];
  let total = 0;
  p.children.forEach((child, i) => {
    const age = safe(child.currentAge, 0);
    let opt = null as ReturnType<typeof educationOption> | null;
    if (age >= EDUCATION_STAGES.primary.startAge && age <= EDUCATION_STAGES.primary.endAge)
      opt = educationOption(child.primaryOptionId) ?? null;
    else if (age >= EDUCATION_STAGES.secondary.startAge && age <= EDUCATION_STAGES.secondary.endAge)
      opt = educationOption(child.secondaryOptionId) ?? null;
    else if (age >= EDUCATION_STAGES.tertiary.startAge && age <= EDUCATION_STAGES.tertiary.endAge + 2)
      opt = educationOption(child.tertiaryOptionId) ?? null;

    if (!opt) {
      details.push({ label: `Child ${i + 1} — not yet in school`, amount: 0 });
      return;
    }
    const foreign = opt.id === 'tertiary-foreign';
    const amount = educationTotal(opt) * (foreign ? 1 : ctx.generalMultiplier);
    details.push({ label: `Child ${i + 1} — ${opt.label}`, amount });
    total += amount;
  });
  return { total, details };
};

export const calculateHealthcareAnnual = (p: HouseholdProfile, ctx: CostContext) => {
  const routine =
    HEALTHCARE.routineAdult.value * ctx.adults + HEALTHCARE.routineChild.value * ctx.children;
  let insurance = 0;
  if (p.healthInsurance === 'private') {
    insurance =
      HEALTHCARE.insuranceFamilyPlan.value +
      HEALTHCARE.insurancePerExtraPerson.value * Math.max(0, ctx.people - 4);
  } else if (p.healthInsurance === 'nhia') {
    insurance = HEALTHCARE.insuranceFamilyPlan.value * 0.3;
  }
  const dental = HEALTHCARE.dentalPerPerson.value * ctx.people;
  const medication = HEALTHCARE.medicationPerPerson.value * ctx.people;
  const base = (routine + dental + medication) * ctx.generalMultiplier + insurance;
  const buffer = base * HEALTHCARE.emergencyBufferShare.value;
  return { total: base + buffer, base, insurance, buffer };
};

export const calculateTransportation = (p: HouseholdProfile, ctx: CostContext) => {
  const opt = transportOption(p.transportId);
  const monthly =
    (opt.monthlyRunning * ctx.generalMultiplier * (0.8 + 0.08 * ctx.adults) +
      (opt.annualMaintenance + opt.annualInsurance + opt.annualRegistration) / 12) *
    (0.9 + 0.1 * ctx.lifestyle);
  const acquisition = p.buyVehicle ? opt.acquisition : 0;
  return { monthly, acquisition, label: opt.label };
};

export const calculateLifestyleLines = (p: HouseholdProfile, ctx: CostContext): CategoryLine[] => {
  const g = ctx.generalMultiplier;
  const l = ctx.lifestyle;
  const b = MONTHLY_BASELINES;
  const ov = p.lifestyleOverrides || {};
  const val = (key: string, computed: number) =>
    ov[key] !== undefined && ov[key] !== null ? nonNegative(ov[key]) : nonNegative(computed);
  const kindOf = (key: string): CategoryLine['kind'] =>
    ov[key] !== undefined && ov[key] !== null ? 'user' : 'estimated';

  const lines: CategoryLine[] = [
    {
      key: 'utilities',
      label: 'Utilities (power, water, gas)',
      monthly: val('utilities', (b.utilitiesBase.value + b.utilitiesPerPerson.value * ctx.people) * g * (0.85 + 0.15 * l) * ctx.households),
      kind: kindOf('utilities'),
      essential: true,
    },
    {
      key: 'communication',
      label: 'Airtime, data & internet',
      monthly: val('communication', (b.communicationPerAdult.value * ctx.adults + b.internetHousehold.value * ctx.households) * (0.9 + 0.1 * l)),
      kind: kindOf('communication'),
      essential: true,
    },
    {
      key: 'personal',
      label: 'Personal care & clothing',
      monthly: val('personal', b.personalCarePerPerson.value * ctx.people * g * l * scaleFactor(ctx.people) * 1.1),
      kind: kindOf('personal'),
      essential: true,
    },
    {
      key: 'household',
      label: 'Household consumables & upkeep',
      monthly: val('household', b.householdRunning.value * g * l * ctx.households),
      kind: kindOf('household'),
      essential: true,
    },
    {
      key: 'entertainment',
      label: 'Entertainment, social & travel',
      monthly: val('entertainment', b.entertainmentPerAdult.value * ctx.adults * g * l),
      kind: kindOf('entertainment'),
      essential: false,
    },
  ];

  if (ctx.youngChildren > 0) {
    lines.push({
      key: 'childcare',
      label: 'Childcare (children under 5)',
      monthly: val('childcare', b.childcarePerYoungChild.value * ctx.youngChildren * g),
      kind: kindOf('childcare'),
      essential: true,
    });
  }
  if (p.domesticHelp) {
    lines.push({
      key: 'domestic',
      label: 'Domestic help',
      monthly: val('domestic', b.domesticHelp.value * g * ctx.households),
      kind: kindOf('domestic'),
      essential: false,
    });
  }
  if (nonNegative(p.communityObligationsMonthly) > 0) {
    lines.push({
      key: 'community',
      label: 'Religious / community obligations',
      monthly: nonNegative(p.communityObligationsMonthly),
      kind: 'user',
      essential: false,
    });
  }
  return lines;
};

export const calculateEmergencyFund = (
  essentialMonthly: number,
  months: number,
): number => nonNegative(essentialMonthly) * clamp(months, 1, 24);

export const calculateFutureCost = (
  current: number,
  annualRatePercent: number,
  years: number,
): number => nonNegative(current) * Math.pow(1 + clamp(annualRatePercent, -20, 200) / 100, clamp(years, 0, 60));

export const blendedInflation = (p: HouseholdProfile, lines: CategoryLine[]): number => {
  const headline =
    p.customInflationRate !== null && p.customInflationRate !== undefined
      ? clamp(p.customInflationRate, 0, 100)
      : scenarioById(p.inflationScenario).rate;
  const total = lines.reduce((s, l) => s + l.monthly, 0);
  if (total <= 0) return headline;
  const weighted = lines.reduce((s, l) => {
    const w = CATEGORY_INFLATION_WEIGHTS[l.key] ?? 1;
    return s + l.monthly * w;
  }, 0);
  return headline * (weighted / total);
};

const range = (point: number, a: PlanningAssumptions): Range => ({
  low: roundPlanning(point * a.uncertaintyBandLow),
  point: roundPlanning(point),
  high: roundPlanning(point * a.uncertaintyBandHigh),
});

/* ---------------------------------------------------------------- */
/* readiness score                                                  */
/* ---------------------------------------------------------------- */

export const calculateReadinessScore = (args: {
  income: number;
  monthlyRequirement: number;
  essentialMonthly: number;
  savingsLiquid: number;
  emergencyTarget: number;
  monthlyDebt: number;
  debtTotal: number;
  housingMonthly: number;
  initialTarget: number;
  hasEducationPlan: boolean;
  hasHealthCover: boolean;
  assumptions: PlanningAssumptions;
}): { score: number; band: PlanResult['readiness']['band']; dimensions: ReadinessDimension[] } => {
  const a = args.assumptions;
  const surplus = args.income - args.monthlyRequirement - args.monthlyDebt;

  const dims: ReadinessDimension[] = [
    {
      key: 'coverage',
      label: 'Income covers projected household cost',
      weight: 0.26,
      score: clamp(args.monthlyRequirement <= 0 ? 100 : (args.income / (args.monthlyRequirement + args.monthlyDebt)) * 80, 0, 100),
      explanation:
        args.monthlyRequirement <= 0
          ? 'No monthly requirement was calculated.'
          : `Household income is ${pct(args.income, args.monthlyRequirement + args.monthlyDebt).toFixed(0)}% of the modelled monthly requirement including debt service. 125% or more scores full marks, because a surplus is what funds savings.`,
    },
    {
      key: 'emergency',
      label: 'Emergency reserve',
      weight: 0.18,
      score: clamp(args.emergencyTarget <= 0 ? 100 : (args.savingsLiquid / args.emergencyTarget) * 100, 0, 100),
      explanation: `Liquid savings cover ${
        args.emergencyTarget > 0 ? (args.savingsLiquid / args.emergencyTarget).toFixed(2) : '0'
      }× of the recommended ${a.emergencyFundMonths}-month reserve.`,
    },
    {
      key: 'surplus',
      label: 'Monthly surplus & savings rate',
      weight: 0.16,
      score: clamp(args.income <= 0 ? 0 : (surplus / args.income / a.targetSavingsRate) * 100, 0, 100),
      explanation:
        args.income <= 0
          ? 'No income was entered, so no savings rate could be computed.'
          : `Surplus after essentials and debt is ${pct(surplus, args.income).toFixed(0)}% of income against a ${(
              a.targetSavingsRate * 100
            ).toFixed(0)}% benchmark.`,
    },
    {
      key: 'debt',
      label: 'Debt burden',
      weight: 0.14,
      score:
        args.income <= 0
          ? 50
          : clamp(100 - (args.monthlyDebt / args.income / a.sustainableDebtShare) * 100, 0, 100),
      explanation:
        args.income <= 0
          ? 'Cannot assess debt burden without income.'
          : `Debt service is ${pct(args.monthlyDebt, args.income).toFixed(0)}% of income; the modelled ceiling is ${(
              a.sustainableDebtShare * 100
            ).toFixed(0)}%.`,
    },
    {
      key: 'housing',
      label: 'Housing burden',
      weight: 0.12,
      score:
        args.income <= 0
          ? 40
          : clamp(100 - ((args.housingMonthly / args.income - a.sustainableHousingShare) / a.sustainableHousingShare) * 100, 0, 100),
      explanation:
        args.income <= 0
          ? 'Cannot assess housing burden without income.'
          : `Housing is ${pct(args.housingMonthly, args.income).toFixed(0)}% of income; staying at or below ${(
              a.sustainableHousingShare * 100
            ).toFixed(0)}% scores full marks.`,
    },
    {
      key: 'initial',
      label: 'One-time readiness target progress',
      weight: 0.08,
      score: clamp(args.initialTarget <= 0 ? 100 : (args.savingsLiquid / args.initialTarget) * 100, 0, 100),
      explanation: `Savings cover ${
        args.initialTarget > 0 ? pct(args.savingsLiquid, args.initialTarget).toFixed(0) : '100'
      }% of the modelled one-time preparation target.`,
    },
    {
      key: 'planning',
      label: 'Education & healthcare planning',
      weight: 0.06,
      score: (args.hasEducationPlan ? 55 : 20) + (args.hasHealthCover ? 45 : 10),
      explanation: `${args.hasEducationPlan ? 'An education path is budgeted.' : 'No education budget is modelled yet.'} ${
        args.hasHealthCover ? 'Health cover is included.' : 'No health insurance is included, which raises exposure to medical shocks.'
      }`,
    },
  ];

  const score = clamp(
    dims.reduce((s, d) => s + d.score * d.weight, 0),
    0,
    100,
  );
  const band: PlanResult['readiness']['band'] =
    score >= 78 ? 'strong' : score >= 58 ? 'reasonable' : score >= 38 ? 'improve' : 'gap';
  return { score, band, dimensions: dims };
};

/* ---------------------------------------------------------------- */
/* long-term projection                                             */
/* ---------------------------------------------------------------- */

const educationForAge = (child: HouseholdProfile['children'][number], age: number) => {
  if (age >= EDUCATION_STAGES.primary.startAge && age <= EDUCATION_STAGES.primary.endAge)
    return { opt: educationOption(child.primaryOptionId), stage: 'primary' as const };
  if (age >= EDUCATION_STAGES.secondary.startAge && age <= EDUCATION_STAGES.secondary.endAge)
    return { opt: educationOption(child.secondaryOptionId), stage: 'secondary' as const };
  if (age >= EDUCATION_STAGES.tertiary.startAge && age <= EDUCATION_STAGES.tertiary.endAge)
    return { opt: educationOption(child.tertiaryOptionId), stage: 'tertiary' as const };
  return { opt: undefined, stage: undefined };
};

export const buildProjection = (
  p: HouseholdProfile,
  ctx: CostContext,
  nonEducationMonthly: number,
  inflation: number,
  years: number,
) => {
  const currentYear = new Date().getFullYear();
  const timeline: TimelinePoint[] = [];
  const growth = clamp(p.incomeGrowthRate, 0, 60);
  const householdIncome =
    nonNegative(p.monthlyIncome) + nonNegative(p.spouseMonthlyIncome) + nonNegative(p.otherMonthlyIncome);

  for (let i = 0; i < years; i++) {
    const events: string[] = [];
    let educationTodaysMoney = 0;

    p.children.forEach((child, idx) => {
      const age = safe(child.currentAge, 0) + i;
      const { opt, stage } = educationForAge(child, age);
      if (opt) {
        const foreign = opt.id === 'tertiary-foreign';
        educationTodaysMoney += educationTotal(opt) * (foreign ? 1 : ctx.generalMultiplier);
        const startAge =
          stage === 'primary'
            ? EDUCATION_STAGES.primary.startAge
            : stage === 'secondary'
            ? EDUCATION_STAGES.secondary.startAge
            : EDUCATION_STAGES.tertiary.startAge;
        if (age === startAge) events.push(`Child ${idx + 1} starts ${stage}`);
      }
      if (age === 0) events.push(`Child ${idx + 1} born`);
    });

    const todaysMoney = nonEducationMonthly * 12 + educationTodaysMoney;
    const nominal = calculateFutureCost(todaysMoney, inflation, i);
    const income = householdIncome * 12 * Math.pow(1 + growth / 100, i);
    timeline.push({
      year: currentYear + i,
      yearIndex: i,
      todaysMoney: roundPlanning(todaysMoney),
      nominal: roundPlanning(nominal),
      income: roundPlanning(income),
      events,
    });
  }
  const cum = (n: number) => timeline.slice(0, n).reduce((s, t) => s + t.nominal, 0);
  return { timeline, total5: cum(5), total10: cum(10), total18: cum(Math.min(years, 18)) };
};

/* ---------------------------------------------------------------- */
/* master entry point                                               */
/* ---------------------------------------------------------------- */

export const calculatePlan = (
  profile: HouseholdProfile,
  overrides?: Partial<PlanningAssumptions>,
): PlanResult => {
  const a: PlanningAssumptions = {
    ...DEFAULT_ASSUMPTIONS,
    ...overrides,
    emergencyFundMonths: clamp(profile.emergencyFundMonths || DEFAULT_ASSUMPTIONS.emergencyFundMonths, 1, 24),
  };
  const ctx = buildContext(profile);
  const warnings: string[] = [];

  /* ---- monthly lines ---- */
  const housing = calculateHousingCost(profile, ctx);
  const food = calculateFoodCost(profile, ctx);
  const education = calculateEducationAnnual(profile, ctx);
  const healthcare = calculateHealthcareAnnual(profile, ctx);
  const transport = calculateTransportation(profile, ctx);

  const lines: CategoryLine[] = [
    {
      key: 'housing',
      label:
        profile.housingStatus === 'own'
          ? 'Housing (maintenance, levies, service charge)'
          : profile.housingStatus === 'mortgage'
          ? 'Housing (mortgage + upkeep)'
          : 'Housing (rent)',
      monthly: nonNegative(housing.monthly),
      kind: profile.customAnnualRent ? 'user' : housing.kind,
      essential: true,
    },
    { key: 'food', label: 'Food & groceries', monthly: nonNegative(food), kind: 'estimated', essential: true },
    {
      key: 'education',
      label: 'Education (current school year)',
      monthly: nonNegative(education.total / 12),
      kind: 'estimated',
      essential: true,
      detail: education.details.map((d) => ({ label: d.label, amount: d.amount })),
    },
    {
      key: 'healthcare',
      label: 'Healthcare (incl. emergency buffer)',
      monthly: nonNegative(healthcare.total / 12),
      kind: 'estimated',
      essential: true,
      detail: [
        { label: 'Routine, dental & medication', amount: healthcare.base - healthcare.insurance },
        { label: 'Insurance / HMO', amount: healthcare.insurance },
        { label: 'Emergency buffer', amount: healthcare.buffer },
      ],
    },
    {
      key: 'transportation',
      label: `Transportation — ${transport.label}`,
      monthly: nonNegative(transport.monthly),
      kind: 'estimated',
      essential: true,
    },
    ...calculateLifestyleLines(profile, ctx),
  ];

  const total = lines.reduce((s, l) => s + l.monthly, 0);
  const essentialTotal = lines.filter((l) => l.essential).reduce((s, l) => s + l.monthly, 0);

  /* ---- one-time ---- */
  const wedding =
    profile.customWeddingBudget !== null && profile.customWeddingBudget >= 0
      ? nonNegative(profile.customWeddingBudget)
      : nonNegative(weddingTier(profile.weddingTierId)?.total ?? 0) * ctx.generalMultiplier;

  const setupTotal = profile.includeHouseSetup
    ? SETUP_ITEMS.reduce((s, i) => s + i.value, 0) *
      SETUP_TIER_FACTOR[profile.housingTier] *
      ctx.generalMultiplier *
      ctx.households
    : 0;

  const maternity =
    profile.maternityPlan === 'none'
      ? 0
      : (profile.maternityPlan === 'private' ? HEALTHCARE.maternityPrivate.value : HEALTHCARE.maternityPublic.value) *
        clamp(nonNegative(profile.plannedBirths), 0, 12) *
        ctx.generalMultiplier;

  const admissionOneOff =
    education.total > 0 ? education.total * ADMISSION_ONE_OFF.value : 0;

  const emergencyFundPoint = calculateEmergencyFund(essentialTotal, a.emergencyFundMonths);

  const oneOffLines: OneOffLine[] = [
    { key: 'wedding', label: 'Wedding & marriage ceremonies', amount: roundPlanning(wedding), note: 'A large wedding is not a prerequisite for a financially healthy marriage.' },
    {
      key: 'housing-move',
      label:
        profile.housingStatus === 'mortgage'
          ? 'Property down payment'
          : profile.housingStatus === 'rent'
          ? 'Move-in cash: first-year rent upfront + agency, legal and caution fees'
          : 'Housing move-in costs',
      amount: roundPlanning(housing.moveInOneOff),
      note:
        profile.housingStatus === 'rent'
          ? 'Nigerian landlords typically require a year upfront, so the first year of rent is cash you need before moving in. Rent also appears in the monthly figure as an accrual — count it once when planning, not twice.'
          : undefined,
    },

    { key: 'setup', label: 'Household setup (furniture, appliances, power backup)', amount: roundPlanning(setupTotal) },
    { key: 'vehicle', label: 'Vehicle acquisition', amount: roundPlanning(transport.acquisition) },
    { key: 'maternity', label: 'Maternity & delivery reserve', amount: roundPlanning(maternity) },
    { key: 'admission', label: 'School admission / acceptance costs', amount: roundPlanning(admissionOneOff) },
    { key: 'emergency', label: `Emergency reserve (${a.emergencyFundMonths} months of essentials)`, amount: roundPlanning(emergencyFundPoint) },
  ].filter((l) => l.amount > 0);

  const oneOffTotal = oneOffLines.reduce((s, l) => s + l.amount, 0);

  /* ---- income position ---- */
  const householdIncome =
    nonNegative(profile.monthlyIncome) + nonNegative(profile.spouseMonthlyIncome) + nonNegative(profile.otherMonthlyIncome);
  const monthlyDebt = nonNegative(profile.monthlyDebtRepayment);
  const surplus = householdIncome - total - monthlyDebt;
  const liquid = nonNegative(profile.savings) + nonNegative(profile.investments) * 0.6;

  const inflation = blendedInflation(profile, lines);
  const projection = buildProjection(profile, ctx, total, inflation, a.projectionYears);

  const requiredIncomePoint = (total + monthlyDebt) / (1 - a.targetSavingsRate);

  const readiness = calculateReadinessScore({
    income: householdIncome,
    monthlyRequirement: total,
    essentialMonthly: essentialTotal,
    savingsLiquid: liquid,
    emergencyTarget: emergencyFundPoint,
    monthlyDebt,
    debtTotal: nonNegative(profile.debtTotal),
    housingMonthly: housing.monthly,
    initialTarget: oneOffTotal,
    hasEducationPlan: education.total > 0 || profile.children.length === 0,
    hasHealthCover: profile.healthInsurance !== 'none',
    assumptions: a,
  });

  const drivers = lines
    .map((l) => ({ label: l.label, monthly: roundPlanning(l.monthly), share: pct(l.monthly, total) }))
    .sort((x, y) => y.monthly - x.monthly)
    .slice(0, 5);

  if (householdIncome === 0) warnings.push('No income was entered, so the gap analysis and readiness score are limited to the cost side of the model.');
  if (profile.customAnnualRent === null && housing.monthly > 0)
    warnings.push('Housing uses a modelled rent band for your city, not a live listing feed. Entering your actual rent materially improves accuracy.');
  if (profile.children.some((c) => educationOption(c.tertiaryOptionId)?.id === 'tertiary-foreign'))
    warnings.push('Foreign tuition is highly exchange-rate sensitive. Treat that figure as an order of magnitude, not a quote.');
  if (ctx.people > 10) warnings.push('Very large households sit outside the range where per-head scaling assumptions were calibrated; treat results as indicative.');
  if (monthlyDebt > householdIncome * 0.5 && householdIncome > 0)
    warnings.push('Debt service above half of income dominates every other result in this model.');

  const yearsToTarget =
    surplus > 0 ? Math.max(0, (oneOffTotal - liquid) / (surplus * 12)) : null;

  return {
    monthly: { lines, total: roundPlanning(total), essentialTotal: roundPlanning(essentialTotal), range: range(total, a) },
    annual: { total: roundPlanning(total * 12), range: range(total * 12, a) },
    oneOff: { lines: oneOffLines, total: roundPlanning(oneOffTotal), range: range(oneOffTotal, a) },
    emergencyFund: range(emergencyFundPoint, a),
    initialReadiness: range(oneOffTotal, a),
    requiredIncome: range(requiredIncomePoint, a),
    income: {
      household: roundPlanning(householdIncome),
      surplus: Math.round(surplus),
      savingsRate: householdIncome > 0 ? pct(surplus, householdIncome) : 0,
      debtServiceRatio: householdIncome > 0 ? pct(monthlyDebt, householdIncome) : 0,
      housingRatio: householdIncome > 0 ? pct(housing.monthly, householdIncome) : 0,
      monthlyGap: Math.round(Math.max(0, total + monthlyDebt - householdIncome)),
      monthsOfRunway: total > 0 ? clamp(liquid / total, 0, 600) : 0,
      yearsToInitialTarget: yearsToTarget === null ? null : clamp(yearsToTarget, 0, 200),
    },
    projection: {
      timeline: projection.timeline,
      total5Year: range(projection.total5, a),
      total10Year: range(projection.total10, a),
      total18Year: range(projection.total18, a),
      inflationRate: inflation,
    },
    readiness,
    drivers,
    warnings,
    meta: {
      datasetVersion: DATASET_VERSION,
      assumptionVersion: ASSUMPTION_VERSION,
      engineVersion: ENGINE_VERSION,
      calculatedAt: new Date().toISOString(),
      inflationScenario:
        profile.customInflationRate !== null && profile.customInflationRate !== undefined
          ? `custom ${profile.customInflationRate}%`
          : scenarioById(profile.inflationScenario).label,
      assumptions: a,
      cityLabel: ctx.cityLabel,
      householdSize: ctx.people,
    },
  };
};
