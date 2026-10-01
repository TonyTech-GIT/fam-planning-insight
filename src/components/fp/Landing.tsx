import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Database, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { Card, SectionHeading, KindBadge, cx, Money } from './ui';
import { HOW_IT_WORKS, WHAT_WE_CALCULATE, FAQ, DISCLAIMER_LONG } from '@/data/content';
import { HISTORICAL_INFLATION, INFLATION_SCENARIOS, historicalAverage } from '@/data/inflation';
import { PRESET_SCENARIOS, DEFAULT_PROFILE } from '@/lib/engine/profile';
import { calculatePlan } from '@/lib/engine/calculators';
import { formatCompact } from '@/lib/engine/money';
import type { ViewId } from './Chrome';

const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/6aa06e84bd8dc67e9bf06929_1788899042099_ea7750ae.jpg';

const InflationSpark: React.FC = () => {
  const max = Math.max(...HISTORICAL_INFLATION.map((h) => h.rate));
  return (
    <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Reported annual headline inflation, Nigeria, 2015 to 2025">
      {HISTORICAL_INFLATION.map((h) => (
        <div key={h.year} className="group flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
            {h.rate}%
          </span>
          <div
            className={cx('w-full rounded-t transition', h.rate > 20 ? 'bg-amber-500' : 'bg-emerald-600')}
            style={{ height: `${(h.rate / max) * 92}%` }}
            title={`${h.year}: ${h.rate}%`}
          />
          <span className="text-[10px] text-slate-400">{`'${String(h.year).slice(2)}`}</span>
        </div>
      ))}
    </div>
  );
};

const ScenarioPreview: React.FC = () => {
  const rows = useMemo(
    () =>
      PRESET_SCENARIOS.map((s) => {
        const result = calculatePlan({ ...DEFAULT_PROFILE, ...s.patch });
        return { ...s, result };
      }),
    [],
  );
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{r.name}</p>
          <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-slate-600">{r.summary}</p>
          <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-slate-500">Monthly</dt>
              <dd className="font-mono font-semibold text-slate-900">
                {formatCompact(r.result.monthly.range.low)}–{formatCompact(r.result.monthly.range.high)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-slate-500">One-time target</dt>
              <dd className="font-mono font-semibold text-slate-900">
                {formatCompact(r.result.oneOff.range.low)}–{formatCompact(r.result.oneOff.range.high)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-slate-500">18-year total</dt>
              <dd className="font-mono font-semibold text-slate-900">
                {formatCompact(r.result.projection.total18Year.point)}
              </dd>
            </div>
          </dl>
        </Card>
      ))}
    </div>
  );
};

const Faq: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {FAQ.map((f, i) => (
        <div key={f.q}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="text-[15px] font-medium text-slate-900">{f.q}</span>
            <ChevronDown className={cx('h-4 w-4 shrink-0 text-slate-400 transition', open === i && 'rotate-180')} />
          </button>
          {open === i && <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
};

export const Landing: React.FC<{ onNavigate: (v: ViewId) => void }> = ({ onNavigate }) => {
  const avg = historicalAverage(10);
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-slate-900/60" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24 lg:px-8">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Database className="h-3.5 w-3.5" /> Nigeria · dataset {new Date().getFullYear()} · assumptions versioned
            </span>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Can you afford the family you&apos;re planning for?
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-300">
              Understand the financial realities of marriage and raising a family using real economic data, inflation
              projections and your own plans — with every assumption shown, and nothing hidden behind a black box.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => onNavigate('plan')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-[15px] font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                Calculate my family financial plan <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('data')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-6 py-3.5 text-[15px] font-semibold text-white transition hover:border-slate-400 hover:bg-white/5"
              >
                Explore the data
              </button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> No account required. No BVN, NIN or bank details —
              ever.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 backdrop-blur">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-white">Reported annual headline inflation</p>
                <KindBadge kind="verified" />
              </div>
              <p className="mt-1 text-xs text-slate-400">Nigeria · NBS Consumer Price Index · 2015–2025</p>
              <div className="mt-5">
                <InflationSpark />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4">
                <div>
                  <p className="text-[11px] text-slate-400">10-yr average</p>
                  <p className="font-mono text-lg font-semibold text-white">{avg.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Halves value in</p>
                  <p className="font-mono text-lg font-semibold text-white">
                    {(Math.log(2) / Math.log(1 + avg / 100)).toFixed(1)} yrs
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Scenarios</p>
                  <p className="font-mono text-lg font-semibold text-white">
                    {INFLATION_SCENARIOS[0].rate}–{INFLATION_SCENARIOS[2].rate}%
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                The CPI basket was rebased in 2025, so pre- and post-rebase figures are not strictly comparable. We show
                this rather than smoothing it away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: TrendingUp, title: 'Inflation is modelled, not ignored', body: 'Categories inflate at different rates. Food is weighted above headline; airtime below.' },
            { icon: Users, title: 'Household structures vary', body: 'One spouse or several, children of any age, other dependents — all modelled without judgement.' },
            { icon: Database, title: 'Every figure is labelled', body: 'Verified, derived, estimated or your own input. You always know which you are looking at.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-3.5">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="How it works" title="Four steps, about five minutes" blurb="You can stop at any point — your inputs autosave to your own browser and nowhere else." />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s) => (
            <Card key={s.step} className="p-5">
              <span className="font-mono text-xs font-semibold text-emerald-700">{s.step}</span>
              <h3 className="mt-2 text-[15px] font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* WHAT WE CALCULATE */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="What we calculate" title="Six outputs, each one openable" blurb="Every headline number can be expanded into the lines that produced it." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_CALCULATE.map((w) => (
              <Card key={w.title} className="p-5">
                <h3 className="text-[15px] font-semibold text-slate-900">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLE SCENARIOS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Example scenarios"
          title="The same country, very different numbers"
          blurb="These are live calculations from the same engine you are about to use, run on three illustrative households."
        />
        <div className="mt-8">
          <ScenarioPreview />
        </div>
        <button
          onClick={() => onNavigate('compare')}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          Compare scenarios side by side <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* PURCHASING POWER */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Purchasing power</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              ₦1,000,000 today will not buy ₦1,000,000 of household in ten years
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
              At the baseline assumption of {INFLATION_SCENARIOS[1].rate}% a year, this is what a million naira of
              today&apos;s household spending is projected to cost in future years. The money does not change; the price
              of the same basket does.
            </p>
            <button
              onClick={() => onNavigate('simulator')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold transition hover:bg-white/5"
            >
              Try the what-if simulator <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {[0, 5, 10, 18].map((y) => {
              const v = 1_000_000 * Math.pow(1 + INFLATION_SCENARIOS[1].rate / 100, y);
              return (
                <div key={y} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                  <p className="text-xs text-slate-400">{y === 0 ? 'Today' : `In ${y} years`}</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-white">{formatCompact(v)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {y === 0 ? 'reference basket' : `${((v / 1_000_000 - 1) * 100).toFixed(0)}% more naira for the same basket`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Questions" title="What this is, and what it is not" />
        <div className="mt-8">
          <Faq />
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="border-amber-200 bg-amber-50/60 p-6">
          <h2 className="text-[15px] font-semibold text-amber-900">Important disclaimer</h2>
          <div className="mt-3 space-y-3">
            {DISCLAIMER_LONG.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-amber-900/90">
                {p}
              </p>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Landing;
