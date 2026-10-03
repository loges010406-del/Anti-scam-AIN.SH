// src/services/callTactics.ts
// Call-scam tactic catalogue + live verdict for call transcripts. Pure TS (no
// React). The verdict combines the offline message analyzer with tactic hits
// so a call is judged on both wording and the classic scam-call playbook.
import type { Language, RedFlag, RiskLevel } from '../types';
import { analyze } from './fallbackAnalyzer';
import { toRiskLevel } from '../utils/scoring';

export interface Tactic {
  id: string;
  name: { ms: string; en: string };
  cues: string[];
  action: { ms: string; en: string };
}

export const TACTICS: Tactic[] = [
  {
    id: 'authority',
    name: { ms: 'Menyamar pihak berkuasa', en: 'Authority impersonation' },
    cues: ['polis', 'police', 'bukit aman', 'bank negara', 'bnm', 'lhdn', 'mahkamah', 'court', 'inspektor', 'inspector', 'sarjan', 'officer'],
    action: { ms: 'Letak telefon. Hubungi agensi itu sendiri melalui nombor di laman web rasmi mereka.', en: 'Hang up. Contact the agency yourself using the number on its official website.' },
  },
  {
    id: 'otp',
    name: { ms: 'Minta OTP / TAC', en: 'OTP / TAC request' },
    cues: ['otp', 'tac', 'kod pengesahan', 'verification code', 'password', 'kata laluan'],
    action: { ms: 'Jangan sebut sebarang kod. Pihak sah tidak akan minta OTP anda.', en: 'Do not read out any code. Legitimate callers never ask for your OTP.' },
  },
  {
    id: 'urgency',
    name: { ms: 'Tekanan masa', en: 'Urgency pressure' },
    cues: ['segera', 'sekarang juga', 'cepat', 'urgent', 'immediately', 'right now', '24 jam', 'hari ini juga', 'today'],
    action: { ms: 'Berhenti sebentar. Tiada urusan sah yang perlu diselesaikan dalam beberapa minit.', en: 'Pause. No genuine matter must be settled within minutes.' },
  },
  {
    id: 'threat',
    name: { ms: 'Ugutan', en: 'Threats' },
    cues: ['waran', 'warrant', 'tangkap', 'arrest', 'penjara', 'jail', 'dibekukan', 'frozen', 'saman'],
    action: { ms: 'Ugutan begini ialah taktik menakutkan. Letak telefon dan semak sendiri.', en: 'Threats like this are a scare tactic. Hang up and check independently.' },
  },
  {
    id: 'safeAccount',
    name: { ms: 'Pindah ke "akaun selamat"', en: '"Safe account" transfer' },
    cues: ['akaun selamat', 'safe account', 'pindah wang', 'transfer', 'pindahkan', 'akaun kerajaan'],
    action: { ms: 'Jangan pindah wang. Tiada "akaun selamat" sebenar.', en: 'Do not transfer money. There is no real "safe account".' },
  },
  {
    id: 'secrecy',
    name: { ms: 'Suruh rahsiakan', en: 'Secrecy' },
    cues: ['rahsia', 'sulit', 'jangan beritahu', 'secret', "don't tell", 'do not tell', 'confidential'],
    action: { ms: 'Beritahu keluarga sekarang. Penipu mahu asingkan anda.', en: 'Tell your family now. Scammers want to isolate you.' },
  },
];

/** Tactics whose cues appear in the transcript (case-insensitive). */
export function matchTactics(transcript: string): Tactic[] {
  const lower = (transcript ?? '').toLowerCase();
  if (!lower.trim()) return [];
  return TACTICS.filter((t) => t.cues.some((c) => lower.includes(c)));
}

export interface CallVerdict {
  level: RiskLevel;
  score: number;
  tactics: Tactic[];
  redFlags: RedFlag[];
}

/**
 * Live verdict for a call transcript. Each distinct tactic adds 25 points, so
 * one tactic alone stays SAFE/low, two reach SUSPICIOUS and three or more are
 * LIKELY SCAM; the message analyzer score is used when it is higher.
 */
export function callVerdict(transcript: string, language: Language): CallVerdict {
  const text = (transcript ?? '').trim();
  if (!text) return { level: 'SAFE', score: 0, tactics: [], redFlags: [] };
  const tactics = matchTactics(text);
  const base = analyze(text, language);
  const score = Math.max(base.riskScore, Math.min(100, tactics.length * 25));
  return { level: toRiskLevel(score), score, tactics, redFlags: base.redFlags };
}
