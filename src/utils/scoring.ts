/**
 * scoring â€” weighted-signal scoring model for the fallback analyzer
 * (Requirements 13.1, 13.2, 13.4, 13.5).
 *
 * Framework-agnostic: this module MUST NOT import React.
 *
 * The analyzer scans normalised input for signal groups, each with
 * keyword/pattern cue sets (BM / EN / Manglish) and a weight. The score is a
 * weighted sum, NOT a single-keyword trigger: reaching `LIKELY SCAM` requires
 * at least two independent signals (single-signal guard, R13.4).
 *
 * Design mapping ("Weighted-signal scoring model"):
 *   rawScore  = Î£ (weight of each matched group)   // each group counted once
 *   riskScore = clamp(round(rawScore), 0, 100)
 *   thresholds: 0â€“29 SAFE / 30â€“59 SUSPICIOUS / 60â€“100 LIKELY SCAM
 *
 * The matched groups returned by {@link findSignals} carry the matched
 * substring and its offsets so `fallbackAnalyzer` (task 9.2) can build
 * `RedFlag[]` and `Highlight[]` without rescanning.
 */

import type { RiskLevel } from '../types';

/** Stable identifiers for each signal group. */
export type SignalGroupId =
  | 'urgency'
  | 'financial'
  | 'credential'
  | 'authority'
  | 'suspiciousLink'
  | 'secrecy'
  | 'prize'
  | 'clickbait'
  | 'foreignNumber';

/** Definition of a weighted signal group and its cross-language cues. */
export interface SignalGroup {
  /** Stable identifier (used by task 9.2 to localise reasons). */
  id: SignalGroupId;
  /** Human-readable group name. */
  name: string;
  /** Contribution to `rawScore` when this group matches (counted once). */
  weight: number;
  /**
   * Literal cue phrases across BM / EN / Manglish. Matched case-insensitively
   * against the input. The suspicious-link group additionally uses
   * {@link SUSPICIOUS_LINK_PATTERNS} for structural detection.
   */
  cues: string[];
}

/**
 * A single matched cue occurrence within the input, with offsets so callers
 * can build highlights. `groupId`/`weight` identify the owning signal group.
 */
export interface SignalMatch {
  groupId: SignalGroupId;
  groupName: string;
  weight: number;
  /** The actual matched substring from the (normalised) input. */
  phrase: string;
  /** Char offset (inclusive) of the match in the scanned input. */
  start: number;
  /** Char offset (exclusive) of the match in the scanned input. */
  end: number;
}

/**
 * Weighted signal groups with BM / EN / Manglish cue sets
 * (design: "Weighted-signal scoring model" table).
 */
export const SIGNAL_GROUPS: readonly SignalGroup[] = [
  {
    id: 'urgency',
    name: 'Urgency',
    weight: 25,
    cues: [
      'segera',
      'sekarang juga',
      'dalam 24 jam',
      'serta-merta',
      'cepat',
      'urgent',
      'act now',
      'last warning',
      'final warning',
      'immediately',
      'right now',
      'expire',
      'within 1 hour',
      'within 24 hours',
      'within 12 hours',
      'dalam masa 24 jam',
      'dalam masa 12 jam',
      'dalam 12 jam',
      'dalam masa 1 jam',
      'failure to act',
      'avoid suspension',
      'permanent suspension',
      'account closure',
      'account will be closed',
      'temporarily locked',
      'has been locked',
      'has been suspended',
      'telah disekat',
      'akan disekat',
      'telah digantung',
      'akan ditutup',
    ],
  },
  {
    id: 'financial',
    name: 'Financial request',
    weight: 25,
    cues: [
      'pindah wang',
      'pindahan wang',
      'bayar',
      'bayaran',
      'yuran',
      'deposit',
      'transfer',
      'processing fee',
      'wire',
      'remit',
      'payment',
      'top up',
      'topup',
    ],
  },
  {
    id: 'credential',
    name: 'Credential / OTP request',
    weight: 30,
    cues: [
      'otp',
      'kata laluan',
      'password',
      'pin',
      'tac',
      'nombor ic',
      'no ic',
      'cvv',
      'security code',
      'kod pengesahan',
      'one time password',
      'one-time password',
      'verify your identity',
      'verify your account',
      'confirm your identity',
      'update your details',
      'login details',
      'sahkan identiti',
      'sahkan akaun',
      'kemas kini maklumat',
    ],
  },
  {
    id: 'authority',
    name: 'Authority impersonation',
    weight: 20,
    cues: [
      'polis',
      'police',
      'bank negara',
      'lhdn',
      'jpj',
      'pos malaysia',
      'court',
      'mahkamah',
      'pihak berkuasa',
      'kementerian',
      'immigration',
      'imigresen',
      'maybank',
      'maybank2u',
      'cimb',
      'public bank',
      'rhb',
      'bank islam',
      'hong leong',
      'ambank',
      'bsn',
      'touch n go',
      'kwsp',
      'perkeso',
      'socso',
      'poslaju',
      'j&t',
    ],
  },
  {
    id: 'suspiciousLink',
    name: 'Suspicious link',
    weight: 30,
    // Literal shortener cues; structural URL detection is handled by
    // SUSPICIOUS_LINK_PATTERNS (IP-host URLs, punycode, more shorteners).
    cues: ['bit.ly', 'tinyurl', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'rebrand.ly', 'cutt.ly'],
  },
  {
    id: 'secrecy',
    name: 'Secrecy / isolation',
    weight: 15,
    cues: [
      'jangan beritahu sesiapa',
      'jangan beritahu',
      'rahsia',
      'rahsiakan',
      "don't tell anyone",
      'do not tell anyone',
      "don't tell",
      'keep this secret',
      'between us',
    ],
  },
  {
    id: 'prize',
    name: 'Prize / free-offer bait',
    weight: 30,
    cues: [
      'percuma',
      'hadiah',
      'tebus',
      'layak',
      'tahniah',
      'menang',
      'pemenang',
      'cabutan bertuah',
      'ganjaran',
      'baucar',
      'rebat',
      'bantuan tunai',
      'free gift',
      'free data',
      'free voucher',
      'for free',
      'you have won',
      'you won',
      'winner',
      'congratulations',
      'congrats',
      'claim your',
      'reward',
      'prize',
      'lucky draw',
      'giveaway',
      'rebate',
      'voucher',
      'redeem',
      'eligible',
      'guaranteed',
    ],
  },
  {
    id: 'clickbait',
    name: 'Click-through pressure',
    weight: 15,
    cues: [
      'klik di sini',
      'klik sini',
      'klik link',
      'klik pautan',
      'tekan sini',
      'tekan pautan',
      'semak di sini',
      'click here',
      'click the link',
      'click link',
      'tap here',
      'tap the link',
      'check here',
      '👇',
    ],
  },
  {
    id: 'foreignNumber',
    name: 'Foreign phone number',
    weight: 30,
    // Detected structurally via FOREIGN_NUMBER_PATTERNS.
    cues: [],
  },
];

/** Quick lookup of a group definition by id. */
export const SIGNAL_GROUP_BY_ID: Readonly<Record<SignalGroupId, SignalGroup>> = Object.freeze(
  SIGNAL_GROUPS.reduce(
    (acc, g) => {
      acc[g.id] = g;
      return acc;
    },
    {} as Record<SignalGroupId, SignalGroup>,
  ),
);

/**
 * Structural patterns for the suspicious-link group beyond literal shortener
 * cues: additional shortener hosts, IP-host URLs, and punycode (`xn--`)
 * labels. Each pattern is global so we can locate every occurrence.
 */
export const SUSPICIOUS_LINK_PATTERNS: readonly RegExp[] = [
  // http(s):// or scheme-less URL whose host is a bare IPv4 address.
  /\b(?:https?:\/\/)?(?:\d{1,3}\.){3}\d{1,3}(?:[:/]\S*)?/gi,
  // Punycode label anywhere in a hostname (homograph/look-alike domains).
  /\bxn--[a-z0-9-]+/gi,
  // Links on cheap/throwaway TLDs heavily used by scam campaigns.
  /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:top|xyz|icu|click|buzz|shop|live|online|site|club|vip|tk|ml|ga|cf|gq|rest|cfd|sbs|lol|monster|work|fun|link|win|bid|loan|cyou|bond|today|store)\b(?:[/?#]\S*)?/gi,
];

/**
 * International numbers that are NOT Malaysian (+60 / 0060). Written as
 * +CC or 00CC followed by at least 7 more digits (spaces/dashes allowed).
 */
export const FOREIGN_NUMBER_PATTERNS: readonly RegExp[] = [
  /\+(?!60)\d{1,3}[\s-]?\d(?:[\s-]?\d){6,}/g,
  /(?<!\d)00(?!60)[1-9]\d{0,2}[\s-]?\d(?:[\s-]?\d){6,}/g,
];

/** Risk-level thresholds (design: "Level thresholds"). */
export const THRESHOLDS = {
  /** Top of SAFE (inclusive). */
  safeMax: 29,
  /** Top of SUSPICIOUS (inclusive); also the single-signal guard cap. */
  suspiciousMax: 59,
} as const;

/** The score a capped single signal is clamped to (top of SUSPICIOUS). */
export const SINGLE_SIGNAL_CAP = THRESHOLDS.suspiciousMax;

/** Escape a literal string for safe embedding in a RegExp. */
function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find every signal-group match in `input`.
 *
 * Scanning is case-insensitive and uses word-ish boundaries for literal cues
 * so partial-word false positives are avoided where sensible. Each distinct
 * occurrence is returned (callers may highlight all of them); scoring, by
 * contrast, counts each group only once (see {@link computeScore}).
 *
 * The caller should pass the normalised input (see `utils/text.normalize`)
 * so offsets line up with what will be rendered.
 *
 * @param input the (normalised) text to scan
 * @returns all matches, sorted by start offset
 */
export function findSignals(input: string): SignalMatch[] {
  const matches: SignalMatch[] = [];
  if (typeof input !== 'string' || input.length === 0) {
    return matches;
  }

  for (const group of SIGNAL_GROUPS) {
    for (const cue of group.cues) {
      const escaped = escapeRegExp(cue);
      // Use boundaries only when the cue starts/ends with a word char, so
      // cues like "bit.ly" or "t.co" still match correctly.
      const left = /^[a-z0-9]/i.test(cue) ? '(?<![a-z0-9])' : '';
      const right = /[a-z0-9]$/i.test(cue) ? '(?![a-z0-9])' : '';
      const re = new RegExp(`${left}${escaped}${right}`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(input)) !== null) {
        matches.push({
          groupId: group.id,
          groupName: group.name,
          weight: group.weight,
          phrase: m[0],
          start: m.index,
          end: m.index + m[0].length,
        });
        if (m.index === re.lastIndex) {
          re.lastIndex += 1; // guard against zero-length matches
        }
      }
    }
  }

  // Structural suspicious-link detection (IP hosts, punycode).
  const linkGroup = SIGNAL_GROUP_BY_ID.suspiciousLink;
  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      matches.push({
        groupId: linkGroup.id,
        groupName: linkGroup.name,
        weight: linkGroup.weight,
        phrase: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  // Structural foreign-number detection (non-+60 international numbers).
  const foreignGroup = SIGNAL_GROUP_BY_ID.foreignNumber;
  for (const pattern of FOREIGN_NUMBER_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      matches.push({
        groupId: foreignGroup.id,
        groupName: foreignGroup.name,
        weight: foreignGroup.weight,
        phrase: m[0],
        start: m.index,
        end: m.index + m[0].length,
      });
    }
  }

  matches.sort((a, b) => a.start - b.start || a.end - b.end);
  return matches;
}

/** The set of distinct signal-group ids present in a list of matches. */
export function matchedGroupIds(matches: readonly SignalMatch[]): Set<SignalGroupId> {
  return new Set(matches.map((m) => m.groupId));
}

/**
 * Compute the risk score from matched signals.
 *
 *   rawScore  = Î£ (weight of each DISTINCT matched group)
 *   riskScore = clamp(round(rawScore), 0, 100)
 *
 * Single-signal guard (R13.4): if exactly one signal group matched and the
 * score would cross into `LIKELY SCAM` (â‰¥ 60), it is capped at the top of
 * `SUSPICIOUS` (59). A single signal can therefore never force `LIKELY SCAM`;
 * a second independent group is required.
 *
 * @param matches the matches from {@link findSignals} (any order, duplicates ok)
 * @returns an integer risk score in [0, 100]
 */
export function computeScore(matches: readonly SignalMatch[]): number {
  const groups = matchedGroupIds(matches);

  let rawScore = 0;
  for (const id of groups) {
    rawScore += SIGNAL_GROUP_BY_ID[id].weight;
  }

  let score = clamp(Math.round(rawScore), 0, 100);

  // Single-signal guard: one group can never force LIKELY SCAM.
  if (groups.size === 1 && score > THRESHOLDS.suspiciousMax) {
    score = SINGLE_SIGNAL_CAP;
  }

  return score;
}

/** Map a risk score to its risk level per the design thresholds (R13.2). */
export function toRiskLevel(score: number): RiskLevel {
  const s = clamp(Math.round(score), 0, 100);
  if (s <= THRESHOLDS.safeMax) {
    return 'SAFE';
  }
  if (s <= THRESHOLDS.suspiciousMax) {
    return 'SUSPICIOUS';
  }
  return 'LIKELY SCAM';
}

/** Clamp `value` into the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

export const scoring = {
  SIGNAL_GROUPS,
  SIGNAL_GROUP_BY_ID,
  SUSPICIOUS_LINK_PATTERNS,
  THRESHOLDS,
  SINGLE_SIGNAL_CAP,
  findSignals,
  matchedGroupIds,
  computeScore,
  toRiskLevel,
  clamp,
};

export default scoring;


