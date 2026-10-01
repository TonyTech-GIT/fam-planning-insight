import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Check } from 'lucide-react';
import { Card, Field, NumberInput, OptionGrid, Slider, Toggle, Callout, cx, inputClass, KindBadge } from './ui';
import { COUNTRIES, NIGERIAN_STATES, citiesForState, SETTLEMENT_TYPES } from '@/data/locations';
import {
  LIFESTYLE_TIERS, HOUSING_TIERS, EDUCATION_OPTIONS, TRANSPORT_OPTIONS, WEDDING_TIERS, educationTotal,
} from '@/data/costBaselines';
import { INFLATION_SCENARIOS } from '@/data/inflation';
import { makeChild } from '@/lib/engine/profile';
import { formatCompact } from '@/lib/engine/money';
import type { HouseholdProfile } from '@/lib/engine/types';

export const STEPS = [
  { id: 'location', label: 'Location' },
  { id: 'family', label: 'Household' },
  { id: 'education', label: 'Education' },
  { id: 'housing', label: 'Housing' },
  { id: 'living', label: 'Living costs' },
  { id: 'onetime', label: 'One-time costs' },
  { id: 'finances', label: 'Your finances' },
] as const;

type Patch = (p: Partial<HouseholdProfile>) => void;

const StepShell: React.FC<{ title: string; blurb: string; children: React.ReactNode }> = ({ title, blurb, children }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{blurb}</p>
    </div>
    {children}
  </div>
);

const eduOptions = (stage: 'primary' | 'secondary' | 'tertiary') =>
  EDUCATION_OPTIONS.filter((e) => e.stage === stage).map((e) => ({
    id: e.id,
    label: e.label,
    description: `${formatCompact(educationTotal(e))} / year, all-in`,
  }));

export const Questionnaire: React.FC<{
  profile: HouseholdProfile;
  patch: Patch;
  step: number;
  setStep: (n: number) => void;
  onComplete: () => void;
  onReset: () => void;
}> = ({ profile, patch, step, setStep, onComplete, onReset }) => {
  const cities = useMemo(() => citiesForState(profile.state), [profile.state]);
  const current = STEPS[step];

  const updateChild = (id: string, changes: Partial<HouseholdProfile['children'][number]>) =>
    patch({ children: profile.children.map((c) => (c.id === id ? { ...c, ...changes } : c)) });

  const next = () => (step === STEPS.length - 1 ? onComplete() : setStep(step + 1));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-slate-900">
            Step {step + 1} of {STEPS.length} · {current.label}
          </p>
          <button onClick={onReset} className="text-xs font-medium text-slate-500 underline hover:text-slate-800">
            Start over
          </button>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={cx(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                i === step ? 'bg-slate-900 text-white' : i < step ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {i < step && <Check className="mr-1 inline h-3 w-3" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        {current.id === 'location' && (
          <StepShell title="Where will this household be based?" blurb="Location is one of the strongest drivers in the model — rent in Lekki and rent in Makurdi are not the same problem.">
            <Field label="Country">
              <select
                className={inputClass}
                value={profile.countryCode}
                onChange={(e) => patch({ countryCode: e.target.value })}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} disabled={!c.available}>
                    {c.name}
                    {c.available ? '' : ' — dataset not yet available'}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="State">
                <select
                  className={inputClass}
                  value={profile.state}
                  onChange={(e) => {
                    const st = e.target.value;
                    const first = citiesForState(st)[0];
                    patch({ state: st, cityId: first ? first.id : 'other-urban' });
                  }}
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="City / area">
                <select className={inputClass} value={profile.cityId} onChange={(e) => patch({ cityId: e.target.value })}>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Settlement type" hint="Applied as a further multiplier on housing and general costs.">
              <OptionGrid
                name="Settlement type"
                columns={3}
                value={profile.settlement}
                onChange={(v) => patch({ settlement: v })}
                options={SETTLEMENT_TYPES.map((s) => ({ id: s.id, label: s.label, description: `×${s.multiplier.toFixed(2)}` }))}
              />
            </Field>
            <Callout tone="info">
              City cost multipliers are <strong>derived modelling assumptions</strong>, not a live listings feed. You can
              override rent with your own figure in the housing step, which materially improves accuracy.
            </Callout>
          </StepShell>
        )}

        {current.id === 'family' && (
          <StepShell title="Household structure" blurb="This is a modelling parameter only. The tool does not comment on the structure you choose.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Number of spouses" hint="Each additional spouse adds food, healthcare, personal and household costs.">
                <NumberInput prefix="" value={profile.spouses} min={0} max={6} onChange={(v) => patch({ spouses: v })} />
              </Field>
              <Field label="Other household dependents" hint="Parents, siblings or others you support in the same household.">
                <NumberInput prefix="" value={profile.otherDependents} min={0} max={12} onChange={(v) => patch({ otherDependents: v })} />
              </Field>
            </div>
            {profile.spouses > 1 && (
              <Toggle
                checked={profile.separateHouseholds}
                onChange={(v) => patch({ separateHouseholds: v })}
                label="Spouses maintain separate households"
                hint="Duplicates housing, utilities and household-running costs per household."
              />
            )}

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">Children ({profile.children.length})</p>
                <button
                  onClick={() => patch({ children: [...profile.children, makeChild(-1)] })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Add a child
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Use a negative age for a child not yet born — for example −3 means &ldquo;planned in three years&rdquo;.
              </p>
              <div className="mt-3 space-y-2.5">
                {profile.children.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No children in this plan. The model handles that fine.
                  </p>
                )}
                {profile.children.map((c, i) => (
                  <div key={c.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <span className="text-sm font-medium text-slate-700">Child {i + 1}</span>
                    <div className="w-28">
                      <label className="block text-[11px] text-slate-500">Age now</label>
                      <NumberInput prefix="" min={-15} max={30} value={c.currentAge} onChange={(v) => updateChild(c.id, { currentAge: v })} />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-600"
                        checked={c.existing}
                        onChange={(e) => updateChild(c.id, { existing: e.target.checked })}
                      />
                      Already in the household
                    </label>
                    <button
                      onClick={() => patch({ children: profile.children.filter((x) => x.id !== c.id) })}
                      aria-label={`Remove child ${i + 1}`}
                      className="ml-auto rounded p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Field label="Planned births to budget maternity for" hint="Used only for the one-time maternity reserve.">
              <NumberInput prefix="" min={0} max={12} value={profile.plannedBirths} onChange={(v) => patch({ plannedBirths: v })} />
            </Field>
          </StepShell>
        )}

        {current.id === 'education' && (
          <StepShell title="Education plans" blurb="Education is usually the second-largest cost in a family plan, and the one most sensitive to inflation because it lands 10–20 years out.">
            {profile.children.length === 0 ? (
              <Callout tone="info">No children are in this plan, so no education costs are modelled.</Callout>
            ) : (
              <div className="space-y-6">
                {profile.children.map((c, i) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Child {i + 1} <span className="font-normal text-slate-500">· age {c.currentAge}</span>
                    </p>
                    <div className="mt-4 space-y-4">
                      <Field label="Primary">
                        <select className={inputClass} value={c.primaryOptionId} onChange={(e) => updateChild(c.id, { primaryOptionId: e.target.value })}>
                          {eduOptions('primary').map((o) => (
                            <option key={o.id} value={o.id}>{o.label} — {o.description}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Secondary">
                        <select className={inputClass} value={c.secondaryOptionId} onChange={(e) => updateChild(c.id, { secondaryOptionId: e.target.value })}>
                          {eduOptions('secondary').map((o) => (
                            <option key={o.id} value={o.id}>{o.label} — {o.description}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Tertiary">
                        <select className={inputClass} value={c.tertiaryOptionId} onChange={(e) => updateChild(c.id, { tertiaryOptionId: e.target.value })}>
                          {eduOptions('tertiary').map((o) => (
                            <option key={o.id} value={o.id}>{o.label} — {o.description}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Callout tone="warning" title="Confidence note">
              There is no single reliable national dataset of Nigerian school fees. These are compiled bands across
              institution types <KindBadge kind="estimated" className="mx-1 align-middle" /> — if you know the actual
              school, its published fee will beat our band every time.
            </Callout>
          </StepShell>
        )}

        {current.id === 'housing' && (
          <StepShell title="Housing" blurb="Expensive does not automatically mean better. What matters is the share of income it consumes.">
            <Field label="Housing status">
              <OptionGrid
                name="Housing status"
                columns={4}
                value={profile.housingStatus}
                onChange={(v) => patch({ housingStatus: v })}
                options={[
                  { id: 'rent', label: 'Renting' },
                  { id: 'own', label: 'Already own' },
                  { id: 'mortgage', label: 'Buying / mortgage' },
                  { id: 'family', label: 'Family property' },
                ]}
              />
            </Field>
            <Field label="Housing standard">
              <OptionGrid
                name="Housing standard"
                columns={2}
                value={profile.housingTier}
                onChange={(v) => patch({ housingTier: v })}
                options={HOUSING_TIERS.map((t) => ({ id: t.id, label: t.label, description: t.description }))}
              />
            </Field>
            <Field label={`Bedrooms: ${profile.bedrooms}`}>
              <Slider label="Bedrooms" min={1} max={6} value={profile.bedrooms} onChange={(v) => patch({ bedrooms: v })} format={(v) => `${v} bedroom${v > 1 ? 's' : ''}`} />
            </Field>
            <Field
              label="Your actual annual rent (optional but recommended)"
              hint="Leave at zero to use the modelled band for your city. Entering a real figure replaces the estimate entirely."
            >
              <NumberInput
                value={profile.customAnnualRent ?? 0}
                onChange={(v) => patch({ customAnnualRent: v > 0 ? v : null })}
                max={500_000_000}
                placeholder="e.g. 1500000"
              />
            </Field>
            {profile.housingStatus === 'mortgage' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Property purchase price">
                  <NumberInput value={profile.propertyPurchasePrice ?? 0} onChange={(v) => patch({ propertyPurchasePrice: v > 0 ? v : null })} max={5_000_000_000} />
                </Field>
                <Field label={`Down payment: ${(profile.mortgageDownPaymentShare * 100).toFixed(0)}%`}>
                  <Slider label="Down payment share" min={5} max={100} value={profile.mortgageDownPaymentShare * 100} onChange={(v) => patch({ mortgageDownPaymentShare: v / 100 })} format={(v) => `${v}%`} />
                </Field>
              </div>
            )}
            <Toggle
              checked={profile.includeHouseSetup}
              onChange={(v) => patch({ includeHouseSetup: v })}
              label="Include initial household setup"
              hint="Furniture, appliances, power backup, kitchen and electronics — scaled to your housing standard."
            />
          </StepShell>
        )}

        {current.id === 'living' && (
          <StepShell title="Lifestyle, healthcare and transport" blurb="The lifestyle tier moves the whole recurring baseline. You can fine-tune individual categories later in the simulator.">
            <Field label="Lifestyle level">
              <OptionGrid
                name="Lifestyle"
                columns={2}
                value={profile.lifestyle}
                onChange={(v) => patch({ lifestyle: v })}
                options={LIFESTYLE_TIERS.map((t) => ({ id: t.id, label: `${t.label} (×${t.factor})`, description: t.blurb }))}
              />
            </Field>
            <Field label="Healthcare cover">
              <OptionGrid
                name="Healthcare"
                columns={3}
                value={profile.healthInsurance}
                onChange={(v) => patch({ healthInsurance: v })}
                options={[
                  { id: 'none', label: 'No insurance', description: 'Everything paid out of pocket' },
                  { id: 'nhia', label: 'NHIA / public scheme', description: 'Lower premium, limited network' },
                  { id: 'private', label: 'Private HMO', description: 'Higher premium, wider network' },
                ]}
              />
            </Field>
            <Field label="Maternity plan" hint="Used for the one-time delivery reserve, per planned birth.">
              <OptionGrid
                name="Maternity"
                columns={3}
                value={profile.maternityPlan}
                onChange={(v) => patch({ maternityPlan: v })}
                options={[
                  { id: 'none', label: 'Not applicable' },
                  { id: 'public', label: 'Public hospital' },
                  { id: 'private', label: 'Private hospital' },
                ]}
              />
            </Field>
            <Field label="Transportation">
              <OptionGrid
                name="Transportation"
                columns={2}
                value={profile.transportId}
                onChange={(v) => patch({ transportId: v })}
                options={TRANSPORT_OPTIONS.map((t) => ({
                  id: t.id,
                  label: t.label,
                  description: `${formatCompact(t.monthlyRunning)}/mo running${t.acquisition ? ` · ${formatCompact(t.acquisition)} to acquire` : ''}`,
                }))}
              />
            </Field>
            {TRANSPORT_OPTIONS.find((t) => t.id === profile.transportId)?.acquisition ? (
              <Toggle
                checked={profile.buyVehicle}
                onChange={(v) => patch({ buyVehicle: v })}
                label="Include vehicle purchase in the one-time target"
                hint="Turn this off if you already own the vehicle."
              />
            ) : null}
            <Toggle checked={profile.domesticHelp} onChange={(v) => patch({ domesticHelp: v })} label="Domestic help" hint="Adds a monthly cost scaled to your city." />
            <Field label="Religious / community obligations per month (optional)" hint="Entirely your choice. Nothing is assumed unless you enter a figure.">
              <NumberInput value={profile.communityObligationsMonthly} onChange={(v) => patch({ communityObligationsMonthly: v })} />
            </Field>
          </StepShell>
        )}

        {current.id === 'onetime' && (
          <StepShell title="Getting married is a separate cost from staying married" blurb="A large wedding is not a prerequisite for a financially healthy marriage. We keep the two budgets apart on purpose.">
            <Field label="Wedding scale">
              <OptionGrid
                name="Wedding"
                columns={2}
                value={profile.weddingTierId}
                onChange={(v) => patch({ weddingTierId: v, customWeddingBudget: null })}
                options={WEDDING_TIERS.map((w) => ({ id: w.id, label: w.label, description: `${formatCompact(w.total)} · ${w.guests}` }))}
              />
            </Field>
            <Field label="Or set your own wedding budget" hint="Leave at zero to use the tier above. Enter any figure — including zero-cost registry options — to override it.">
              <NumberInput value={profile.customWeddingBudget ?? 0} onChange={(v) => patch({ customWeddingBudget: v > 0 ? v : null })} max={1_000_000_000} />
            </Field>
            <Field label={`Emergency reserve: ${profile.emergencyFundMonths} months of essential expenses`} hint="Standard guidance is 3–6 months. Where income is irregular, the upper end is more resilient.">
              <Slider label="Emergency fund months" min={1} max={24} value={profile.emergencyFundMonths} onChange={(v) => patch({ emergencyFundMonths: v })} format={(v) => `${v} months`} />
            </Field>
          </StepShell>
        )}

        {current.id === 'finances' && (
          <StepShell title="Your current financial position" blurb="Only the numbers needed for the calculation. We never ask for BVN, NIN, account numbers, card details or passwords, and nothing here leaves your browser.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your monthly income (net)"><NumberInput value={profile.monthlyIncome} onChange={(v) => patch({ monthlyIncome: v })} /></Field>
              <Field label="Spouse / partner monthly income"><NumberInput value={profile.spouseMonthlyIncome} onChange={(v) => patch({ spouseMonthlyIncome: v })} /></Field>
              <Field label="Other monthly income" hint="Business, rent, remittances."><NumberInput value={profile.otherMonthlyIncome} onChange={(v) => patch({ otherMonthlyIncome: v })} /></Field>
              <Field label="Cash savings"><NumberInput value={profile.savings} onChange={(v) => patch({ savings: v })} max={100_000_000_000} /></Field>
              <Field label="Investments" hint="Counted at 60% toward liquid reserves, since not all of it can be reached quickly."><NumberInput value={profile.investments} onChange={(v) => patch({ investments: v })} max={100_000_000_000} /></Field>
              <Field label="Other assets" hint="Recorded for context; not counted as liquid."><NumberInput value={profile.otherAssets} onChange={(v) => patch({ otherAssets: v })} max={100_000_000_000} /></Field>
              <Field label="Total outstanding debt"><NumberInput value={profile.debtTotal} onChange={(v) => patch({ debtTotal: v })} max={100_000_000_000} /></Field>
              <Field label="Monthly debt repayment"><NumberInput value={profile.monthlyDebtRepayment} onChange={(v) => patch({ monthlyDebtRepayment: v })} /></Field>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">Projection assumptions</p>
              <div className="mt-4 space-y-5">
                <Field label="Inflation scenario">
                  <OptionGrid
                    name="Inflation scenario"
                    columns={3}
                    value={profile.inflationScenario}
                    onChange={(v) => patch({ inflationScenario: v, customInflationRate: null })}
                    options={INFLATION_SCENARIOS.map((s) => ({ id: s.id, label: `${s.label} (${s.rate}%)`, description: s.description }))}
                  />
                </Field>
                <Slider
                  label="Assumed annual income growth"
                  min={0}
                  max={30}
                  value={profile.incomeGrowthRate}
                  onChange={(v) => patch({ incomeGrowthRate: v })}
                  format={(v) => `${v}% / year`}
                />
                <p className="text-xs leading-relaxed text-slate-500">
                  The default of 10% is deliberately below baseline inflation, because nominal salary growth in Nigeria
                  has frequently lagged headline CPI. Raising it makes the plan look easier — do that only if you have a
                  concrete reason.
                </p>
              </div>
            </div>
          </StepShell>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {step === STEPS.length - 1 ? 'See my plan' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-500">
        Your answers autosave to this browser only. Nothing is transmitted unless you explicitly save a scenario.
      </p>
    </div>
  );
};

export default Questionnaire;
