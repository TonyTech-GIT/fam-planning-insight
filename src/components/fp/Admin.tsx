import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card, Field, NumberInput, Callout, inputClass, cx } from './ui';
import { supabase } from '@/lib/supabase';
import { DATA_SOURCES } from '@/data/sources';
import { formatCompact } from '@/lib/engine/money';

interface OverrideRow {
  key: string; label: string; value: number; unit: string; kind: string;
  source_id: string; note: string; active: boolean; updated_at: string; updated_by: string;
}
interface AuditRow {
  id: number; actor_email: string; entity: string; entity_key: string;
  previous_value: Record<string, unknown> | null; new_value: Record<string, unknown> | null;
  reason: string; created_at: string;
}

export const Admin: React.FC = () => {
  const [session, setSession] = useState<{ email?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<{ isAdmin: boolean; canClaim: boolean } | null>(null);
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [form, setForm] = useState({ key: '', label: '', value: 0, unit: '₦ / month', kind: 'estimated', sourceId: 'internal-model', note: '', reason: '' });
  const [message, setMessage] = useState<{ tone: 'warning' | 'positive'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? { email: data.session.user.email ?? '' } : null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ? { email: s.user.email ?? '' } : null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('fp-admin-data', { body });
    if (error) throw new Error('request failed');
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const refresh = async () => {
    try {
      const s = await call({ action: 'status' });
      setStatus({ isAdmin: !!s.isAdmin, canClaim: !!s.canClaim });
      if (s.isAdmin) {
        const d = await call({ action: 'list' });
        setOverrides(d.overrides ?? []);
        setAudit(d.audit ?? []);
      }
    } catch (e) {
      setMessage({ tone: 'warning', text: (e as Error).message });
    }
  };

  useEffect(() => {
    if (session) refresh();
    else setStatus(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      const creds = { email: email.trim(), password };
      const { error } =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword(creds)
          : await supabase.auth.signUp(creds);

      if (error) setAuthError(error.message);
      else { setEmail(''); setPassword(''); }
    } finally {
      setBusy(false);
    }
  };

  const submitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await call({ action: 'upsert', ...form, active: true });
      setMessage({ tone: 'positive', text: `Saved ${form.key}. The change is recorded in the audit log with your identity, the previous value and your stated reason.` });
      setForm({ ...form, key: '', label: '', value: 0, note: '', reason: '' });
      refresh();
    } catch (err) {
      setMessage({ tone: 'warning', text: (err as Error).message });
    }
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <Card className="p-6">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-slate-500" />
            <h1 className="text-lg font-semibold text-slate-900">Data administration</h1>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Restricted to dataset maintainers. Public visitors never need an account — the calculator works anonymously.
          </p>
          <form onSubmit={authenticate} className="mt-5 space-y-4">
            <Field label="Email" htmlFor="admin-email">
              <input id="admin-email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor="admin-pass" hint="Minimum 8 characters. Hashed and managed by Supabase Auth; never stored by this application.">
              <input id="admin-pass" type="password" required minLength={8} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </Field>
            {authError && <p className="text-sm text-rose-600">{authError}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create maintainer account'}
            </button>
            <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="w-full text-center text-xs text-slate-500 underline">
              {mode === 'signin' ? 'Need a maintainer account?' : 'Already have an account? Sign in'}
            </button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data administration</h1>
          <p className="mt-1 text-sm text-slate-600">Signed in as {session.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-5">
          <Callout tone={message.tone}>{message.text}</Callout>
        </div>
      )}

      {status && !status.isAdmin && (
        <div className="mt-6">
          <Card className="p-6">
            {status.canClaim ? (
              <>
                <h2 className="text-[15px] font-semibold text-slate-900">No administrator exists yet</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The first authenticated user may claim the administrator role. Every subsequent request is checked
                  server-side against the admin table — the client cannot grant itself access.
                </p>
                <button
                  onClick={async () => { try { await call({ action: 'claim' }); refresh(); } catch (e) { setMessage({ tone: 'warning', text: (e as Error).message }); } }}
                  className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Claim administrator role
                </button>
              </>
            ) : (
              <Callout tone="warning" title="Administrator access required">
                This account is authenticated but is not a dataset maintainer. Ask an existing administrator to grant
                access.
              </Callout>
            )}
          </Card>
        </div>
      )}

      {status?.isAdmin && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <h2 className="text-[15px] font-semibold text-slate-900">Publish a dataset value</h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Values are validated server-side (finite, non-negative, bounded) and every write records your identity,
                the previous value, the new value, a timestamp and your stated reason.
              </p>
              <form onSubmit={submitOverride} className="mt-4 space-y-4">
                <Field label="Dataset key" hint="Letters, numbers, dot, dash, underscore. e.g. foodPerAdult">
                  <input required className={inputClass} value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} pattern="[a-zA-Z0-9_.\-]{2,64}" />
                </Field>
                <Field label="Label">
                  <input required className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={160} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Value">
                    <NumberInput prefix="" value={form.value} onChange={(v) => setForm({ ...form, value: v })} max={1e12} />
                  </Field>
                  <Field label="Unit">
                    <input className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} maxLength={32} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Provenance">
                    <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                      <option value="verified">Verified</option>
                      <option value="derived">Derived</option>
                      <option value="estimated">Estimated</option>
                    </select>
                  </Field>
                  <Field label="Source">
                    <select className={inputClass} value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })}>
                      {DATA_SOURCES.map((s) => (
                        <option key={s.id} value={s.id}>{s.organization}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Methodology note">
                  <textarea className={cx(inputClass, 'min-h-[70px]')} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} />
                </Field>
                <Field label="Reason for this change (required)" hint="Stored permanently in the audit log.">
                  <textarea required minLength={4} className={cx(inputClass, 'min-h-[60px]')} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={400} />
                </Field>
                <button type="submit" className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Publish value
                </button>
              </form>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-slate-900">Published values &amp; freshness</h2>
              {overrides.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nothing published yet.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead><tr className="text-left text-xs text-slate-500"><th className="pb-2">Key</th><th className="pb-2">Value</th><th className="pb-2">Kind</th><th className="pb-2">Updated</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {overrides.map((o) => {
                        const days = Math.floor((Date.now() - new Date(o.updated_at).getTime()) / 86_400_000);
                        return (
                          <tr key={o.key}>
                            <td className="py-2 font-mono text-xs text-slate-700">{o.key}<span className="block font-sans text-slate-500">{o.label}</span></td>
                            <td className="py-2 font-mono text-slate-900">{formatCompact(Number(o.value))}</td>
                            <td className="py-2 text-xs text-slate-600">{o.kind}</td>
                            <td className={cx('py-2 text-xs', days > 180 ? 'text-amber-700' : 'text-slate-500')}>
                              {days}d ago{days > 180 ? ' · stale' : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-slate-900">Audit log</h2>
              <p className="mt-1 text-xs text-slate-500">Append-only. Timestamp, actor, previous value, new value and reason.</p>
              {audit.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No changes recorded yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {audit.map((a) => (
                    <li key={a.id} className="py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-mono text-xs text-slate-700">{a.entity}.{a.entity_key}</span>
                        <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {a.actor_email} · {a.previous_value ? `${JSON.stringify(a.previous_value)} → ` : 'created '}
                        {JSON.stringify(a.new_value)}
                      </p>
                      <p className="mt-1 text-xs italic text-slate-500">{a.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
