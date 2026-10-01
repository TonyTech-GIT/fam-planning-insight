import React, { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Card, SectionHeading, Callout } from './ui';
import { ARTICLES, DISCLAIMER_LONG } from '@/data/content';
import type { ViewId } from './Chrome';

export const Learn: React.FC<{ onNavigate: (v: ViewId) => void }> = ({ onNavigate }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const article = ARTICLES.find((a) => a.id === openId);

  if (article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </button>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{article.title}</h1>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" /> {article.readMinutes} min read
        </p>
        <div className="mt-6 space-y-4">
          {article.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-slate-700">{p}</p>
          ))}
        </div>
        <div className="mt-8">
          <Callout tone="info">
            Figures quoted in these notes come from the same data layer the calculator uses. See{' '}
            <button onClick={() => onNavigate('data')} className="font-semibold underline">
              Data &amp; methods
            </button>{' '}
            for the sources and confidence levels behind them.
          </Callout>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Learn"
        title="The ideas behind the numbers"
        blurb="Short, data-grounded notes on how inflation, education choices and household structure interact. No motivational content, no wealth shaming."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a) => (
          <Card key={a.id} className="flex flex-col p-5 transition hover:shadow-sm">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-700">
              <Clock className="h-3 w-3" /> {a.readMinutes} min
            </p>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug text-slate-900">{a.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{a.summary}</p>
            <button
              onClick={() => setOpenId(a.id)}
              className="mt-4 self-start text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Read note
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Card className="border-amber-200 bg-amber-50/60 p-6">
          <h2 className="text-[15px] font-semibold text-amber-900">What this platform will never do</h2>
          <div className="mt-3 space-y-3">
            {DISCLAIMER_LONG.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-amber-900/90">{p}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Learn;
