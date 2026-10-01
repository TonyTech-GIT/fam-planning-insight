import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header, Footer, type ViewId } from '@/components/fp/Chrome';
import Landing from '@/components/fp/Landing';
import Questionnaire, { STEPS } from '@/components/fp/Questionnaire';
import Results from '@/components/fp/Results';
import WhatIf from '@/components/fp/WhatIf';
import Compare from '@/components/fp/Compare';
import DataPage from '@/components/fp/DataPage';
import Learn from '@/components/fp/Learn';
import Admin from '@/components/fp/Admin';
import { LoadScenarioPanel } from '@/components/fp/LoadScenario';
import { DEFAULT_PROFILE } from '@/lib/engine/profile';
import { calculatePlan } from '@/lib/engine/calculators';
import {
  loadProfile,
  saveProfileLocal,
  clearProfileLocal,
  loadStep,
  saveStep,
  type SavedScenarioMeta,
} from '@/lib/planStore';
import type { HouseholdProfile } from '@/lib/engine/types';

const AppLayout: React.FC = () => {
  const [view, setView] = useState<ViewId>('home');
  const [profile, setProfile] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [step, setStep] = useState(0);
  const [hasPlan, setHasPlan] = useState(false);
  const [loadedMeta, setLoadedMeta] = useState<SavedScenarioMeta | null>(null);

  /* restore autosaved inputs */
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setHasPlan(true);
      setStep(Math.min(loadStep(), STEPS.length - 1));
    }
  }, []);

  /* autosave */
  useEffect(() => {
    if (hasPlan) saveProfileLocal(profile);
  }, [profile, hasPlan]);

  useEffect(() => {
    saveStep(step);
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const patch = useCallback((p: Partial<HouseholdProfile>) => {
    setProfile((prev) => ({ ...prev, ...p }));
    setHasPlan(true);
  }, []);

  /** Restores an anonymous saved scenario and records the versions it was calculated with. */
  const handleLoadScenario = useCallback((loaded: HouseholdProfile, meta: SavedScenarioMeta) => {
    setProfile(loaded);
    setHasPlan(true);
    saveProfileLocal(loaded);
    setLoadedMeta(meta);
    setStep(0);
    setView('results');
  }, []);

  const result = useMemo(() => {
    try {
      return calculatePlan(profile);
    } catch {
      return calculatePlan(DEFAULT_PROFILE);
    }
  }, [profile]);

  const navigate = (v: ViewId) => {
    if (v === 'results' && !hasPlan) {
      setView('plan');
      return;
    }
    setView(v);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <Header view={view} onNavigate={navigate} hasPlan={hasPlan} onLoadScenario={handleLoadScenario} />

      <main id="main" className="flex-1">
        {view === 'home' && <Landing onNavigate={navigate} />}

        {view === 'plan' && (
          <Questionnaire
            profile={profile}
            patch={patch}
            step={step}
            setStep={setStep}
            onComplete={() => {
              setHasPlan(true);
              saveProfileLocal(profile);
              setView('results');
            }}
            onReset={() => {
              clearProfileLocal();
              setProfile(DEFAULT_PROFILE);
              setStep(0);
              setHasPlan(false);
              setLoadedMeta(null);
            }}
          />
        )}

        {view === 'results' &&
          (hasPlan ? (
            <Results
              result={result}
              profile={profile}
              onNavigate={navigate}
              onLoadScenario={handleLoadScenario}
              loadedMeta={loadedMeta}
              onDismissLoaded={() => setLoadedMeta(null)}
            />
          ) : (
            <div className="mx-auto max-w-xl px-4 py-20 text-center">
              <h1 className="text-xl font-semibold text-slate-900">No plan yet</h1>
              <p className="mt-2 text-sm text-slate-600">
                Build a plan first — it takes about five minutes. If you saved one earlier, load it with its share code.
              </p>
              <button
                onClick={() => setView('plan')}
                className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Start planning
              </button>
              <div className="mt-8 text-left">
                <LoadScenarioPanel onLoaded={handleLoadScenario} />
              </div>
            </div>
          ))}

        {view === 'simulator' && (
          <WhatIf
            profile={profile}
            onApply={(p) => {
              setProfile(p);
              setHasPlan(true);
              saveProfileLocal(p);
            }}
            onNavigate={navigate}
          />
        )}

        {view === 'compare' && <Compare profile={profile} hasPlan={hasPlan} onNavigate={navigate} />}
        {view === 'data' && <DataPage />}
        {view === 'learn' && <Learn onNavigate={navigate} />}
        {view === 'admin' && <Admin />}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
};

export default AppLayout;
