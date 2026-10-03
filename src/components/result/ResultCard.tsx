// src/components/result/ResultCard.tsx
// Verdict banner (icon + text + colour) with a score ring, scam type,
// click-to-explain highlights, red flags, numbered next steps, quick actions
// (share to family via WhatsApp, check another) and the disclaimer.
// Highlighted text renders as plain nodes via highlightService.
import { useState } from 'react';
import { AlertTriangle, ListChecks, MessageCircle, RotateCcw, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { AnalysisResult, RiskLevel } from '../../types';
import { useI18n } from '../../context/I18nProvider';
import { Icon } from '../common';
import { buildSegments } from '../../services/highlightService';

export interface ResultCardProps {
  result: AnalysisResult;
  analysedText: string;
  onReset?: () => void;
}

const RISK: Record<RiskLevel, { key: string; icon: typeof ShieldCheck; band: string; stroke: string; mark: string }> = {
  SAFE: { key: 'risk.safe', icon: ShieldCheck, band: 'from-emerald-600 to-risk-safe', stroke: '#16A34A', mark: 'bg-risk-safe/20 text-emerald-800' },
  SUSPICIOUS: { key: 'risk.suspicious', icon: ShieldAlert, band: 'from-amber-600 to-risk-suspicious', stroke: '#F59E0B', mark: 'bg-risk-suspicious/25 text-amber-900' },
  'LIKELY SCAM': { key: 'risk.scam', icon: ShieldX, band: 'from-red-700 to-risk-scam', stroke: '#DC2626', mark: 'bg-risk-scam/15 text-red-800' },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <span className="text-2xl font-extrabold text-white">{score}</span>
        <span className="sr-only">/100</span>
      </div>
      <span className="sr-only" style={{ color }} />
    </div>
  );
}

export function ResultCard({ result, analysedText, onReset }: ResultCardProps) {
  const { t, language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);
  const [open, setOpen] = useState<number | null>(null);
  const meta = RISK[result.riskLevel];
  const segments = buildSegments(analysedText, result.highlights);
  const hasHighlights = segments.some((s) => s.highlighted);

  return (
    <article aria-label={t('result.title')} className="mt-6 animate-pop-in overflow-hidden rounded-2xl bg-white shadow-soft">
      {/* Verdict banner */}
      <header className={`flex items-center gap-4 bg-gradient-to-br ${meta.band} p-5 text-white`}>
        <ScoreRing score={result.riskScore} color={meta.stroke} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{t('result.riskBadgeLabel')}</p>
          <p className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
            <Icon icon={meta.icon} size={28} />
            {t(meta.key)}
          </p>
          <p className="mt-0.5 text-sm text-white/85">
            {t('result.scoreLabel')}: {t('result.scoreOutOf', { score: result.riskScore })}
          </p>
          {result.scamType ? (
            <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{result.scamType}</span>
          ) : null}
        </div>
      </header>

      <div className="space-y-6 p-5">
        {/* Highlighted message */}
        {analysedText ? (
          <section>
            {hasHighlights && <p className="mb-2 text-sm text-navy/60">{t('result.highlightHint')}</p>}
            <p className="rounded-xl bg-surface/70 p-4 text-base leading-relaxed text-navy">
              {segments.map((seg, i) =>
                seg.highlighted ? (
                  <button
                    key={i}
                    type="button"
                    aria-expanded={open === i}
                    onClick={() => setOpen(open === i ? null : i)}
                    className={`rounded px-0.5 font-semibold underline decoration-dotted underline-offset-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${meta.mark} ${open === i ? 'ring-2 ring-navy/30' : ''}`}
                  >
                    {seg.text}
                  </button>
                ) : (
                  <span key={i}>{seg.text}</span>
                ),
              )}
            </p>
            {open !== null && segments[open]?.reason ? (
              <p className="mt-2 flex animate-fade-in gap-2 rounded-xl border border-accent/25 bg-accent/5 p-3 text-sm text-navy">
                <Icon icon={AlertTriangle} size={18} className="shrink-0 text-accent" />
                {segments[open].reason}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Red flags */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-navy">
            <Icon icon={AlertTriangle} className="text-risk-suspicious" />
            {t('result.whyTitle')}
            {result.redFlags.length > 0 && (
              <span className="rounded-full bg-navy/10 px-2 text-sm font-semibold">{result.redFlags.length}</span>
            )}
          </h3>
          {result.redFlags.length === 0 ? (
            <p className="mt-2 text-base text-navy/70">{t('result.noRedFlags')}</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.redFlags.map((f, i) => (
                <li key={i} className="rounded-xl border-l-4 border-risk-scam/70 bg-surface/60 p-3">
                  <p className="font-semibold text-navy">&ldquo;{f.phrase}&rdquo;</p>
                  <p className="mt-1 text-sm text-navy/70">{f.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Next steps */}
        <section className="rounded-xl bg-navy p-4 text-white">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Icon icon={ListChecks} />
            {t('result.nextTitle')}
          </h3>
          <ol className="mt-3 space-y-2">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-base">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-navy">{i + 1}</span>
                <span className="pt-0.5 text-white/90">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(result.summaryForFamily)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-btn items-center justify-center gap-2 rounded-xl bg-risk-safe px-4 text-base font-semibold text-white outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon icon={MessageCircle} />
            {t('result.shareWithFamily')}
          </a>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-btn items-center justify-center gap-2 rounded-xl border-2 border-navy/15 px-4 text-base font-semibold text-navy outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Icon icon={RotateCcw} />
              {L('Semak mesej lain', 'Check another')}
            </button>
          )}
        </div>

        <footer className="border-t border-navy/10 pt-4 text-sm text-navy/60">
          <p>{result.confidenceNote}</p>
          <p className="mt-1 font-medium">{t('result.disclaimer')}</p>
        </footer>
      </div>
    </article>
  );
}

export default ResultCard;
