// src/pages/LearnPage.tsx
// Scam Simulator: classify 10 messages as SCAM or REAL, with explanations,
// red flags, score, streak and level. Best streak persists via storageService.
import { useState } from 'react';
import { Award, CheckCircle2, Flame, GraduationCap, RotateCcw, Target, Trophy, XCircle } from 'lucide-react';
import type { QuizLevel, QuizQuestion } from '../types';
import questionsData from '../data/quizQuestions.json';
import { useI18n } from '../context/I18nProvider';
import { Button, Icon, PageHero } from '../components/common';
import { storageService } from '../services/storageService';

const ALL = questionsData as QuizQuestion[];
const ROUND_SIZE = 10;
const QUIZ_KEY = 'sd.quiz';

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function levelFor(streak: number): QuizLevel {
  if (streak >= 8) return 'Scam Buster';
  if (streak >= 5) return 'Guardian';
  if (streak >= 3) return 'Alert';
  return 'Beginner';
}

const newRound = () => shuffle(ALL).slice(0, ROUND_SIZE);

export function LearnPage() {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);

  const [round, setRound] = useState<QuizQuestion[]>(newRound);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState<number>(
    () => storageService.get<{ best: number }>(QUIZ_KEY, { best: 0 }).best ?? 0,
  );

  const done = idx >= round.length;
  const q = round[idx];

  const choose = (saidScam: boolean) => {
    if (answer !== null || !q) return;
    setAnswer(saidScam);
    if (saidScam === q.isScam) {
      setScore((s) => s + 1);
      const next = streak + 1;
      setStreak(next);
      if (next > best) {
        setBest(next);
        storageService.set(QUIZ_KEY, { best: next });
      }
    } else {
      setStreak(0);
    }
  };

  const restart = () => {
    setRound(newRound());
    setIdx(0);
    setAnswer(null);
    setScore(0);
    setStreak(0);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
      <PageHero icon={GraduationCap} tone="amber" title={L('Simulator Penipuan', 'Scam Simulator')} subtitle={L('Baca mesej, kemudian pilih: PENIPUAN atau SAH?', 'Read the message, then choose: SCAM or REAL?')} />

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: L('Skor', 'Score'), value: `${score}/${round.length}`, icon: Target, tone: 'from-blue-500 to-indigo-600' },
          { label: L('Rentetan', 'Streak'), value: String(streak), icon: Flame, tone: 'from-orange-500 to-rose-600' },
          { label: L('Tahap', 'Level'), value: levelFor(best), icon: Award, tone: 'from-violet-500 to-fuchsia-600' },
        ].map((c) => (
          <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tone} p-3 text-white shadow-lift`}>
            <Icon icon={c.icon} size={56} className="absolute -bottom-3 -right-3 text-white/15" />
            <Icon icon={c.icon} size={18} className="mx-auto text-white/90" />
            <p className="mt-1 text-xs font-medium text-white/80">{c.label}</p>
            <p className="text-lg font-extrabold leading-tight">{c.value}</p>
          </div>
        ))}
      </div>

      {done ? (
        <section className="mt-6 card p-6 text-center">
          <Icon icon={Trophy} size={40} className="mx-auto text-risk-suspicious" />
          <h2 className="mt-2 text-xl font-bold text-navy">
            {L('Pusingan tamat', 'Round complete')}: {score}/{round.length}
          </h2>
          <p className="mt-1 text-base text-navy-mid">
            {L('Tahap anda', 'Your level')}: <strong>{levelFor(best)}</strong>
          </p>
          <Button size="lg" className="mt-4" onClick={restart} leadingIcon={<Icon icon={RotateCcw} />}>
            {L('Main lagi', 'Play again')}
          </Button>
        </section>
      ) : q ? (
        <section className="mt-6 card animate-pop-in p-5">
          <p className="text-sm text-navy-mid">
            {L('Soalan', 'Question')} {idx + 1} / {round.length}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500" style={{ width: `${((idx + (answer !== null ? 1 : 0)) / round.length) * 100}%` }} />
          </div>
          <p className="mt-2 rounded-2xl bg-white p-3 shadow-soft text-base leading-relaxed text-navy">{q.content}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="danger" size="lg" disabled={answer !== null} onClick={() => choose(true)}>
              {L('PENIPUAN', 'SCAM')}
            </Button>
            <Button variant="secondary" size="lg" disabled={answer !== null} onClick={() => choose(false)}>
              {L('SAH', 'REAL')}
            </Button>
          </div>

          {answer !== null && (
            <div className="mt-4" role="status">
              {answer === q.isScam ? (
                <p className="flex items-center gap-2 font-semibold text-risk-safe">
                  <Icon icon={CheckCircle2} /> {L('Betul!', 'Correct!')}
                </p>
              ) : (
                <p className="flex items-center gap-2 font-semibold text-risk-scam">
                  <Icon icon={XCircle} /> {L('Kurang tepat.', 'Not quite.')}
                </p>
              )}
              <p className="mt-1 text-base text-navy">
                {L('Jawapan', 'Answer')}: <strong>{q.isScam ? L('PENIPUAN', 'SCAM') : L('SAH', 'REAL')}</strong>
                {q.scamType ? ` (${q.scamType})` : ''}
              </p>
              <p className="mt-2 text-base text-navy-mid">{q.explanation}</p>
              {q.redFlags.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {q.redFlags.map((f, i) => (
                    <li key={i} className="rounded-card border border-navy-mid/15 p-2 text-sm">
                      <strong className="text-navy">&ldquo;{f.phrase}&rdquo;</strong>
                      <span className="block text-navy-mid">{f.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                size="lg"
                fullWidth
                className="mt-4"
                onClick={() => {
                  setIdx((i) => i + 1);
                  setAnswer(null);
                }}
              >
                {L('Seterusnya', 'Next')}
              </Button>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default LearnPage;



