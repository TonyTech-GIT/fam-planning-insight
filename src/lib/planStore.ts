import { supabase } from '@/lib/supabase';
import { coerceProfile } from '@/lib/engine/profile';
import type { HouseholdProfile, PlanResult } from '@/lib/engine/types';

const KEY = 'fp.profile.v1';
const STEP_KEY = 'fp.step.v1';

/** Autosave — inputs never leave the browser unless the user explicitly saves. */
export const loadProfile = (): HouseholdProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return coerceProfile(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const saveProfileLocal = (p: HouseholdProfile) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — the app still works, it just will not autosave */
  }
};

export const clearProfileLocal = () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(STEP_KEY);
  } catch {
    /* ignore */
  }
};

export const loadStep = (): number => {
  try {
    return Number(localStorage.getItem(STEP_KEY)) || 0;
  } catch {
    return 0;
  }
};

export const saveStep = (n: number) => {
  try {
    localStorage.setItem(STEP_KEY, String(n));
  } catch {
    /* ignore */
  }
};

const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

/**
 * Saves an ANONYMOUS scenario: inputs + a summary of results + the version
 * stamps required to reproduce it later. No name, email or identifier.
 */
export const saveScenarioRemote = async (
  label: string,
  profile: HouseholdProfile,
  result: PlanResult,
): Promise<{ shareCode: string } | { error: string }> => {
  try {
    const shareCode = code();
    const { error } = await supabase.from('fp_scenarios').insert({
      share_code: shareCode,
      label: label.slice(0, 80) || 'Untitled scenario',
      profile: profile as unknown as Record<string, unknown>,
      result_summary: {
        monthly: result.monthly.range,
        annual: result.annual.range,
        oneOff: result.oneOff.range,
        emergencyFund: result.emergencyFund,
        requiredIncome: result.requiredIncome,
        eighteenYear: result.projection.total18Year,
        readiness: result.readiness.score,
        band: result.readiness.band,
        city: result.meta.cityLabel,
      },
      assumptions: result.meta.assumptions as unknown as Record<string, unknown>,
      dataset_version: result.meta.datasetVersion,
      assumption_version: result.meta.assumptionVersion,
      engine_version: result.meta.engineVersion,
    });
    if (error) return { error: 'Could not save this scenario right now.' };
    return { shareCode };
  } catch {
    return { error: 'Could not save this scenario right now.' };
  }
};

/** Version stamps recorded when a scenario was originally calculated. */
export interface SavedScenarioMeta {
  shareCode: string;
  label: string;
  datasetVersion: string;
  assumptionVersion: string;
  engineVersion: string;
  savedAt: string;
  resultSummary: Record<string, unknown> | null;
}

export interface LoadedScenario {
  profile: HouseholdProfile;
  meta: SavedScenarioMeta;
}

/**
 * Loads an anonymous saved scenario by share code. Returns both the inputs and
 * the version stamps the plan was originally calculated with, so the UI can
 * show whether the underlying data has moved since.
 */
export const loadScenarioRemote = async (
  shareCode: string,
): Promise<LoadedScenario | { error: string }> => {
  const clean = shareCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(clean)) {
    return { error: 'That does not look like a share code. Codes are 4–12 letters and numbers.' };
  }
  try {
    const { data, error } = await supabase
      .from('fp_scenarios')
      .select('share_code, label, profile, result_summary, dataset_version, assumption_version, engine_version, created_at')
      .eq('share_code', clean)
      .maybeSingle();
    if (error) return { error: 'Could not reach the scenario store right now.' };
    if (!data) return { error: `No saved scenario found for code ${clean}.` };
    return {
      profile: coerceProfile(data.profile),
      meta: {
        shareCode: data.share_code,
        label: data.label ?? 'Untitled scenario',
        datasetVersion: data.dataset_version ?? 'unknown',
        assumptionVersion: data.assumption_version ?? 'unknown',
        engineVersion: data.engine_version ?? 'unknown',
        savedAt: data.created_at,
        resultSummary: (data.result_summary as Record<string, unknown>) ?? null,
      },
    };
  } catch {
    return { error: 'Could not reach the scenario store right now.' };
  }
};


export interface OverrideRow {
  key: string;
  label: string;
  value: number;
  unit: string;
  kind: string;
  source_id: string;
  note: string;
  updated_at: string;
  updated_by: string;
}

/** Published dataset overrides (admin-maintained) — read by the transparency page. */
export const loadOverrides = async (): Promise<OverrideRow[]> => {
  try {
    const { data, error } = await supabase
      .from('fp_dataset_overrides')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error || !data) return [];
    return data as OverrideRow[];
  } catch {
    return [];
  }
};
