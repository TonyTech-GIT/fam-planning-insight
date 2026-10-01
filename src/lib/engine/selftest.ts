/**
 * ENGINE SELF-TESTS
 *
 * The calculation engine is pure, so it can be exercised without a browser or
 * a DOM. These assertions run on demand from the transparency page ("Run
 * engine tests"), and cover the edge cases that matter for a financial model:
 * zero income, zero children, very large families, invalid/negative inputs,
 * extreme inflation, missing datasets and range monotonicity.
 *
 * Nothing here may produce NaN or Infinity.
 */
import { calculatePlan, calculateFutureCost, calculateEmergencyFund, buildContext } from './calculators';
import { DEFAULT_PROFILE, coerceProfile, makeChild } from './profile';
import type { HouseholdProfile, PlanResult } from './types';

export interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const finiteDeep = (value: unknown, path = 'root'): string | null => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return `${path} = ${value}`;
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const r = finiteDeep(value[i], `${path}[${i}]`);
      if (r) return r;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const r = finiteDeep(v, `${path}.${k}`);
      if (r) return r;
    }
  }
  return null;
};

const p = (patch: Partial<HouseholdProfile>): HouseholdProfile => ({ ...DEFAULT_PROFILE, ...patch });

const check = (name: string, fn: () => string | true): TestResult => {
  try {
    const r = fn();
    return { name, passed: r === true, detail: r === true ? 'ok' : r };
  } catch (e) {
    return { name, passed: false, detail: `threw: ${(e as Error).message}` };
  }
};

const noBadNumbers = (label: string, result: PlanResult): string | true => {
  const bad = finiteDeep(result);
  return bad ? `${label}: non-finite value at ${bad}` : true;
};

export const runEngineTests = (): TestResult[] => [
  check('baseline profile produces only finite numbers', () =>
    noBadNumbers('baseline', calculatePlan(DEFAULT_PROFILE)),
  ),
  check('zero children is supported', () => {
    const r = calculatePlan(p({ children: [] }));
    const edu = r.monthly.lines.find((l) => l.key === 'education');
    if (edu && edu.monthly !== 0) return 'education cost should be zero with no children';
    return noBadNumbers('zero children', r);
  }),
  check('zero income does not divide by zero', () => {
    const r = calculatePlan(p({ monthlyIncome: 0, spouseMonthlyIncome: 0, otherMonthlyIncome: 0 }));
    if (r.income.savingsRate !== 0) return 'savings rate should be 0 with no income';
    if (r.readiness.score < 0 || r.readiness.score > 100) return 'score out of bounds';
    return noBadNumbers('zero income', r);
  }),
  check('very large family stays finite and increases cost', () => {
    const small = calculatePlan(p({ children: [makeChild(3)] }));
    const large = calculatePlan(p({ spouses: 3, children: Array.from({ length: 12 }, (_, i) => makeChild(i)) }));
    if (large.monthly.total <= small.monthly.total) return 'larger family should not cost less';
    return noBadNumbers('large family', large);
  }),
  check('negative and invalid inputs are coerced, not propagated', () => {
    const coerced = coerceProfile({ monthlyIncome: -5000, bedrooms: -3, spouses: 99, children: 'oops' });
    const r = calculatePlan(coerced);
    if (r.monthly.total <= 0) return 'coerced profile produced no cost';
    return noBadNumbers('coerced', r);
  }),
  check('extreme inflation is clamped and monotonic', () => {
    const low = calculatePlan(p({ inflationScenario: 'low' }));
    const high = calculatePlan(p({ inflationScenario: 'high' }));
    if (high.projection.total18Year.point <= low.projection.total18Year.point)
      return 'high inflation must project a larger 18-year total';
    const extreme = calculatePlan(p({ customInflationRate: 500 }));
    return noBadNumbers('extreme inflation', extreme);
  }),
  check('missing / unknown city falls back safely', () => {
    const r = calculatePlan(p({ cityId: 'does-not-exist', state: 'Nowhere' }));
    if (r.monthly.total <= 0) return 'fallback produced no cost';
    if (!r.meta.cityLabel) return 'no city label';
    return noBadNumbers('missing city', r);
  }),
  check('unknown education option does not break the projection', () => {
    const r = calculatePlan(
      p({ children: [{ ...makeChild(8), secondaryOptionId: 'nope', tertiaryOptionId: 'nope' }] }),
    );
    return noBadNumbers('unknown education', r);
  }),
  check('multiple spouses with separate households costs more', () => {
    const shared = calculatePlan(p({ spouses: 2, separateHouseholds: false }));
    const separate = calculatePlan(p({ spouses: 2, separateHouseholds: true }));
    return separate.monthly.total > shared.monthly.total
      ? true
      : 'separate households should raise housing/utilities cost';
  }),
  check('ranges are ordered low <= point <= high', () => {
    const r = calculatePlan(DEFAULT_PROFILE);
    const ranges = [r.monthly.range, r.annual.range, r.oneOff.range, r.emergencyFund, r.requiredIncome, r.projection.total18Year];
    for (const rg of ranges) {
      if (!(rg.low <= rg.point && rg.point <= rg.high)) return `range out of order: ${JSON.stringify(rg)}`;
    }
    return true;
  }),
  check('emergency fund equals months × essentials', () => {
    const v = calculateEmergencyFund(100_000, 6);
    return v === 600_000 ? true : `expected 600000, got ${v}`;
  }),
  check('future cost compounding is correct', () => {
    const v = calculateFutureCost(1_000_000, 20, 3);
    const expected = 1_000_000 * 1.2 ** 3;
    return Math.abs(v - expected) < 1 ? true : `expected ${expected}, got ${v}`;
  }),
  check('projection timeline length matches assumption horizon', () => {
    const r = calculatePlan(DEFAULT_PROFILE);
    return r.projection.timeline.length === r.meta.assumptions.projectionYears
      ? true
      : `expected ${r.meta.assumptions.projectionYears} rows, got ${r.projection.timeline.length}`;
  }),
  check('cost drivers sum to a sensible share of the monthly total', () => {
    const r = calculatePlan(DEFAULT_PROFILE);
    const sum = r.drivers.reduce((s, d) => s + d.share, 0);
    return sum > 40 && sum <= 100.5 ? true : `driver shares summed to ${sum.toFixed(1)}%`;
  }),
  check('household context scales with people', () => {
    const ctx = buildContext(p({ spouses: 1, children: [makeChild(2), makeChild(4)], otherDependents: 1 }));
    return ctx.people === 5 ? true : `expected 5 people, got ${ctx.people}`;
  }),
  check('every calculation stamps dataset/assumption/engine versions', () => {
    const m = calculatePlan(DEFAULT_PROFILE).meta;
    return m.datasetVersion && m.assumptionVersion && m.engineVersion && m.calculatedAt
      ? true
      : 'missing version stamp';
  }),
];

export const testSummary = (results: TestResult[]) => ({
  total: results.length,
  passed: results.filter((r) => r.passed).length,
  failed: results.filter((r) => !r.passed).length,
});
