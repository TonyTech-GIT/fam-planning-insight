import React, { useMemo, useState } from 'react';
import { Card, cx, Callout } from './ui';
import { calculatePlan } from '@/lib/engine/calculators';
import { formatCompact } from '@/lib/engine/money';
import { PRESET_SCENARIOS, DEFAULT_PROFILE } from '@/lib/engine/profile';
import type { HouseholdProfile } from '@/lib/engine/types';
import type { ViewId } from './Chrome';

const ROWS = [
  { key: 'monthly', label: 'Monthly household requirement' },
  { key: 'annual', label: 'Annual requirement' },
  { key: 'oneoff', label: 'Initial (one-time) target' },
  { key: 'emergency', label: 'Emergency reserve' },
  { key: 'required', label: 'Required household income' },
  { key: 'y5', label: '5-year projected cost' },
  { key: 'y10', label: '10-year projected cost' },
  { key: 'y18', label: '18-year projected cost' },
] as const;

export const Compare: React.FC<{
  profile: HouseholdProfile;
  hasPlan: boolean;
  onNavigate: (v: ViewId) => void;
}> = ({ profile, hasPlan, onNavigate }) => {
  const [includeMine, setIncludeMine] = useState(true);

  const columns = useMemo(() => {
    const presets = PRESET_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      summary: s.summary,
      result: calculatePlan({ ...DEFAULT_PROFILE, ...s.patch }),
    }));
    if (includeMine && hasPlan) {
      const mine = calculatePlan(profile);
      return [
        {
          id: 'mine',
          name: 'Your plan',
          summary: `${mine.meta.cityLabel} · ${profile.spouses} spouse${profile.spouses === 1 ? '' : 's'} · ${profile.children.length} children · ${profile.lifestyle} lifestyle`,
          result: mine,
        },
        ...presets,
      ];
    }
    return presets;
  }, [includeMine, hasPlan, profile]);

  const valueFor = (key: (typeof ROWS)[number]['key'], r: ReturnType<typeof calculatePlan>) => {
    switch (key) {
      case 'monthly': return r.monthly.range;
      case 'annual': return r.annual.range;
      case 'oneoff': return r.oneOff.range;
      case 'emergency': return r.emergencyFund;
      case 'required': return r.requiredIncome;
      case 'y5': return r.projection.total5Year;
      case 'y10': return r.projection.total10Year;
      default: return r.projection.total18Year;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Scenario comparison</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Same engine, different assumptions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            These illustrative households are calculated live. None of them is a recommendation — they exist to show how
            much family size, city, education choice and lifestyle move the numbers.
          </p>
        </div>
        {hasPlan && (
          <button
            onClick={() => setIncludeMine((v) => !v)}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {includeMine ? 'Hide my plan' : 'Include my plan'}
          </button>
        )}
      </div>

      <Card className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Side-by-side scenario comparison</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Measure</th>
              {columns.map((c) => (
                <th key={c.id} className="p-4 text-left align-top">
                  <span className={cx('block text-sm font-semibold', c.id === 'mine' ? 'text-emerald-700' : 'text-slate-900')}>
                    {c.name}
                  </span>
                  <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500">{c.summary}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROWS.map((row) => {
              const values = columns.map((c) => valueFor(row.key, c.result).point);
              const min = Math.min(...values);
              return (
                <tr key={row.key}>
                  <th scope="row" className="p-4 text-left font-medium text-slate-700">{row.label}</th>
                  {columns.map((c, i) => {
                    const rg = valueFor(row.key, c.result);
                    return (
                      <td key={c.id} className="p-4">
                        <span className={cx('block font-mono font-semibold', values[i] === min ? 'text-emerald-700' : 'text-slate-900')}>
                          {formatCompact(rg.low)} – {formatCompact(rg.high)}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-slate-400">mid {formatCompact(rg.point)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="bg-slate-50">
              <th scope="row" className="p-4 text-left font-medium text-slate-700">Readiness score (with that scenario&apos;s income)</th>
              {columns.map((c) => (
                <td key={c.id} className="p-4 font-mono font-semibold text-slate-900">
                  {c.result.readiness.score.toFixed(0)}
                  <span className="ml-2 text-[11px] font-normal text-slate-500">{c.result.readiness.band}</span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="p-4 text-left font-medium text-slate-700">Largest cost driver</th>
              {columns.map((c) => (
                <td key={c.id} className="p-4 text-slate-700">
                  {c.result.drivers[0]?.label ?? '—'}
                  <span className="ml-1 font-mono text-xs text-slate-500">
                    {c.result.drivers[0] ? `${c.result.drivers[0].share.toFixed(0)}%` : ''}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Callout tone="info" title="Reading this table honestly">
          The cheapest column is not the best column. A plan that fits your income and leaves a surplus is stronger than
          a cheaper plan that does not match how you actually intend to live.
        </Callout>
        <Callout tone="warning" title="Ranges, not verdicts">
          Every cell is a −12% / +18% band around a modelled point estimate. Two columns whose bands overlap are not
          meaningfully different.
        </Callout>
      </div>

      {!hasPlan && (
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('plan')}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Build your own plan to add it to this table
          </button>
        </div>
      )}
    </div>
  );
};

export default Compare;
