import React, { useState } from 'react';
import { FolderOpen, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cx, Card, inputClass } from './ui';
import { loadScenarioRemote, type SavedScenarioMeta } from '@/lib/planStore';
import { DATASET_VERSION, ASSUMPTION_VERSION, ENGINE_VERSION } from '@/data/assumptions';
import type { HouseholdProfile } from '@/lib/engine/types';

export type ScenarioLoadHandler = (profile: HouseholdProfile, meta: SavedScenarioMeta) => void;

/** Shared submit logic so the header and results forms cannot drift apart. */
const useScenarioLoad = (onLoaded: ScenarioLoadHandler, onDone?: () => void) => {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await loadScenarioRemote(code);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      onLoaded(res.profile, res.meta);
      setCode('');
      onDone?.();
    } finally {
      setBusy(false);
    }
  };

  return { code, setCode, busy, error, submit };
};

/** Compact share-code field used inside the header popover and mobile menu. */
export const ShareCodeForm: React.FC<{
  onLoaded: ScenarioLoadHandler;
  onDone?: () => void;
  dark?: boolean;
}> = ({ onLoaded, onDone, dark }) => {
  const { code, setCode, busy, error, submit } = useScenarioLoad(onLoaded, onDone);
  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="share-code-compact" className={cx('block text-xs font-medium', dark ? 'text-slate-300' : 'text-slate-700')}>
        Share code
      </label>
      <div className="flex gap-2">
        <input
          id="share-code-compact"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. 7KD2QP"
          maxLength={12}
          autoComplete="off"
          spellCheck={false}
          aria-label="Saved scenario share code"
          className={cx(inputClass, 'py-2 font-mono uppercase tracking-widest', dark && 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500')}
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="shrink-0 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
        </button>
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-rose-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <p className={cx('text-[11px] leading-relaxed', dark ? 'text-slate-500' : 'text-slate-500')}>
        Loads the anonymous inputs saved with that code and replaces the plan currently in this browser.
      </p>
    </form>
  );
};

/** Header entry point: a button that reveals the share-code field. */
export const HeaderScenarioLoader: React.FC<{ onLoaded: ScenarioLoadHandler }> = ({ onLoaded }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Load a saved scenario"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <FolderOpen className="h-4 w-4" />
        <span className="hidden xl:inline">Load scenario</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Load a saved scenario"
            className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          >
            <p className="mb-2 text-sm font-semibold text-slate-900">Load a saved scenario</p>
            <ShareCodeForm onLoaded={onLoaded} onDone={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

/** Fuller panel used on the results page. */
export const LoadScenarioPanel: React.FC<{ onLoaded: ScenarioLoadHandler }> = ({ onLoaded }) => (
  <Card className="p-5">
    <div className="flex items-start gap-3">
      <FolderOpen className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-slate-900">Load a saved scenario</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Enter the share code from a plan you saved earlier. We will restore the inputs and show you which dataset,
          assumption and engine versions it was originally calculated with.
        </p>
        <div className="mt-3 max-w-sm">
          <ShareCodeForm onLoaded={onLoaded} />
        </div>
      </div>
    </div>
  </Card>
);

const VersionRow: React.FC<{ label: string; original: string; current: string }> = ({ label, original, current }) => {
  const changed = original !== current;
  return (
    <tr className={cx(changed && 'bg-amber-50/60')}>
      <th scope="row" className="py-2 pr-3 text-left font-medium text-slate-700">{label}</th>
      <td className="py-2 pr-3 font-mono text-xs text-slate-700">{original}</td>
      <td className="py-2 pr-3 font-mono text-xs text-slate-700">{current}</td>
      <td className="py-2 text-right">
        {changed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
            <AlertTriangle className="h-3 w-3" /> changed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> unchanged
          </span>
        )}
      </td>
    </tr>
  );
};

/**
 * Shows the version stamps a loaded scenario was calculated with next to the
 * versions in use today, so a user can see whether the underlying data moved.
 */
export const ScenarioVersionBanner: React.FC<{ meta: SavedScenarioMeta; onDismiss: () => void }> = ({ meta, onDismiss }) => {
  const changed =
    meta.datasetVersion !== DATASET_VERSION ||
    meta.assumptionVersion !== ASSUMPTION_VERSION ||
    meta.engineVersion !== ENGINE_VERSION;

  return (
    <Card className={cx('p-5', changed ? 'border-amber-300 bg-amber-50/40' : 'border-emerald-300 bg-emerald-50/40')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">
            Loaded scenario <span className="font-mono">{meta.shareCode}</span>
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            {meta.label} · saved {new Date(meta.savedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <caption className="sr-only">Versions used when this scenario was saved, compared with current versions</caption>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="pb-2 font-medium">Version</th>
              <th className="pb-2 font-medium">When saved</th>
              <th className="pb-2 font-medium">Now</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            <VersionRow label="Dataset" original={meta.datasetVersion} current={DATASET_VERSION} />
            <VersionRow label="Assumptions" original={meta.assumptionVersion} current={ASSUMPTION_VERSION} />
            <VersionRow label="Engine" original={meta.engineVersion} current={ENGINE_VERSION} />
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">
        {changed
          ? 'The figures shown below have been recalculated with today’s data and engine, so they may differ from the numbers you saw when this scenario was saved. The inputs themselves are exactly as you saved them.'
          : 'Nothing in the underlying data, assumptions or engine has changed since this scenario was saved, so the figures below should match what you saw then.'}
      </p>
    </Card>
  );
};
