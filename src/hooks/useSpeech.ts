// src/hooks/useSpeech.ts
// Thin wrapper around the Web Speech API (SpeechRecognition /
// webkitSpeechRecognition). Keeps listening across Chrome's silence timeouts
// until stop() is called, and reports permission errors. When unsupported,
// `supported` is false and callers fall back to typed or scripted input.
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechCtor = new () => SpeechRecognitionLike;

export function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(lang: string) {
  const supported = getSpeechCtor() !== null;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantRef = useRef(false);
  const committedRef = useRef('');

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    setError(null);
    wantRef.current = true;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += `${e.results[i][0].transcript} `;
      setTranscript(`${committedRef.current} ${text}`.trim());
    };
    rec.onerror = (e) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        wantRef.current = false;
        setError('not-allowed');
      }
    };
    rec.onend = () => {
      if (wantRef.current) {
        // Chrome ends sessions after silence; keep what we have and restart.
        setTranscript((t) => {
          committedRef.current = t;
          return t;
        });
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('start-failed');
    }
  }, [lang]);

  const reset = useCallback(() => {
    committedRef.current = '';
    setTranscript('');
  }, []);

  useEffect(() => () => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  return { supported, listening, transcript, setTranscript, start, stop, reset, error };
}

export default useSpeech;
