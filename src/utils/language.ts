/**
 * language — language detection for analysed messages (Requirement 13.5).
 *
 * Framework-agnostic: this module MUST NOT import React.
 *
 * `detectLanguage` classifies an input as `bm | en | manglish | mixed` by
 * counting Bahasa Melayu marker tokens vs English marker tokens over the
 * input (design: "Language detection"). Detection chooses the explanation
 * language for generated red flags/next steps; it never gates signal
 * matching (all cue sets are always scanned).
 */

import type { DetectedLanguage } from '../types';

/**
 * Bahasa Melayu marker tokens. Common function/content words that strongly
 * indicate BM when present. Lower-cased for case-insensitive matching.
 */
export const BM_MARKERS: readonly string[] = [
  'anda',
  'wang',
  'sila',
  'akaun',
  'sekarang',
  'segera',
  'jangan',
  'anda',
  'nombor',
  'kata',
  'laluan',
  'pindah',
  'bayar',
  'yuran',
  'tolong',
  'kami',
  'awak',
  'dengan',
  'untuk',
  'adalah',
  'telah',
  'rahsia',
  'polis',
  'bank',
];

/**
 * English marker tokens. Common function/content words that strongly
 * indicate English when present. Lower-cased for case-insensitive matching.
 */
export const EN_MARKERS: readonly string[] = [
  'your',
  'money',
  'please',
  'account',
  'now',
  'urgent',
  'do',
  'not',
  "don't",
  'number',
  'password',
  'transfer',
  'pay',
  'fee',
  'help',
  'we',
  'you',
  'with',
  'for',
  'is',
  'has',
  'secret',
  'police',
  'bank',
];

const BM_SET = new Set(BM_MARKERS);
const EN_SET = new Set(EN_MARKERS);

/**
 * Split an input into comparable lower-cased tokens. Keeps the apostrophe
 * so contractions like "don't" survive, strips other punctuation.
 */
function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .normalize('NFC')
    .split(/[^a-z0-9'\u00c0-\u024f]+/i)
    .filter((t) => t.length > 0);
}

/**
 * Detect the language of `input` by comparing BM vs EN marker-token hits.
 *
 * - both present (bmHits>0 and enHits>0) → 'manglish'
 * - only BM present                      → 'bm'
 * - only EN present                      → 'en'
 * - neither present                      → 'mixed' (unknown)
 *
 * Note: a handful of markers (e.g. "bank") appear in both sets; they count
 * toward both tallies, which is acceptable since a shared token alone cannot
 * decide between BM and EN.
 *
 * @param input the raw (or normalised) message text
 */
export function detectLanguage(input: string): DetectedLanguage {
  if (typeof input !== 'string' || input.trim() === '') {
    return 'mixed';
  }

  let bmHits = 0;
  let enHits = 0;

  for (const token of tokenize(input)) {
    if (BM_SET.has(token)) {
      bmHits += 1;
    }
    if (EN_SET.has(token)) {
      enHits += 1;
    }
  }

  if (bmHits > 0 && enHits > 0) {
    return 'manglish';
  }
  if (bmHits > 0) {
    return 'bm';
  }
  if (enHits > 0) {
    return 'en';
  }
  return 'mixed';
}

export const language = { BM_MARKERS, EN_MARKERS, detectLanguage };

export default language;
