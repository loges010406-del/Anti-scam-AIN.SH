// src/pages/CheckPage.tsx
// STOP -> SEMAK -> ACT, wired to the offline fallback analyzer. The result
// scrolls into view as soon as it is ready.
import { useEffect, useRef, useState } from 'react';
import { Hand, Search, ShieldCheck } from 'lucide-react';
import type { InputMode } from '../types';
import { useI18n } from '../context/I18nProvider';
import { useAnalysis } from '../hooks/useAnalysis';
import { Icon, LiveRegion } from '../components/common';
import { CheckInput, SampleChips } from '../components/check';
import { ResultCard } from '../components/result';

export function CheckPage() {
  const { t, language } = useI18n();
  const { state, run, reset } = useAnalysis(language);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [analysed, setAnalysed] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const loading = state.status === 'loading';

  useEffect(() => {
    if (state.status === 'success') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.status, state.result]);

  // Re-run when the language changes so explanations follow the UI language.
  useEffect(() => {
    if (state.status === 'success' && input.trim()) run(input, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const submit = () => {
    setAnalysed(mode === 'screenshot' ? '' : input.trim());
    run(input, mode);
  };

  const steps = [
    { icon: Hand, title: t('check.stopTitle') },
    { icon: Search, title: t('check.semakTitle') },
    { icon: ShieldCheck, title: t('check.actTitle') },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-indigo-800 to-accent p-5 text-white shadow-glow sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-20" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 animate-blob rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 animate-blob rounded-full bg-cyan-400/25 blur-3xl [animation-delay:-7s]" />
        <Icon icon={ShieldCheck} size={190} aria-hidden className="pointer-events-none absolute -bottom-10 -right-8 rotate-12 text-white/10" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-white/25 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> {language === 'en' ? 'Works offline · No login' : 'Berfungsi luar talian · Tanpa log masuk'}
        </span>
        <h1 className="relative mt-3 text-3xl font-black tracking-tight sm:text-5xl">{t('check.title')}<span className="text-cyan-300">.</span></h1>
        <p className="relative mt-2 max-w-xl text-base text-white/85 sm:text-lg">{t('check.stopGuidance')}</p>
        <ol className="relative mt-5 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm font-bold ring-1 ring-white/20 backdrop-blur transition-transform hover:-translate-y-0.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs text-navy">{i + 1}</span>
              <Icon icon={s.icon} size={16} />
              {s.title}
            </li>
          ))}
        </ol>
      </section>

      <p className="mb-3 mt-5 text-base text-navy/70">{t('check.subtitle')}</p>

      <CheckInput
        value={input}
        onChange={setInput}
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          setInput('');
          reset();
        }}
        onSubmit={submit}
        loading={loading}
      />
      <SampleChips
        disabled={loading}
        onPick={(content) => {
          setMode('text');
          setInput(content);
          setAnalysed(content);
          run(content, 'text');
        }}
      />

      <LiveRegion message={loading ? t('check.loading') : state.status === 'success' ? t('result.title') : ''} />

      {state.status === 'error' && state.errorKey ? (
        <p role="alert" className="mt-4 animate-fade-in rounded-xl border border-risk-scam/30 bg-risk-scam/10 p-3 text-base font-medium text-risk-scam">
          {t(state.errorKey)}
        </p>
      ) : null}

      <div ref={resultRef} className="scroll-mt-20">
        {state.status === 'success' && state.result ? (
          <ResultCard
            result={state.result}
            analysedText={analysed}
            onReset={() => {
              setInput('');
              reset();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}

export default CheckPage;

