// src/components/callcoach/IncomingCallSimulator.tsx
// Simulated "incoming call from an unknown number" experience:
//   ringing -> consent prompt (turn on voice-to-text protection) -> live call
//   with a real-time verdict -> end-of-call summary.
// Live mode is either a scripted demo call or the device microphone
// (speakerphone) through the Web Speech API. A browser cannot access real
// phone-call audio, so this is clearly labelled as a simulation.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AudioLines,
  FileText,
  Mic,
  Phone,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { RiskLevel } from '../../types';
import { useI18n } from '../../context/I18nProvider';
import { DemoBadge, Icon } from '../common';
import { callVerdict } from '../../services/callTactics';
import { useSpeech } from '../../hooks/useSpeech';

export type CallScenario = 'scam' | 'legit';
type Phase = 'ringing' | 'consent' | 'live' | 'ended';
type Source = 'script' | 'mic' | 'off';

const SCRIPTS: Record<CallScenario, { number: string; ms: string[]; en: string[] }> = {
  scam: {
    number: '+60 3-XXXX 7781',
    ms: [
      'Helo, selamat petang. Boleh saya bercakap dengan pemilik nombor ini?',
      'Saya Inspektor Rahman dari Ibu Pejabat Polis Bukit Aman.',
      'Nama anda dikaitkan dengan satu kes pengubahan wang haram.',
      'Ini kes sulit. Tolong jangan beritahu sesiapa, termasuk keluarga.',
      'Sebentar lagi anda akan terima satu kod OTP. Sila bacakan kepada saya.',
      'Kalau tidak, waran tangkap akan dikeluarkan hari ini juga.',
      'Untuk keselamatan, pindahkan semua baki anda ke akaun selamat kerajaan sekarang juga.',
    ],
    en: [
      'Hello, good afternoon. May I speak to the owner of this number?',
      'I am Inspector Rahman from the Bukit Aman police headquarters.',
      'Your name is linked to a money laundering case.',
      'This case is confidential. Please do not tell anyone, including your family.',
      'You will receive an OTP shortly. Please read it out to me.',
      'If not, an arrest warrant will be issued today.',
      'For your safety, transfer your full balance to a government safe account right now.',
    ],
  },
  legit: {
    number: '+60 3-XXXX 2140',
    ms: [
      'Helo, selamat pagi. Saya Aina dari Klinik Kesihatan Taman Melati.',
      'Saya cuma nak ingatkan temujanji susulan anda pada hari Khamis, jam sepuluh pagi.',
      'Jangan lupa bawa buku rawatan anda ya.',
      'Kalau nak tukar tarikh, boleh datang ke kaunter klinik.',
      'Itu sahaja. Terima kasih, semoga sihat selalu.',
    ],
    en: [
      'Hello, good morning. This is Aina from Taman Melati health clinic.',
      'I am just reminding you about your follow-up appointment on Thursday at ten in the morning.',
      'Please remember to bring your treatment book.',
      'If you need to change the date, you can visit the clinic counter.',
      'That is all. Thank you and take care.',
    ],
  },
};

const LINE_MS = 2600;

const LEVEL: Record<RiskLevel, { ms: string; en: string; icon: typeof ShieldCheck; bg: string; text: string }> = {
  SAFE: { ms: 'SELAMAT', en: 'SAFE', icon: ShieldCheck, bg: 'bg-risk-safe', text: 'text-risk-safe' },
  SUSPICIOUS: { ms: 'MENCURIGAKAN', en: 'SUSPICIOUS', icon: ShieldAlert, bg: 'bg-risk-suspicious', text: 'text-risk-suspicious' },
  'LIKELY SCAM': { ms: 'KEMUNGKINAN PENIPUAN', en: 'LIKELY SCAM', icon: ShieldX, bg: 'bg-risk-scam', text: 'text-risk-scam' },
};

function speak(text: string, lang: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech synthesis is a nice-to-have */
  }
}

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export interface IncomingCallSimulatorProps {
  scenario: CallScenario;
  onClose: () => void;
}

export function IncomingCallSimulator({ scenario, onClose }: IncomingCallSimulatorProps) {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);
  const lang = language === 'en' ? 'en' : 'ms';
  const bcp47 = language === 'en' ? 'en-MY' : 'ms-MY';
  const script = SCRIPTS[scenario];

  const [phase, setPhase] = useState<Phase>('ringing');
  const [source, setSource] = useState<Source>('script');
  const [shown, setShown] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const speech = useSpeech(bcp47);
  const alertedRef = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Lock page scroll while the call screen is open; vibrate while ringing.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (phase !== 'ringing') return;
    const buzz = () => navigator.vibrate?.([400, 200, 400]);
    buzz();
    const id = window.setInterval(buzz, 2000);
    return () => {
      window.clearInterval(id);
      navigator.vibrate?.(0);
    };
  }, [phase]);

  // Call timer.
  useEffect(() => {
    if (phase !== 'live') return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Scripted caller lines stream in one at a time.
  useEffect(() => {
    if (phase !== 'live' || source !== 'script') return;
    if (shown >= script[lang].length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 900 : LINE_MS);
    return () => window.clearTimeout(id);
  }, [phase, source, shown, script, lang]);

  const lines = source === 'script' ? script[lang].slice(0, shown) : [];
  const transcript = source === 'script' ? lines.join(' ') : source === 'mic' ? speech.transcript : '';
  const verdict = useMemo(() => callVerdict(transcript, language), [transcript, language]);
  const meta = LEVEL[verdict.level];
  const scriptDone = source === 'script' && shown >= script[lang].length;

  // Spoken + haptic alert the first time the call is judged a likely scam.
  useEffect(() => {
    if (phase !== 'live' || verdict.level !== 'LIKELY SCAM' || alertedRef.current) return;
    alertedRef.current = true;
    navigator.vibrate?.([200, 100, 200, 100, 400]);
    if (voiceAlerts) {
      speak(
        L('Amaran. Panggilan ini kemungkinan penipuan. Jangan beri OTP atau pindah wang. Disarankan letak telefon.', 'Warning. This call is likely a scam. Do not share an OTP or transfer money. We recommend you hang up.'),
        bcp47,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict.level, phase]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines.length, speech.transcript]);

  const enable = (src: Source) => {
    setSource(src);
    setPhase('live');
    if (src === 'mic') {
      speech.reset();
      speech.start();
    }
  };

  const hangUp = () => {
    speech.stop();
    window.speechSynthesis?.cancel();
    setPhase('ended');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={L('Panggilan masuk', 'Incoming call')}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        if (phase === 'live') hangUp();
        else onClose();
      }}
      className="fixed inset-0 z-50 flex animate-fade-in items-stretch justify-center bg-navy-deep/70 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-gradient-to-b from-navy via-navy-deep to-black text-white shadow-2xl sm:max-h-[90vh] sm:rounded-[2rem]">
        <div className="flex justify-center pt-3">
          <DemoBadge label={L('SIMULASI', 'SIMULATION')} className="bg-white/10 text-white" />
        </div>

        {/* Caller header */}
        <div className="flex flex-col items-center px-6 pt-6 text-center">
          <div className="relative">
            {phase === 'ringing' && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
                <span className="absolute -inset-3 animate-pulse rounded-full bg-accent/20" />
              </>
            )}
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white/10 ring-2 ring-white/20">
              <Icon icon={User} size={38} />
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-wide">{script.number}</p>
          <p className="text-sm text-white/60">
            {L('Nombor tidak dikenali', 'Unknown number')}
            {phase === 'live' ? ` · ${fmt(seconds)}` : ''}
            {phase === 'ringing' ? ` · ${L('Panggilan masuk...', 'Incoming call...')}` : ''}
          </p>
        </div>

        {/* RINGING */}
        {phase === 'ringing' && (
          <div className="mt-auto flex items-end justify-around px-8 pb-12 pt-10">
            <button type="button" onClick={onClose} className="flex flex-col items-center gap-2 text-sm text-white/80 outline-none">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-risk-scam shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50">
                <Icon icon={PhoneOff} size={28} />
              </span>
              {L('Tolak', 'Decline')}
            </button>
            <button type="button" autoFocus onClick={() => setPhase('consent')} className="flex flex-col items-center gap-2 text-sm text-white/80 outline-none">
              <span className="grid h-16 w-16 animate-bounce place-items-center rounded-full bg-risk-safe shadow-lg focus-visible:ring-4 focus-visible:ring-white/50">
                <Icon icon={Phone} size={28} />
              </span>
              {L('Jawab', 'Answer')}
            </button>
          </div>
        )}

        {/* CONSENT PROMPT */}
        {phase === 'consent' && (
          <div className="mt-auto p-4 pb-6">
            <div className="animate-pop-in rounded-2xl bg-white p-5 text-navy shadow-xl">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                  <Icon icon={AudioLines} size={24} />
                </span>
                <h2 className="text-lg font-bold leading-tight">
                  {L('Hidupkan perlindungan Suara-ke-Teks?', 'Turn on Voice-to-Text protection?')}
                </h2>
              </div>
              <p className="mt-3 text-base text-navy/75">
                {L(
                  'Panggilan ini daripada nombor tidak dikenali. Semak Dulu boleh tukar perbualan kepada teks dan beri amaran segera jika ada tanda penipuan.',
                  'This call is from an unknown number. Semak Dulu can turn the conversation into text and warn you right away if it shows scam signs.',
                )}
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => enable('script')}
                  className="flex min-h-btn items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-navy-mid font-bold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                >
                  <Icon icon={AudioLines} /> {L('Hidupkan (panggilan demo)', 'Turn on (demo call)')}
                </button>
                {speech.supported && (
                  <button
                    type="button"
                    onClick={() => enable('mic')}
                    className="flex min-h-btn items-center justify-center gap-2 rounded-xl border-2 border-accent/30 font-semibold text-accent outline-none hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Icon icon={Mic} /> {L('Hidupkan dengan mikrofon (pembesar suara)', 'Turn on with microphone (speakerphone)')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => enable('off')}
                  className="min-h-btn rounded-xl font-semibold text-navy/60 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {L('Tidak sekarang', 'Not now')}
                </button>
              </div>
              <p className="mt-3 text-xs text-navy/50">
                {L(
                  'Mod mikrofon menggunakan pengecaman suara pelayar; sesetengah pelayar memproses audio di pelayan mereka. Tiada transkrip disimpan oleh Semak Dulu.',
                  'Microphone mode uses the browser speech recognition; some browsers process audio on their own servers. Semak Dulu stores no transcripts.',
                )}
              </p>
            </div>
          </div>
        )}

        {/* LIVE CALL */}
        {phase === 'live' && (
          <>
            {source !== 'off' ? (
              <div className="mx-4 mt-5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold text-white transition-colors duration-500 ${meta.bg}`}>
                    <Icon icon={meta.icon} size={18} />
                    {meta[lang]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoiceAlerts((v) => !v)}
                    aria-pressed={voiceAlerts}
                    aria-label={L('Amaran suara', 'Voice alerts')}
                    className="grid min-h-tap min-w-tap place-items-center rounded-full text-white/70 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50"
                  >
                    <Icon icon={voiceAlerts ? Volume2 : VolumeX} />
                  </button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={verdict.score} aria-label={L('Skor risiko', 'Risk score')}>
                  <div className={`h-full transition-all duration-700 ${meta.bg}`} style={{ width: `${Math.max(verdict.score, 3)}%` }} />
                </div>
                {verdict.tactics.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {verdict.tactics.map((t) => (
                      <li key={t.id} className="animate-pop-in rounded-full bg-risk-scam/25 px-2.5 py-1 text-xs font-semibold text-red-100 ring-1 ring-risk-scam/40">
                        {t.name[lang]}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mx-4 mt-5 rounded-2xl bg-white/5 p-3 text-center text-sm text-white/60">
                {L('Perlindungan Suara-ke-Teks dimatikan.', 'Voice-to-Text protection is off.')}
              </p>
            )}

            {/* Transcript feed */}
            <div ref={feedRef} aria-live="polite" className="mt-3 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
              {source === 'script' &&
                lines.map((line, i) => (
                  <p key={i} className="max-w-[90%] animate-fade-in rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2 text-[15px] leading-snug">
                    {line}
                  </p>
                ))}
              {source === 'script' && !scriptDone && (
                <p className="flex items-center gap-1 px-2 text-white/40" aria-hidden>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:300ms]" />
                </p>
              )}
              {source === 'mic' && (
                <>
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <span className={`h-2.5 w-2.5 rounded-full ${speech.listening ? 'animate-pulse bg-risk-scam' : 'bg-white/30'}`} />
                    {speech.listening ? L('Mendengar... letak panggilan pada pembesar suara.', 'Listening... put the call on speakerphone.') : L('Mikrofon tidak aktif.', 'Microphone is not active.')}
                  </p>
                  {speech.error === 'not-allowed' && (
                    <p className="rounded-xl bg-risk-scam/20 p-3 text-sm">
                      {L('Akses mikrofon ditolak. Benarkan mikrofon dalam tetapan pelayar.', 'Microphone access was blocked. Allow the microphone in your browser settings.')}
                    </p>
                  )}
                  {speech.transcript && (
                    <p className="rounded-2xl bg-white/10 px-3.5 py-2 text-[15px] leading-snug">{speech.transcript}</p>
                  )}
                </>
              )}
            </div>

            {/* Action advice */}
            {verdict.level === 'LIKELY SCAM' && (
              <div className="mx-4 mb-3 animate-pop-in rounded-2xl bg-risk-scam p-3 text-center shadow-lg">
                <p className="font-extrabold">{L('Disarankan letak telefon sekarang', 'We recommend hanging up now')}</p>
                <p className="text-sm text-white/90">{verdict.tactics[0]?.action[lang]}</p>
              </div>
            )}
            {verdict.level === 'SUSPICIOUS' && (
              <p className="mx-4 mb-3 rounded-2xl bg-risk-suspicious/90 p-3 text-center text-sm font-semibold text-navy-deep">
                {L('Berhati-hati. Jangan beri sebarang maklumat peribadi.', 'Be careful. Do not give any personal details.')}
              </p>
            )}

            <div className="flex justify-center pb-8 pt-2">
              <button type="button" onClick={hangUp} className="flex flex-col items-center gap-1 text-sm text-white/80 outline-none">
                <span className={`grid h-16 w-16 place-items-center rounded-full bg-risk-scam shadow-lg transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 ${verdict.level === 'LIKELY SCAM' ? 'animate-pulse ring-4 ring-white/40' : ''}`}>
                  <Icon icon={PhoneOff} size={28} />
                </span>
                {L('Letak telefon', 'Hang up')}
              </button>
            </div>
          </>
        )}

        {/* SUMMARY */}
        {phase === 'ended' && (
          <div className="mt-6 flex-1 overflow-y-auto p-4 pb-6">
            <div className="animate-pop-in rounded-2xl bg-white p-5 text-navy shadow-xl">
              <p className="text-sm text-navy/60">
                {L('Panggilan tamat', 'Call ended')} · {fmt(seconds)}
              </p>
              {source === 'off' ? (
                <p className="mt-2 text-base">{L('Tiada analisis kerana perlindungan dimatikan.', 'No analysis because protection was off.')}</p>
              ) : (
                <>
                  <p className={`mt-1 flex items-center gap-2 text-2xl font-extrabold ${meta.text}`}>
                    <Icon icon={meta.icon} size={28} /> {meta[lang]}
                  </p>
                  <p className="text-sm text-navy/60">
                    {L('Skor risiko', 'Risk score')}: {verdict.score}/100
                  </p>
                  {verdict.tactics.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {verdict.tactics.map((t) => (
                        <li key={t.id} className="rounded-xl border-l-4 border-risk-scam/70 bg-surface/60 p-3">
                          <p className="font-semibold">{t.name[lang]}</p>
                          <p className="text-sm text-navy/70">{t.action[lang]}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-base text-navy/70">
                      {L('Tiada taktik penipuan dikesan. Tetap berwaspada.', 'No scam tactics detected. Stay alert anyway.')}
                    </p>
                  )}
                </>
              )}
              <div className="mt-5 grid gap-2">
                {verdict.level !== 'SAFE' && (
                  <Link
                    to="/report"
                    onClick={onClose}
                    className="flex min-h-btn items-center justify-center gap-2 rounded-xl bg-navy font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Icon icon={FileText} /> {L('Sediakan laporan', 'Prepare a report')}
                  </Link>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={onClose}
                  className="min-h-btn rounded-xl border-2 border-navy/15 font-semibold outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {L('Tutup', 'Close')}
                </button>
              </div>
              <p className="mt-3 text-xs text-navy/50">
                {L('Ini panduan sahaja, bukan jaminan. Sentiasa sahkan melalui saluran rasmi.', 'This is guidance only, not a guarantee. Always verify through official channels.')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IncomingCallSimulator;

