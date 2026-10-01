import React, { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, cx } from './ui';
import { formatCompact } from '@/lib/engine/money';
import { INFLATION_SCENARIOS } from '@/data/inflation';
import { calculateFutureCost } from '@/lib/engine/calculators';
import type { PlanResult } from '@/lib/engine/types';

const PALETTE = ['#0f766e', '#0284c7', '#b45309', '#7c3aed', '#be123c', '#15803d', '#475569', '#a16207', '#0891b2', '#c2410c'];

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 },
  formatter: (v: number | string) => formatCompact(Number(v)),
};

export const BreakdownChart: React.FC<{ result: PlanResult }> = ({ result }) => {
  const data = result.monthly.lines
    .filter((l) => l.monthly > 0)
    .map((l) => ({ name: l.label.split('(')[0].trim(), value: Math.round(l.monthly), share: (l.monthly / Math.max(1, result.monthly.total)) * 100 }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">Monthly cost breakdown</h3>
        <span className="font-mono text-sm text-slate-500">{formatCompact(result.monthly.total)}/mo</span>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tickFormatter={(v) => formatCompact(Number(v))} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">Monthly cost breakdown by category</caption>
        <tbody className="divide-y divide-slate-100">
          {data.map((d, i) => (
            <tr key={d.name}>
              <td className="py-1.5">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="text-slate-700">{d.name}</span>
              </td>
              <td className="py-1.5 text-right font-mono text-slate-900">{formatCompact(d.value)}</td>
              <td className="w-14 py-1.5 text-right font-mono text-xs text-slate-500">{d.share.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export const InflationChart: React.FC<{ result: PlanResult }> = ({ result }) => {
  const [scenario, setScenario] = useState<'low' | 'baseline' | 'high' | 'all'>('all');
  const base = result.annual.total;
  const years = [0, 3, 5, 8, 10, 13, 15, 18];
  const currentYear = new Date().getFullYear();
  const data = years.map((y) => ({
    label: y === 0 ? 'Today' : `+${y}y`,
    year: currentYear + y,
    low: Math.round(calculateFutureCost(base, INFLATION_SCENARIOS[0].rate, y)),
    baseline: Math.round(calculateFutureCost(base, INFLATION_SCENARIOS[1].rate, y)),
    high: Math.round(calculateFutureCost(base, INFLATION_SCENARIOS[2].rate, y)),
  }));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">Projected annual household cost</h3>
          <p className="mt-1 text-xs text-slate-500">
            Today&apos;s basket compounded forward. Not a forecast — three bounded scenarios.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['all', 'low', 'baseline', 'high'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={cx(
                'rounded px-2.5 py-1 text-xs font-medium capitalize transition',
                scenario === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickFormatter={(v) => formatCompact(Number(v))} tick={{ fontSize: 11, fill: '#64748b' }} width={56} />
            <Tooltip {...tooltipStyle} labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.year ?? ''}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {(scenario === 'all' || scenario === 'high') && (
              <Area type="monotone" dataKey="high" name={`High (${INFLATION_SCENARIOS[2].rate}%)`} stroke="#b45309" fill="none" strokeWidth={2} />
            )}
            {(scenario === 'all' || scenario === 'baseline') && (
              <Area type="monotone" dataKey="baseline" name={`Baseline (${INFLATION_SCENARIOS[1].rate}%)`} stroke="#0f766e" fill="url(#gBase)" strokeWidth={2.5} />
            )}
            {(scenario === 'all' || scenario === 'low') && (
              <Area type="monotone" dataKey="low" name={`Low (${INFLATION_SCENARIOS[0].rate}%)`} stroke="#0284c7" fill="none" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Your plan uses a blended rate of <strong className="font-mono">{result.projection.inflationRate.toFixed(1)}%</strong>,
        weighted by the mix of categories in your budget — food inflates faster than airtime, so the blend is not simply
        the headline rate.
      </p>
    </Card>
  );
};

export const TimelineChart: React.FC<{ result: PlanResult }> = ({ result }) => {
  const data = result.projection.timeline.map((t) => ({
    year: t.year,
    cost: t.nominal,
    income: t.income,
    events: t.events.join(', '),
  }));
  const eventYears = result.projection.timeline.filter((t) => t.events.length);

  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-semibold text-slate-900">Family timeline — cost against projected income</h3>
      <p className="mt-1 text-xs text-slate-500">
        Both lines are in future (nominal) naira. Where cost rises above income, the plan needs another source of funds.
      </p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tickFormatter={(v) => formatCompact(Number(v))} tick={{ fontSize: 11, fill: '#64748b' }} width={56} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="cost" name="Household cost" stroke="#be123c" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="income" name="Projected income" stroke="#0f766e" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {eventYears.length > 0 && (
        <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <caption className="sr-only">Milestones by year</caption>
            <tbody className="divide-y divide-slate-100">
              {eventYears.map((t) => (
                <tr key={t.year}>
                  <td className="w-20 px-3 py-2 font-mono text-xs text-slate-500">{t.year}</td>
                  <td className="px-3 py-2 text-slate-700">{t.events.join(' · ')}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">{formatCompact(t.nominal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
