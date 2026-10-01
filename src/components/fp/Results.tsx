import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Download, Save, Sparkles } from 'lucide-react';
import { Card, StatCard, KindBadge, Callout, Bar, cx } from './ui';
import { BreakdownChart, InflationChart, TimelineChart } from './ResultsCharts';
import { LoadScenarioPanel, ScenarioVersionBanner, type ScenarioLoadHandler } from './LoadScenario';
import { formatCompact, formatNaira } from '@/lib/engine/money';
import { saveScenarioRemote, type SavedScenarioMeta } from '@/lib/planStore';
import { supabase } from '@/lib/supabase';
import type { HouseholdProfile, PlanResult } from '@/lib/engine/types';
import type { ViewId } from './Chrome';


const BAND_META = {
  strong: { label: 'Strong preparation', tone: 'text-emerald-700', bar: 'bg-emerald-600', card: 'border-emerald-300 bg-emerald-50/50' },
  reasonable: { label: 'Reasonable preparation', tone: 'text-sky-700', bar: 'bg-sky-600', card: 'border-sky-300 bg-sky-50/50' },
  improve: { label: 'Needs improvement', tone: 'text-amber-700', bar: 'bg-amber-500', card: 'border-amber-300 bg-amber-50/50' },
  gap: { label: 'Significant financial gap', tone: 'text-rose-700', bar: 'bg-rose-600', card: 'border-rose-300 bg-rose-50/50' },
} as const;

const Collapsible: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen }) => {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Card>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <span className="text-[15px] font-semibold text-slate-900">{title}</span>
        <ChevronDown className={cx('h-4 w-4 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {open && <div className="border-t border-slate-100 p-5">{children}</div>}
    </Card>
  );
};

const AiExplain: React.FC<{ result: PlanResult; profile: HouseholdProfile }> = ({ result, profile }) => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');

  const ask = async (q?: string) => {
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fp-explain', {
        body: {
          question: q ?? question,
          facts: {
            city: result.meta.cityLabel,
            householdSize: result.meta.householdSize,
            spouses: profile.spouses,
            children: profile.children.length,
            lifestyle: profile.lifestyle,
            monthlyRequirement: result.monthly.total,
            monthlyLow: result.monthly.range.low,
            monthlyHigh: result.monthly.range.high,
            annualRequirement: result.annual.total,
            initialTarget: result.oneOff.total,
            emergencyFund: result.emergencyFund.point,
            requiredIncome: result.requiredIncome.point,
            householdIncome: result.income.household,
            monthlyGap: result.income.monthlyGap,
            savingsRate: result.income.savingsRate,
            debtServiceRatio: result.income.debtServiceRatio,
            housingRatio: result.income.housingRatio,
            inflationRate: result.projection.inflationRate,
            eighteenYearTotal: result.projection.total18Year.point,
            readinessScore: result.readiness.score,
            readinessBand: result.readiness.band,
            topDrivers: result.drivers,
          },
        },
      });
      if (fnError || data?.error) throw new Error(data?.error ?? 'failed');
      setAnswer(data.answer);
    } catch {
      setError('The explanation service is unavailable right now. Your figures above are unaffected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-slate-900">Explain this in plain language</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            The assistant receives only the figures calculated above and is instructed never to invent economic
            statistics. It explains your result; it does not source data.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              'Explain my result in plain language',
              'Why is my required income so high?',
              'What should I change first?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={loading}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) ask();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about your own result…"
              aria-label="Ask about your result"
              maxLength={300}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Thinking…' : 'Ask'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {answer && (
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
              {answer}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export const Results: React.FC<{
  result: PlanResult;
  profile: HouseholdProfile;
  onNavigate: (v: ViewId) => void;
  onLoadScenario: ScenarioLoadHandler;
  loadedMeta?: SavedScenarioMeta | null;
  onDismissLoaded?: () => void;
}> = ({ result, profile, onNavigate, onLoadScenario, loadedMeta, onDismissLoaded }) => {
  const band = BAND_META[result.readiness.band];
  const [saveState, setSaveState] = useState<{ code?: string; error?: string; busy?: boolean }>({});

  const save = async () => {
    setSaveState({ busy: true });
    const res = await saveScenarioRemote(`${result.meta.cityLabel} · ${profile.children.length} children`, profile, result);
    if ('error' in res) setSaveState({ error: res.error });
    else setSaveState({ code: res.shareCode });
  };

  const printReport = () => window.print();

  const gap = result.income.monthlyGap;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Your family financial plan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {result.meta.cityLabel}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {result.meta.householdSize} people · {profile.spouses} spouse{profile.spouses === 1 ? '' : 's'} ·{' '}
            {profile.children.length} child{profile.children.length === 1 ? '' : 'ren'} · {profile.lifestyle} lifestyle ·{' '}
            {result.meta.inflationScenario} inflation
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saveState.busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saveState.busy ? 'Saving…' : 'Save scenario'}
          </button>
          <button onClick={printReport} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Download className="h-4 w-4" /> Print report
          </button>
        </div>
      </div>

      {saveState.code && (
        <div className="mt-4">
          <Callout tone="positive" title="Scenario saved anonymously">
            Your share code is <strong className="font-mono">{saveState.code}</strong>. It stores only your inputs,
            results and the dataset versions used — no name, email or identifier. Keep the code to reload this plan later
            from the header or the panel below.
          </Callout>
        </div>
      )}
      {saveState.error && (
        <div className="mt-4">
          <Callout tone="warning">{saveState.error}</Callout>
        </div>
      )}

      {loadedMeta && (
        <div className="mt-4">
          <ScenarioVersionBanner meta={loadedMeta} onDismiss={() => onDismissLoaded?.()} />
        </div>
      )}

      {/* headline cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Estimated initial readiness target" low={result.oneOff.range.low} high={result.oneOff.range.high} note="One-time money: wedding, move-in, setup, maternity and emergency reserve." />
        <StatCard label="Estimated monthly household cost" low={result.monthly.range.low} high={result.monthly.range.high} note={`Essentials alone: ${formatCompact(result.monthly.essentialTotal)}/mo.`} />
        <StatCard label="Recommended emergency reserve" low={result.emergencyFund.low} high={result.emergencyFund.high} note={`${result.meta.assumptions.emergencyFundMonths} months of essential expenses.`} />
        <StatCard label="Estimated annual family cost" low={result.annual.range.low} high={result.annual.range.high} note="Today's prices, before inflation." />
        <StatCard label="Projected 18-year total" low={result.projection.total18Year.low} high={result.projection.total18Year.high} note={`Compounded at a blended ${result.projection.inflationRate.toFixed(1)}% a year.`} />
        <StatCard
          label="Estimated required household income"
          low={result.requiredIncome.low}
          high={result.requiredIncome.high}
          accent={result.income.household >= result.requiredIncome.low ? 'positive' : 'warning'}
          note={`To cover costs and still save ${(result.meta.assumptions.targetSavingsRate * 100).toFixed(0)}%. You reported ${formatCompact(result.income.household)}/mo.`}
        />
      </div>

      {result.warnings.length > 0 && (
        <div className="mt-6 space-y-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* readiness + gap */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className={cx('p-5', band.card)}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Financial readiness</h2>
            <span className={cx('text-sm font-semibold', band.tone)}>{band.label}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-semibold text-slate-900">{result.readiness.score.toFixed(0)}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <div className="mt-3">
            <Bar value={result.readiness.score} tone={band.bar} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            This is a planning indicator, not a judgement of you. Every dimension and weight is shown below.
          </p>
          <ul className="mt-4 space-y-3">
            {result.readiness.dimensions.map((d) => (
              <li key={d.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-700">{d.label}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {d.score.toFixed(0)}/100 · weight {(d.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar value={d.score} tone={d.score >= 70 ? 'bg-emerald-600' : d.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'} />
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{d.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Income and gap analysis</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Household income', formatNaira(result.income.household) + ' / mo'],
                ['Modelled household cost', formatNaira(result.monthly.total) + ' / mo'],
                ['Debt service', formatNaira(profile.monthlyDebtRepayment) + ' / mo'],
                ['Monthly surplus / deficit', formatNaira(result.income.surplus) + ' / mo'],
                ['Savings rate', `${result.income.savingsRate.toFixed(1)}%`],
                ['Housing share of income', `${result.income.housingRatio.toFixed(1)}%`],
                ['Debt service ratio', `${result.income.debtServiceRatio.toFixed(1)}%`],
                ['Savings cover essentials for', `${result.income.monthsOfRunway.toFixed(1)} months`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2">
                  <dt className="text-slate-600">{k}</dt>
                  <dd className="font-mono font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            {gap > 0 ? (
              <div className="mt-4">
                <Callout tone="warning" title="There is a modelled monthly gap">
                  Based on the assumptions you selected, your household finances show an estimated gap of{' '}
                  <strong className="font-mono">{formatNaira(gap)}</strong> per month. Closing this gap before taking on
                  additional responsibilities would improve financial resilience. This is a statement about the plan, not
                  about you.
                </Callout>
              </div>
            ) : (
              <div className="mt-4">
                <Callout tone="positive" title="Income covers the modelled plan">
                  Your reported income covers the modelled monthly requirement with{' '}
                  <strong className="font-mono">{formatNaira(result.income.surplus)}</strong> left over.
                  {result.income.yearsToInitialTarget !== null && (
                    <> At that rate the one-time target is reached in about {result.income.yearsToInitialTarget.toFixed(1)} years.</>
                  )}
                </Callout>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Biggest cost drivers</h2>
            <ol className="mt-4 space-y-3">
              {result.drivers.map((d, i) => (
                <li key={d.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">
                      <span className="mr-2 font-mono text-xs text-slate-400">{i + 1}</span>
                      {d.label}
                    </span>
                    <span className="font-mono text-slate-900">{formatCompact(d.monthly)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Bar value={d.share} />
                  </div>
                </li>
              ))}
            </ol>
            <button
              onClick={() => onNavigate('simulator')}
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Adjust these in the what-if simulator
            </button>
          </Card>
        </div>
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownChart result={result} />
        <div className="space-y-4">
          <InflationChart result={result} />
        </div>
      </div>

      <div className="mt-6">
        <TimelineChart result={result} />
      </div>

      <div className="mt-6">
        <AiExplain result={result} profile={profile} />
      </div>

      {/* detail */}
      <div className="mt-6 space-y-4">
        <Collapsible title="One-time costs — exactly what is in the initial target">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {result.oneOff.lines.map((l) => (
                <tr key={l.key}>
                  <td className="py-2.5 pr-4 text-slate-700">
                    {l.label}
                    {l.note && <span className="mt-0.5 block text-xs text-slate-500">{l.note}</span>}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-900">{formatNaira(l.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="py-2.5 pr-4 font-semibold text-slate-900">Total one-time target</td>
                <td className="py-2.5 text-right font-mono font-semibold text-slate-900">{formatNaira(result.oneOff.total)}</td>
              </tr>
            </tbody>
          </table>
        </Collapsible>

        <Collapsible title="Monthly cost lines — with provenance">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {result.monthly.lines.map((l) => (
                <tr key={l.key}>
                  <td className="py-2.5 pr-4">
                    <span className="text-slate-700">{l.label}</span>
                    <span className="ml-2 align-middle"><KindBadge kind={l.kind} /></span>
                    {!l.essential && <span className="ml-2 text-xs text-slate-400">discretionary</span>}
                    {l.detail && (
                      <span className="mt-1 block text-xs text-slate-500">
                        {l.detail.filter((d) => d.amount > 0).map((d) => `${d.label}: ${formatCompact(d.amount)}/yr`).join(' · ')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-900">{formatNaira(Math.round(l.monthly))}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="py-2.5 pr-4 font-semibold text-slate-900">Total monthly</td>
                <td className="py-2.5 text-right font-mono font-semibold text-slate-900">{formatNaira(result.monthly.total)}</td>
              </tr>
            </tbody>
          </table>
        </Collapsible>

        <Collapsible title="Recommended preparation priorities">
          <ol className="space-y-3 text-sm text-slate-700">
            {[
              result.income.monthsOfRunway < result.meta.assumptions.emergencyFundMonths &&
                `Build the emergency reserve toward ${formatCompact(result.emergencyFund.point)} — currently covering ${result.income.monthsOfRunway.toFixed(1)} months of essentials.`,
              result.income.debtServiceRatio > 20 && 'Reduce high-cost debt: debt service is consuming a large share of income and crowds out every other goal.',
              gap > 0 && `Close the modelled monthly gap of ${formatCompact(gap)} — through income, or by revisiting the housing, education or lifestyle assumptions.`,
              result.income.housingRatio > 30 && `Housing is ${result.income.housingRatio.toFixed(0)}% of income. Reviewing the housing tier or city is usually the fastest single lever.`,
              profile.children.length > 0 && 'Start an education fund now — tertiary costs land 15+ years out, where inflation compounding does the most damage.',
              'Re-run this plan whenever your income, city or family plans change; the assumptions are versioned so you can compare.',
            ]
              .filter(Boolean)
              .map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-mono text-xs text-emerald-700">{String(i + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed">{t as string}</span>
                </li>
              ))}
          </ol>
        </Collapsible>

        <Collapsible title="Reproducibility — versions used for this calculation">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Dataset version', result.meta.datasetVersion],
              ['Assumption version', result.meta.assumptionVersion],
              ['Engine version', result.meta.engineVersion],
              ['Calculated at', new Date(result.meta.calculatedAt).toLocaleString()],
              ['Inflation scenario', result.meta.inflationScenario],
              ['Blended inflation applied', `${result.projection.inflationRate.toFixed(2)}%`],
              ['Income growth assumption', `${profile.incomeGrowthRate}% / year`],
              ['Uncertainty band', `−${((1 - result.meta.assumptions.uncertaintyBandLow) * 100).toFixed(0)}% / +${((result.meta.assumptions.uncertaintyBandHigh - 1) * 100).toFixed(0)}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <dt className="text-slate-600">{k}</dt>
                <dd className="font-mono text-xs text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            These stamps mean a plan produced today can still be explained after the datasets are updated. Saved
            scenarios store the same stamps alongside the inputs.
          </p>
        </Collapsible>
      </div>

      <div className="mt-6">
        <LoadScenarioPanel onLoaded={onLoadScenario} />
      </div>


      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Every figure above is an estimate produced from the assumptions you selected. It is not financial advice, not a
        prediction, and not a statement about whether you should marry or have children.
      </p>
    </div>
  );
};

export default Results;
