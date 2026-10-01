import React, { useState } from 'react';
import { Menu, X, ShieldCheck, LineChart } from 'lucide-react';
import { cx, inputClass } from './ui';
import { DISCLAIMER_SHORT } from '@/data/content';
import { DATASET_VERSION, ENGINE_VERSION } from '@/data/assumptions';
import { HeaderScenarioLoader, ShareCodeForm, type ScenarioLoadHandler } from './LoadScenario';

export type ViewId = 'home' | 'plan' | 'results' | 'simulator' | 'compare' | 'data' | 'learn' | 'admin';

export const NAV: { id: ViewId; label: string }[] = [
  { id: 'home', label: 'Overview' },
  { id: 'plan', label: 'Build my plan' },
  { id: 'results', label: 'Results' },
  { id: 'simulator', label: 'What-if' },
  { id: 'compare', label: 'Compare' },
  { id: 'data', label: 'Data & methods' },
  { id: 'learn', label: 'Learn' },
];

export const Header: React.FC<{
  view: ViewId;
  onNavigate: (v: ViewId) => void;
  hasPlan: boolean;
  onLoadScenario: ScenarioLoadHandler;
}> = ({ view, onNavigate, hasPlan, onLoadScenario }) => {
  const [open, setOpen] = useState(false);
  const go = (v: ViewId) => {
    onNavigate(v);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => go('home')}
          className="flex items-center gap-2.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <LineChart className="h-5 w-5 text-emerald-400" />
          </span>
          <span className="text-left">
            <span className="block text-[15px] font-semibold leading-tight text-slate-900">Household Horizon</span>
            <span className="block text-[11px] leading-tight text-slate-500">Family finance planning · Nigeria</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              disabled={n.id === 'results' && !hasPlan}
              className={cx(
                'rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                n.id === 'results' && !hasPlan && 'cursor-not-allowed opacity-40',
                view === n.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <HeaderScenarioLoader onLoaded={onLoadScenario} />
          </div>
          <button
            onClick={() => go('plan')}
            className="hidden rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:block"
          >
            Start planning
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3" aria-label="Mobile">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                disabled={n.id === 'results' && !hasPlan}
                className={cx(
                  'block w-full rounded-md px-3 py-3 text-left text-[15px] font-medium',
                  n.id === 'results' && !hasPlan && 'opacity-40',
                  view === n.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {n.label}
              </button>
            ))}
            <div className="mt-3 border-t border-slate-200 pt-4">
              <p className="mb-2 text-sm font-semibold text-slate-900">Load a saved scenario</p>
              <ShareCodeForm onLoaded={onLoadScenario} onDone={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}

    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (v: ViewId) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('https://famous.ai/api/crm/6aa06e84bd8dc67e9bf06929/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          sms_opt_in: smsOptIn === true,
          source: 'footer-signup',
          tags: ['newsletter', 'family-finance', 'data-updates'],
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('done');
      setMessage('You are on the list. We will write when datasets or methodology change.');
      setEmail('');
      setName('');
      setPhone('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again in a moment.');
    }
  };

  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                <LineChart className="h-5 w-5 text-emerald-400" />
              </span>
              <span className="text-[15px] font-semibold text-white">Household Horizon</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              A financial reality check for the family you are planning to build. Transparent assumptions, versioned
              datasets, and a calculation engine you can inspect line by line.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs leading-relaxed text-slate-400">
                We never ask for BVN, NIN, bank credentials or card details. The calculator runs in your browser and
                works without an account.
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-4">
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white">Product</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {NAV.filter((n) => n.id !== 'results').map((n) => (
                  <li key={n.id}>
                    <button onClick={() => onNavigate(n.id)} className="text-slate-400 transition hover:text-white">
                      {n.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white">Transparency</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><button onClick={() => onNavigate('data')} className="text-slate-400 transition hover:text-white">Where our numbers come from</button></li>
                <li><button onClick={() => onNavigate('data')} className="text-slate-400 transition hover:text-white">Assumption register</button></li>
                <li><button onClick={() => onNavigate('data')} className="text-slate-400 transition hover:text-white">Engine test results</button></li>
                <li><button onClick={() => onNavigate('learn')} className="text-slate-400 transition hover:text-white">Methodology notes</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white">Governance</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><button onClick={() => onNavigate('admin')} className="text-slate-400 transition hover:text-white">Data administration</button></li>
                <li><span className="text-slate-500">Dataset {DATASET_VERSION}</span></li>
                <li><span className="text-slate-500">Engine {ENGINE_VERSION}</span></li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white">Dataset update notices</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Get a note when inflation assumptions or cost datasets are revised.
            </p>
            <form onSubmit={submit} className="mt-4 space-y-2.5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                aria-label="Name (optional)"
                className={cx(inputClass, 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500')}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className={cx(inputClass, 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500')}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                aria-label="Phone number (optional)"
                className={cx(inputClass, 'border-slate-700 bg-slate-950 text-white placeholder:text-slate-500')}
              />
              <label className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-950 accent-emerald-500"
                />
                <span>Text me updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
              </label>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
              </button>
              {message && (
                <p
                  role="status"
                  className={cx('text-xs', status === 'error' ? 'text-rose-400' : 'text-emerald-400')}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">{DISCLAIMER_SHORT}</p>
          <p className="mt-3 text-xs text-slate-600">
            © {new Date().getFullYear()} Household Horizon. Estimates only — not financial advice, not a marriage
            eligibility test.
          </p>
        </div>
      </div>
    </footer>
  );
};
