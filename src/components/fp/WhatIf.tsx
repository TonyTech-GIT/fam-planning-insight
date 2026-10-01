import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Card, Slider, OptionGrid, Toggle, cx, Callout } from './ui';
import { calculatePlan } from '@/lib/engine/calculators';
import { formatCompact, formatNaira } from '@/lib/engine/money';
import { LIFESTYLE_TIERS, HOUSING_TIERS, TRANSPORT_OPTIONS } from '@/data/costBaselines';
import { INFLATION_SCENARIOS } from '@/data/inflation';
import { CITIES, RELOCATION_SHORTLIST } from '@/data/locations';
import { makeChild } from '@/lib/engine/profile';
import type { HouseholdProfile } from '@/lib/engine/types';
import type { ViewId } from './Chrome';

const Delta: React.FC<{ base: number; now: number; invert?: boolean }> = ({ base, now, invert }) => {
  const diff = now - base;
  if (Math.abs(diff) < 1) return <span className="text-xs text-slate-400">no change</span>;
  const good = invert ? diff > 0 : diff < 0;
  return (
    <span className={cx('font-mono text-xs font-medium', good ? 'text-emerald-700' : 'text-rose-600')}>
      {diff > 0 ? '+' : '−'}
      {formatCompact(Math.abs(diff))}
    </span>
  );
};

export const WhatIf: React.FC<{
  profile: HouseholdProfile;
  onApply: (p: HouseholdProfile) => void;
  onNavigate: (v: ViewId) => void;
}> = ({ profile, onApply, onNavigate }) => {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);
  const patch = (p: Partial<HouseholdProfile>) => setDraft((d) => ({ ...d, ...p }));

  const baseResult = useMemo(() => calculatePlan(profile), [profile]);
  const result = useMemo(() => calculatePlan(draft), [draft]);

  const relocation = useMemo(
    () =>
      RELOCATION_SHORTLIST.map((id) => {
        const city = CITIES.find((c) => c.id === id)!;
        const r = calculatePlan({ ...draft, cityId: city.id, state: city.state });
        return { city, monthly: r.monthly.total, oneOff: r.oneOff.total };
      }).sort((a, b) => a.monthly - b.monthly),
    [draft],
  );

  const incomeScenarios = [0, 5, 10, 15, 20].map((g) => {
    const r = calculatePlan({ ...draft, incomeGrowthRate: g });
    const y10 = r.projection.timeline[9];
    return { growth: g, income: y10?.income ?? 0, cost: y10?.nominal ?? 0 };
  });

  const rows: { label: string; base: number; now: number }[] = [
    { label: 'Monthly household cost', base: baseResult.monthly.total, now: result.monthly.total },
    { label: 'Annual cost', base: baseResult.annual.total, now: result.annual.total },
    { label: 'One-time readiness target', base: baseResult.oneOff.total, now: result.oneOff.total },
    { label: 'Emergency reserve', base: baseResult.emergencyFund.point, now: result.emergencyFund.point },
    { label: 'Required household income', base: baseResult.requiredIncome.point, now: result.requiredIncome.point },
    { label: '18-year projected total', base: baseResult.projection.total18Year.point, now: result.projection.total18Year.point },
    { label: 'Monthly gap', base: baseResult.income.monthlyGap, now: result.income.monthlyGap },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">What-if simulator</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Change one thing at a time
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Every control recalculates instantly against your saved plan, so you can see exactly which variable is doing
            the work. Nothing here changes your saved plan until you apply it.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDraft(profile)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              onNavigate('results');
            }}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Apply to my plan
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* controls */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Household</h2>
            <div className="mt-4 space-y-5">
              <Slider
                label="Children"
                min={0}
                max={10}
                value={draft.children.length}
                format={(v) => `${v} child${v === 1 ? '' : 'ren'}`}
                onChange={(v) => {
                  const cur = draft.children;
                  if (v === cur.length) return;
                  const next =
                    v > cur.length
                      ? [...cur, ...Array.from({ length: v - cur.length }, (_, i) => makeChild(-(i + 1)))]
                      : cur.slice(0, v);
                  patch({ children: next });
                }}
              />
              <Slider label="Spouses" min={0} max={4} value={draft.spouses} onChange={(v) => patch({ spouses: v })} format={(v) => `${v}`} />
              <Slider
                label="Household income"
                min={0}
                max={5_000_000}
                step={25_000}
                value={draft.monthlyIncome + draft.spouseMonthlyIncome + draft.otherMonthlyIncome}
                format={(v) => `${formatCompact(v)} / mo`}
                onChange={(v) => patch({ monthlyIncome: v, spouseMonthlyIncome: 0, otherMonthlyIncome: 0 })}
              />
              <Slider label="Emergency reserve" min={1} max={24} value={draft.emergencyFundMonths} onChange={(v) => patch({ emergencyFundMonths: v })} format={(v) => `${v} months`} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Choices</h2>
            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Lifestyle</p>
                <OptionGrid
                  name="Lifestyle"
                  columns={4}
                  value={draft.lifestyle}
                  onChange={(v) => patch({ lifestyle: v })}
                  options={LIFESTYLE_TIERS.map((t) => ({ id: t.id, label: t.label }))}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Housing standard</p>
                <OptionGrid
                  name="Housing"
                  columns={4}
                  value={draft.housingTier}
                  onChange={(v) => patch({ housingTier: v, customAnnualRent: null })}
                  options={HOUSING_TIERS.map((t) => ({ id: t.id, label: t.label }))}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Transport</p>
                <OptionGrid
                  name="Transport"
                  columns={2}
                  value={draft.transportId}
                  onChange={(v) => patch({ transportId: v })}
                  options={TRANSPORT_OPTIONS.map((t) => ({ id: t.id, label: t.label }))}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Education path (applies to every child)</p>
                <OptionGrid
                  name="Education"
                  columns={2}
                  value={draft.children[0]?.tertiaryOptionId ?? 'tertiary-public'}
                  onChange={(v) =>
                    patch({
                      children: draft.children.map((c) => ({
                        ...c,
                        tertiaryOptionId: v,
                        secondaryOptionId: v === 'tertiary-private' || v === 'tertiary-foreign' ? 'secondary-private' : 'secondary-public',
                        primaryOptionId: v === 'tertiary-private' || v === 'tertiary-foreign' ? 'primary-private' : 'primary-public',
                      })),
                    })
                  }
                  options={[
                    { id: 'tertiary-public', label: 'Public throughout' },
                    { id: 'tertiary-private', label: 'Private throughout' },
                    { id: 'tertiary-poly', label: 'Polytechnic route' },
                    { id: 'tertiary-foreign', label: 'Foreign university' },
                  ]}
                />
              </div>
              <Toggle checked={draft.housingStatus === 'own'} onChange={(v) => patch({ housingStatus: v ? 'own' : 'rent' })} label="What if I already owned the home?" hint="Removes rent, keeps maintenance and levies." />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">Inflation scenario</p>
                <OptionGrid
                  name="Inflation"
                  columns={3}
                  value={draft.inflationScenario}
                  onChange={(v) => patch({ inflationScenario: v, customInflationRate: null })}
                  options={INFLATION_SCENARIOS.map((s) => ({ id: s.id, label: `${s.label} ${s.rate}%` }))}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* live results */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="sticky top-20 p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Live impact</h2>
            <p className="mt-1 text-xs text-slate-500">Compared with your saved plan.</p>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td className="py-2.5 pr-3 text-slate-600">{r.label}</td>
                    <td className="py-2.5 text-right font-mono font-medium text-slate-900">{formatCompact(r.now)}</td>
                    <td className="w-20 py-2.5 text-right">
                      <Delta base={r.base} now={r.now} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Readiness score{' '}
                <strong className="font-mono text-slate-900">{result.readiness.score.toFixed(0)}</strong> (was{' '}
                {baseResult.readiness.score.toFixed(0)})
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* relocation */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Relocation simulator</h2>
          <p className="mt-1 text-xs text-slate-500">Your exact plan, priced in eight cities. Cheapest first.</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 text-right font-medium">Monthly</th>
                <th className="pb-2 text-right font-medium">One-time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {relocation.map((r) => (
                <tr key={r.city.id} className={cx(r.city.id === draft.cityId && 'bg-emerald-50/60')}>
                  <td className="py-2.5">
                    <button
                      onClick={() => patch({ cityId: r.city.id, state: r.city.state })}
                      className="text-left text-slate-700 underline-offset-2 hover:underline"
                    >
                      {r.city.name}
                    </button>
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-900">{formatCompact(r.monthly)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-600">{formatCompact(r.oneOff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Salary growth simulator</h2>
          <p className="mt-1 text-xs text-slate-500">
            Household income against household cost in year 10, under different annual income growth assumptions.
          </p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-medium">Growth</th>
                <th className="pb-2 text-right font-medium">Income (yr 10)</th>
                <th className="pb-2 text-right font-medium">Cost (yr 10)</th>
                <th className="pb-2 text-right font-medium">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomeScenarios.map((s) => (
                <tr key={s.growth}>
                  <td className="py-2.5 font-mono text-slate-700">{s.growth}%</td>
                  <td className="py-2.5 text-right font-mono text-slate-900">{formatCompact(s.income)}</td>
                  <td className="py-2.5 text-right font-mono text-slate-600">{formatCompact(s.cost)}</td>
                  <td className={cx('py-2.5 text-right font-mono text-xs font-medium', s.income >= s.cost ? 'text-emerald-700' : 'text-rose-600')}>
                    {s.income >= s.cost ? 'covered' : `short ${formatCompact(s.cost - s.income)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <Callout tone="info">
              Income growth below the inflation assumption means the household falls behind in real terms even while the
              naira figure on the payslip rises.
            </Callout>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WhatIf;
