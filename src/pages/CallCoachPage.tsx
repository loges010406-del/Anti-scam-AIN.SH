// src/pages/CallCoachPage.tsx
// Call Coach: (1) simulate an incoming call from an unknown number with a
// Voice-to-Text protection prompt and live scam verdict; (2) a manual coach
// where you listen via the mic or type what the caller says.
import { useState } from 'react';
import { Mic, MicOff, PhoneIncoming, PhoneOff, ShieldAlert, ShieldCheck, PhoneCall } from 'lucide-react';
import { useI18n } from '../context/I18nProvider';
import { Button, Icon, LiveRegion, PageHero } from '../components/common';
import { IncomingCallSimulator, type CallScenario } from '../components/callcoach/IncomingCallSimulator';
import { callVerdict } from '../services/callTactics';
import { useSpeech } from '../hooks/useSpeech';

const SAMPLE = {
  ms: 'Encik, saya Inspektor dari Bukit Aman. Akaun encik terlibat kes pengubahan wang haram. Ini kes sulit, jangan beritahu keluarga. Sila pindahkan wang ke akaun selamat sekarang juga atau waran tangkap akan dikeluarkan.',
  en: 'Sir, I am an officer from the police. Your account is linked to money laundering. This is confidential, do not tell your family. Transfer your money to a safe account right now or an arrest warrant will be issued.',
};

export function CallCoachPage() {
  const { language } = useI18n();
  const L = (ms: string, en: string) => (language === 'en' ? en : ms);
  const lang = language === 'en' ? 'en' : 'ms';

  const [scenario, setScenario] = useState<CallScenario | null>(null);
  const speech = useSpeech(language === 'en' ? 'en-MY' : 'ms-MY');
  const transcript = speech.transcript;
  const verdict = callVerdict(transcript, language);
  const detected = verdict.tactics;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">
      <PageHero icon={PhoneCall} tone="violet" title={L('Jurulatih Panggilan', 'Call Coach')} subtitle={L('Kesan taktik penipuan semasa panggilan, secara langsung.', 'Spot scam tactics during a call, live.')} />

      {/* Incoming call simulator launcher */}
      <section className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-mid to-accent p-5 text-white shadow-soft">
        <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start gap-3">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-white/10" />
            <Icon icon={PhoneIncoming} size={24} />
          </span>
          <div>
            <h2 className="text-lg font-bold">{L('Panggilan daripada nombor tidak dikenali?', 'Call from an unknown number?')}</h2>
            <p className="mt-1 text-sm text-white/85">
              {L(
                'Lihat bagaimana Semak Dulu bertindak: ia minta kebenaran untuk hidupkan Suara-ke-Teks, baca perbualan, dan beritahu sama ada panggilan itu penipuan.',
                'See how Semak Dulu responds: it asks permission to turn on Voice-to-Text, reads the conversation, and tells you if the call is a scam.',
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setScenario('scam')}
            className="flex min-h-btn items-center justify-center gap-2 rounded-xl bg-white font-bold text-navy shadow-lg outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/50"
          >
            <Icon icon={ShieldAlert} className="text-risk-scam" /> {L('Simulasi panggilan penipuan', 'Simulate a scam call')}
          </button>
          <button
            type="button"
            onClick={() => setScenario('legit')}
            className="flex min-h-btn items-center justify-center gap-2 rounded-xl bg-white/15 font-semibold text-white outline-none ring-1 ring-white/30 transition-colors hover:bg-white/25 focus-visible:ring-4 focus-visible:ring-white/50"
          >
            <Icon icon={ShieldCheck} /> {L('Simulasi panggilan biasa', 'Simulate a normal call')}
          </button>
        </div>
        <p className="mt-3 text-xs text-white/60">
          {L(
            'Simulasi: pelayar web tidak boleh mengakses panggilan telefon sebenar. Untuk panggilan sebenar, gunakan pembesar suara dan mod mikrofon.',
            'Simulation: a web browser cannot access real phone calls. For a real call, use speakerphone and microphone mode.',
          )}
        </p>
      </section>

      {/* Manual coach */}
      <section className="mt-6 rounded-2xl bg-white p-4 shadow-soft sm:p-5">
        <h2 className="text-lg font-bold text-navy">{L('Jurulatih manual', 'Manual coach')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {speech.supported ? (
            <Button
              size="lg"
              variant={speech.listening ? 'danger' : 'primary'}
              onClick={speech.listening ? speech.stop : speech.start}
              leadingIcon={<Icon icon={speech.listening ? MicOff : Mic} />}
            >
              {speech.listening ? L('Berhenti dengar', 'Stop listening') : L('Mula dengar', 'Start listening')}
            </Button>
          ) : (
            <p className="rounded-xl bg-surface p-2 text-sm text-navy-mid">
              {L('Pengecaman suara tidak disokong pelayar ini. Sila taip.', 'Speech recognition is not supported in this browser. Please type instead.')}
            </p>
          )}
          <Button variant="secondary" onClick={() => speech.setTranscript(SAMPLE[lang])}>
            {L('Cuba contoh', 'Try a sample')}
          </Button>
          {transcript && (
            <Button variant="ghost" onClick={speech.reset}>
              {L('Kosongkan', 'Clear')}
            </Button>
          )}
        </div>
        {speech.error === 'not-allowed' && (
          <p className="mt-2 text-sm text-risk-scam">
            {L('Akses mikrofon ditolak. Benarkan mikrofon dalam tetapan pelayar.', 'Microphone access was blocked. Allow the microphone in your browser settings.')}
          </p>
        )}

        <label className="mt-4 block text-sm text-navy-mid">
          {L('Transkrip', 'Transcript')}
          <textarea
            rows={5}
            value={transcript}
            onChange={(e) => speech.setTranscript(e.target.value)}
            placeholder={L('Taip apa yang pemanggil katakan...', 'Type what the caller is saying...')}
            className="mt-1 w-full rounded-xl border-2 border-navy/10 bg-white px-4 py-3 text-base text-navy outline-none transition-colors focus:border-accent"
          />
        </label>

        <LiveRegion
          politeness="assertive"
          message={detected.length ? `${L('Amaran', 'Warning')}: ${detected.map((d) => d.name[lang]).join(', ')}` : ''}
        />

        <div className="mt-4 space-y-3">
          {detected.length === 0 ? (
            <p className="text-base text-navy-mid">
              {L('Tiada taktik penipuan dikesan setakat ini. Kekal berwaspada.', 'No scam tactics detected so far. Stay alert.')}
            </p>
          ) : (
            <>
              {detected.map((d) => (
                <div key={d.id} className="animate-fade-in rounded-xl border-l-4 border-risk-scam bg-risk-scam/10 p-4">
                  <p className="flex items-center gap-2 text-lg font-semibold text-risk-scam">
                    <Icon icon={ShieldAlert} /> {d.name[lang]}
                  </p>
                  <p className="mt-1 text-base text-navy">{d.action[lang]}</p>
                </div>
              ))}
              {verdict.level === 'LIKELY SCAM' && (
                <div className="flex items-center gap-3 rounded-xl bg-navy p-4 text-white">
                  <Icon icon={PhoneOff} size={28} />
                  <p className="text-base font-semibold">
                    {L('Panggilan ini menunjukkan tanda penipuan. Disarankan anda letak telefon sekarang.', 'This call shows signs of a scam. We recommend you hang up now.')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {scenario && <IncomingCallSimulator key={scenario} scenario={scenario} onClose={() => setScenario(null)} />}
    </main>
  );
}

export default CallCoachPage;

