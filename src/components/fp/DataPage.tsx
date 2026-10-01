import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { Card, SectionHeading, KindBadge, Callout, cx } from './ui';
import { DATA_SOURCES, CONFIDENCE_LABEL, KIND_DESCRIPTION, type DataKind } from '@/data/sources';
import { HISTORICAL_INFLATION, INFLATION_SCENARIOS, historicalAverage, CATEGORY_INFLATION_WEIGHTS } from '@/data/inflation';
import { ALL_COST_RECORDS, EDUCATION_OPTIONS, HOUSING_TIERS, TRANSPORT_OPTIONS, WEDDING_TIERS, educationTotal } from '@/data/costBaselines';
import { CITIES } from '@/data/locations';
import { ASSUMPTION_NOTES, DEFAULT_ASSUMPTIONS, DATASET_VERSION, ASSUMPTION_VERSION, ENGINE_VERSION } from '@/data/assumptions';
import { runEngineTests, testSummary, type TestResult } from '@/lib/engine/selftest';
import { loadOverrides, type OverrideRow } from '@/lib/planStore';
import { formatCompact } from '@/lib/engine/money';

const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cx(
      'whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition',
      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
    )}
  >
    {children}
  </button>
);

export const DataPage: React.FC = () => {
  const [tab, setTab] = useState<'sources' | 'datasets' | 'assumptions' | 'tests'>('sources');
  const [tests, setTests] = useState<TestResult[] | null>(null);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);

  useEffect(() => {
    loadOverrides().then(setOverrides);
  }, []);

  const summary = tests ? testSummary(tests) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Transparency"
        title="Where our numbers come from"
        blurb="Nothing on this platform is a secret. Below is every source, every dataset record, every assumption and the result of the engine's own test suite."
      />

      <div className="mt-6 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        <Tab active={tab === 'sources'} onClick={() => setTab('sources')}>Sources</Tab>
        <Tab active={tab === 'datasets'} onClick={() => setTab('datasets')}>Datasets</Tab>
        <Tab active={tab === 'assumptions'} onClick={() => setTab('assumptions')}>Assumptions</Tab>
        <Tab active={tab === 'tests'} onClick={() => setTab('tests')}>Engine tests</Tab>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {(['verified', 'derived', 'estimated', 'user'] as DataKind[]).map((k) => (
          <Card key={k} className="p-4">
            <KindBadge kind={k} />
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{KIND_DESCRIPTION[k]}</p>
          </Card>
        ))}
      </div>

      {tab === 'sources' && (
        <div className="mt-6 space-y-4">
          {DATA_SOURCES.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{s.organization}</p>
                </div>
                <span className={cx(
                  'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                  s.confidence === 'high' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : s.confidence === 'medium' ? 'border-sky-200 bg-sky-50 text-sky-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800',
                )}>
                  {CONFIDENCE_LABEL[s.confidence]}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-slate-500">Geographic scope</dt><dd className="text-slate-800">{s.scope}</dd></div>
                <div><dt className="text-xs text-slate-500">Data period</dt><dd className="text-slate-800">{s.period}</dd></div>
                <div><dt className="text-xs text-slate-500">Last reviewed</dt><dd className="text-slate-800">{s.lastReviewed}</dd></div>
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.methodology}</p>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800">
                  Visit source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'datasets' && (
        <div className="mt-6 space-y-6">
          <Callout tone="warning" title="Read this before quoting any figure">
            Most granular Nigerian prices — rent by neighbourhood, school fees, HMO premiums — are not published in any
            single reliable national dataset. Those records are labelled <strong>Estimated</strong> and are meant to be
            replaced by your own figures wherever you know better.
          </Callout>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Inflation series</h3>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="pb-2">Year</th><th className="pb-2">Annual average</th><th className="pb-2">Kind</th><th className="pb-2">Note</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {HISTORICAL_INFLATION.map((h) => (
                  <tr key={h.year}>
                    <td className="py-2 font-mono text-slate-700">{h.year}</td>
                    <td className="py-2 font-mono text-slate-900">{h.rate}%</td>
                    <td className="py-2"><KindBadge kind={h.kind} /></td>
                    <td className="py-2 text-xs text-slate-500">{h.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Ten-year average: <strong className="font-mono">{historicalAverage(10).toFixed(1)}%</strong>. Scenarios used
              for projection: {INFLATION_SCENARIOS.map((s) => `${s.label} ${s.rate}%`).join(' · ')}.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Category inflation weights</h3>
            <p className="mt-1 text-xs text-slate-500">Applied to the headline scenario so food does not inflate like airtime.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(CATEGORY_INFLATION_WEIGHTS).map(([k, v]) => (
                <span key={k} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                  {k} <span className="font-mono font-semibold">×{v}</span>
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Cost baseline records</h3>
            <p className="mt-1 text-xs text-slate-500">National urban reference city, before location multipliers.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="pb-2">Record</th><th className="pb-2">Value</th><th className="pb-2">Unit</th><th className="pb-2">Kind</th><th className="pb-2">Source</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_COST_RECORDS.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3 text-slate-700">{r.label}{r.note && <span className="mt-0.5 block text-xs text-slate-500">{r.note}</span>}</td>
                      <td className="py-2 font-mono text-slate-900">{r.unit === 'ratio' || r.unit.includes('rate') || r.unit.includes('share') ? r.value : formatCompact(r.value)}</td>
                      <td className="py-2 text-xs text-slate-500">{r.unit}</td>
                      <td className="py-2"><KindBadge kind={r.kind} /></td>
                      <td className="py-2 text-xs text-slate-500">{r.sourceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Education cost bands (annual, all-in, per child)</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="pb-2">Option</th><th className="pb-2">Tuition</th><th className="pb-2">Accommodation</th><th className="pb-2">Other</th><th className="pb-2">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {EDUCATION_OPTIONS.filter((e) => educationTotal(e) > 0).map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 pr-3 text-slate-700">{e.label}</td>
                      <td className="py-2 font-mono text-slate-900">{formatCompact(e.tuition)}</td>
                      <td className="py-2 font-mono text-slate-600">{formatCompact(e.accommodation)}</td>
                      <td className="py-2 font-mono text-slate-600">{formatCompact(e.transport + e.materials + e.technology + e.feeding + e.misc)}</td>
                      <td className="py-2 font-mono font-semibold text-slate-900">{formatCompact(educationTotal(e))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-slate-900">Housing bands</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {HOUSING_TIERS.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-700">{t.label}</span>
                    <span className="font-mono text-slate-900">{formatCompact(t.annualRentPerBedroom)}/bed/yr</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-slate-900">Transport bands</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {TRANSPORT_OPTIONS.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-700">{t.label}</span>
                    <span className="font-mono text-slate-900">{formatCompact(t.monthlyRunning)}/mo</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-slate-900">Wedding bands</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {WEDDING_TIERS.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-slate-700">{t.label}</span>
                    <span className="font-mono text-slate-900">{formatCompact(t.total)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Location multipliers</h3>
            <p className="mt-1 text-xs text-slate-500">Derived; reference urban city = 1.00. Housing varies far more by city than general goods.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <span key={c.id} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                  {c.name} <span className="font-mono">h×{c.housingMultiplier} g×{c.generalMultiplier}</span>
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Published administrator overrides</h3>
            <p className="mt-1 text-xs text-slate-500">
              Values maintained through the governed admin API, with a full audit trail. These supersede the built-in
              defaults once wired into a dataset key.
            </p>
            {overrides.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No overrides have been published yet.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="pb-2">Key</th><th className="pb-2">Value</th><th className="pb-2">Kind</th><th className="pb-2">Updated</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {overrides.map((o) => (
                    <tr key={o.key}>
                      <td className="py-2 font-mono text-xs text-slate-700">{o.key}<span className="block text-slate-500">{o.label}</span></td>
                      <td className="py-2 font-mono text-slate-900">{formatCompact(Number(o.value))}</td>
                      <td className="py-2 text-xs text-slate-600">{o.kind}</td>
                      <td className="py-2 text-xs text-slate-500">{new Date(o.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === 'assumptions' && (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Version register</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-slate-500">Dataset</dt><dd className="font-mono text-slate-900">{DATASET_VERSION}</dd></div>
              <div><dt className="text-xs text-slate-500">Assumptions</dt><dd className="font-mono text-slate-900">{ASSUMPTION_VERSION}</dd></div>
              <div><dt className="text-xs text-slate-500">Engine</dt><dd className="font-mono text-slate-900">{ENGINE_VERSION}</dd></div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Every calculation stamps these three versions plus a timestamp into its result, so a plan produced today
              remains reproducible and explainable after the datasets change.
            </p>
          </Card>

          {ASSUMPTION_NOTES.map((n) => (
            <Card key={n.key} className="p-5">
              <h3 className="text-[15px] font-semibold text-slate-900">{n.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{n.rationale}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">
                default: {String(DEFAULT_ASSUMPTIONS[n.key])}
              </p>
            </Card>
          ))}

          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">Household scaling</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Per-head costs are scaled by n<sup>0.82</sup>/n, a standard equivalence-scale approach: a household of six
              does not spend six times what one person spends on food, utilities or household goods. Housing scales by
              bedrooms, not by headcount, and duplicates entirely when spouses maintain separate households.
            </p>
          </Card>
        </div>
      )}

      {tab === 'tests' && (
        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Calculation engine test suite</h3>
                <p className="mt-1 text-sm text-slate-600">
                  The engine is a pure module, so it can be exercised directly in your browser. These are the same
                  assertions that guard against NaN, Infinity, divide-by-zero, missing datasets and non-monotonic results.
                </p>
              </div>
              <button
                onClick={() => setTests(runEngineTests())}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <PlayCircle className="h-4 w-4" /> Run engine tests
              </button>
            </div>
            {summary && (
              <p className={cx('mt-4 text-sm font-semibold', summary.failed === 0 ? 'text-emerald-700' : 'text-rose-700')}>
                {summary.passed}/{summary.total} assertions passed
                {summary.failed > 0 && ` · ${summary.failed} failed`}
              </p>
            )}
            {tests && (
              <ul className="mt-4 divide-y divide-slate-100">
                {tests.map((t) => (
                  <li key={t.name} className="flex items-start gap-3 py-2.5">
                    {t.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <div>
                      <p className="text-sm text-slate-800">{t.name}</p>
                      {!t.passed && <p className="mt-0.5 font-mono text-xs text-rose-600">{t.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Callout tone="info" title="What is not tested here">
            These assertions verify the arithmetic and the guardrails. They cannot verify that the underlying cost
            estimates match your city — that is what the confidence labels and your own overrides are for.
          </Callout>
        </div>
      )}
    </div>
  );
};

export default DataPage;
