/**
 * fallbackAnalyzer â€” the offline, deterministic analysis engine
 * (Requirements 2.1, 2.4, 2.5, 13.1, 13.2, 13.3, 13.5, 14.2).
 *
 * Framework-agnostic: this module MUST NOT import React. It depends only on
 * the scoring/language utilities (task 9.1) and the shared types (task 3.1),
 * so the Check feature works with no AI key and offline (R2.1, R2.3).
 *
 * `analyze(input, language)` scans the normalised input with the weighted
 * signal model, then builds an `AnalysisResult` carrying `source: 'fallback'`
 * â€” the exact same schema the AI path emits (R2.4, R12.4), so UI code never
 * branches on provenance. Every matched signal group contributes exactly one
 * explainable `RedFlag { phrase, reason }` (R13.3) and `Highlight` ranges are
 * taken directly from the match offsets.
 *
 * Explanations are localised: the detected message language (bm/en/manglish/
 * mixed) chooses the copy, falling back to the user's selected UI `language`
 * when detection is inconclusive (design: "Explainable red-flag generation").
 *
 * `analyzeImage()` returns the mandated, clearly-labelled demo result when AI
 * vision is unavailable (R14.2) and never fabricates image findings (R14.3).
 */

import type { AnalysisResult, DetectedLanguage, Highlight, Language, RedFlag } from '../types';
import {
  type SignalGroupId,
  type SignalMatch,
  SIGNAL_GROUPS,
  computeScore,
  findSignals,
  matchedGroupIds,
  toRiskLevel,
} from '../utils/scoring';
import { detectLanguage } from '../utils/language';
import { normalize, truncate } from '../utils/text';

/** The exact mandated label for the screenshot demo fallback (R14.2). */
export const DEMO_IMAGE_LABEL = 'Demo analysis â€” image intelligence unavailable';

/**
 * The copy locale used for generated explanations. Message detection yields
 * `bm | en | manglish | mixed`; we collapse that onto the two copy locales we
 * actually author (`bm` / `en`): Manglish and BM both read BM-first copy,
 * English reads English, and `mixed` defers to the UI language.
 */
type CopyLocale = 'bm' | 'en';

/** Localised plain-language reason for each signal group (R13.3). */
const GROUP_REASONS: Readonly<Record<SignalGroupId, Record<CopyLocale, string>>> = {
  urgency: {
    bm: 'Mesej ini menekan anda supaya bertindak segera. Penipu gunakan tekanan masa supaya anda tidak sempat berfikir.',
    en: 'This message pressures you to act immediately. Scammers use urgency so you have no time to think.',
  },
  financial: {
    bm: 'Mesej ini meminta pembayaran atau pindahan wang. Berhati-hati sebelum menghantar sebarang wang.',
    en: 'This message asks for a payment or money transfer. Be careful before sending any money.',
  },
  credential: {
    bm: 'Mesej ini meminta OTP, kata laluan, PIN, atau nombor IC. Pihak sah tidak akan sesekali meminta maklumat ini.',
    en: 'This message asks for an OTP, password, PIN, or IC number. Legitimate parties never ask for these.',
  },
  authority: {
    bm: 'Mesej ini mendakwa daripada pihak berkuasa atau institusi rasmi. Pengesahan perlu dibuat melalui saluran rasmi sendiri.',
    en: 'This message claims to be from an authority or official institution. Verify through official channels you look up yourself.',
  },
  suspiciousLink: {
    bm: 'Mesej ini mengandungi pautan yang mencurigakan (pemendek pautan atau alamat luar biasa). Jangan tekan tanpa mengesahkannya.',
    en: 'This message contains a suspicious link (a shortener or unusual address). Do not tap it without verifying.',
  },
  secrecy: {
    bm: 'Mesej ini meminta anda merahsiakannya daripada orang lain. Penipu mahu mengasingkan anda daripada orang yang boleh membantu.',
    en: 'This message asks you to keep it secret from others. Scammers isolate you from people who could help.',
  },
  prize: {
    bm: 'Mesej ini menawarkan hadiah, data atau ganjaran "percuma". Tawaran terlalu baik untuk jadi kenyataan ialah umpan penipuan yang paling biasa.',
    en: 'This message offers a "free" prize, data or reward. Offers that sound too good to be true are the most common scam bait.',
  },
  clickbait: {
    bm: 'Mesej ini mendesak anda menekan pautan. Penipu guna ayat seperti "klik di sini" untuk bawa anda ke laman palsu yang mencuri maklumat.',
    en: 'This message pushes you to tap a link. Scammers use lines like "click here" to send you to fake pages that steal your details.',
  },
  foreignNumber: {
    bm: 'Mesej ini mengandungi nombor telefon luar negara. Pihak sah di Malaysia biasanya menggunakan nombor +60.',
    en: 'This message contains a foreign phone number. Legitimate Malaysian organisations normally use +60 numbers.',
  },
};

/** Localised, ordered, non-destructive next steps (R10.1, R10.2). */
const NEXT_STEPS: Readonly<Record<CopyLocale, readonly string[]>> = {
  bm: [
    'Berhenti. Jangan balas, tekan pautan, atau pindah wang buat masa ini.',
    'Jangan kongsi OTP, kata laluan, PIN, atau nombor IC dengan sesiapa.',
    'Sahkan secara berasingan melalui saluran rasmi yang anda cari sendiri, bukan nombor dalam mesej ini.',
    'Bincang dengan ahli keluarga atau rakan yang anda percaya sebelum bertindak.',
    'Jika anda ragu, laporkan kepada pihak berkuasa rasmi secara manual.',
  ],
  en: [
    'Stop. Do not reply, tap links, or transfer money for now.',
    'Never share an OTP, password, PIN, or IC number with anyone.',
    'Verify separately through official channels you look up yourself, not the number in this message.',
    'Talk it over with a family member or friend you trust before acting.',
    'If in doubt, report it to the official authorities yourself.',
  ],
};

/** Localised next steps shown when nothing suspicious was found. */
const SAFE_NEXT_STEPS: Readonly<Record<CopyLocale, readonly string[]>> = {
  bm: [
    'Tiada tanda jelas ditemui, tetapi teruskan berwaspada.',
    'Jangan kongsi OTP, kata laluan, atau nombor IC walaupun diminta.',
    'Jika ragu, sahkan melalui saluran rasmi yang anda cari sendiri.',
  ],
  en: [
    'No clear warning signs were found, but stay alert.',
    'Never share an OTP, password, or IC number even if asked.',
    'If unsure, verify through official channels you look up yourself.',
  ],
};

/** Localised, non-certainty confidence notes (R3.3). Always non-empty. */
const CONFIDENCE_NOTE: Readonly<Record<CopyLocale, string>> = {
  bm: 'Ini panduan kesedaran sahaja, bukan jaminan. Semakan ini dibuat di peranti tanpa AI. Sentiasa sahkan melalui saluran rasmi.',
  en: 'This is awareness guidance only, not a guarantee. This check ran on-device without AI. Always verify through official channels.',
};

/** Localised family-share summaries, parameterised by level + score. */
const FAMILY_SUMMARY: Readonly<
  Record<CopyLocale, (levelLabel: string, score: number, hasFlags: boolean) => string>
> = {
  bm: (levelLabel, score, hasFlags) =>
    hasFlags
      ? `Amaran: mesej ini kelihatan ${levelLabel} (skor ${score}/100). Jangan kongsi OTP atau wang, dan sahkan dahulu sebelum bertindak.`
      : `Mesej ini kelihatan ${levelLabel} (skor ${score}/100) buat masa ini, tetapi sentiasa berwaspada dan sahkan melalui saluran rasmi.`,
  en: (levelLabel, score, hasFlags) =>
    hasFlags
      ? `Heads up: this message looks ${levelLabel} (score ${score}/100). Do not share an OTP or money, and verify before acting.`
      : `This message looks ${levelLabel} (score ${score}/100) for now, but stay alert and verify through official channels.`,
};

/** Localised, humanised risk-level labels used inside summaries. */
const LEVEL_LABEL: Readonly<Record<CopyLocale, Record<AnalysisResult['riskLevel'], string>>> = {
  bm: {
    SAFE: 'selamat',
    SUSPICIOUS: 'mencurigakan',
    'LIKELY SCAM': 'berkemungkinan penipuan',
  },
  en: {
    SAFE: 'safe',
    SUSPICIOUS: 'suspicious',
    'LIKELY SCAM': 'likely a scam',
  },
};

/** Localised, non-identified scam-type labels. */
const SCAM_TYPE_LABEL: Readonly<Record<CopyLocale, Record<SignalGroupId, string>>> = {
  bm: {
    credential: 'Penipuan OTP / maklumat log masuk',
    authority: 'Penyamaran pihak berkuasa',
    financial: 'Penipuan kewangan',
    suspiciousLink: 'Penipuan pautan / phishing',
    urgency: 'Penipuan tekanan masa',
    secrecy: 'Penipuan pengasingan',
    prize: 'Penipuan hadiah / tawaran percuma',
    clickbait: 'Penipuan pautan / phishing',
    foreignNumber: 'Nombor luar negara',
  },
  en: {
    credential: 'OTP / credential scam',
    authority: 'Authority impersonation',
    financial: 'Financial scam',
    suspiciousLink: 'Link / phishing scam',
    urgency: 'Urgency-pressure scam',
    secrecy: 'Isolation scam',
    prize: 'Prize / free-offer scam',
    clickbait: 'Link / phishing scam',
    foreignNumber: 'Foreign number',
  },
};

/**
 * Priority for choosing the single most-representative scam-type label when
 * several groups match. Credential/OTP and authority impersonation are the
 * most telling, so they win over generic urgency.
 */
const SCAM_TYPE_PRIORITY: readonly SignalGroupId[] = [
  'credential',
  'authority',
  'prize',
  'financial',
  'suspiciousLink',
  'clickbait',
  'foreignNumber',
  'secrecy',
  'urgency',
];

/**
 * Collapse a detected message language onto a copy locale, deferring to the
 * UI `language` when detection is inconclusive (`mixed`).
 */
export function resolveCopyLocale(detected: DetectedLanguage, uiLanguage: Language): CopyLocale {
  switch (detected) {
    case 'bm':
    case 'manglish':
      return 'bm';
    case 'en':
      return 'en';
    case 'mixed':
    default:
      return uiLanguage === 'en' ? 'en' : 'bm';
  }
}

/**
 * Build one `RedFlag` per DISTINCT matched signal group (R13.3). The `phrase`
 * is the first matched substring for that group (preserving the user's text);
 * the `reason` is the localised explanation for the group.
 */
function buildRedFlags(matches: readonly SignalMatch[], locale: CopyLocale): RedFlag[] {
  const firstByGroup = new Map<SignalGroupId, SignalMatch>();
  for (const m of matches) {
    if (!firstByGroup.has(m.groupId)) {
      firstByGroup.set(m.groupId, m);
    }
  }

  // Emit in a stable, defined group order rather than match order.
  const flags: RedFlag[] = [];
  for (const group of SIGNAL_GROUPS) {
    const match = firstByGroup.get(group.id);
    if (match) {
      flags.push({ phrase: match.phrase, reason: GROUP_REASONS[group.id][locale] });
    }
  }
  return flags;
}

/**
 * Build `Highlight[]` directly from the match offsets (R13.3). Every distinct
 * occurrence is highlighted; each carries the localised reason for its group.
 */
function buildHighlights(matches: readonly SignalMatch[], locale: CopyLocale): Highlight[] {
  return matches.map((m) => ({
    start: m.start,
    end: m.end,
    reason: GROUP_REASONS[m.groupId][locale],
  }));
}

/** Pick the single most-representative scam-type label, or '' if none. */
function pickScamType(groups: ReadonlySet<SignalGroupId>, locale: CopyLocale): string {
  if (groups.size === 0) {
    return '';
  }
  for (const id of SCAM_TYPE_PRIORITY) {
    if (groups.has(id)) {
      return SCAM_TYPE_LABEL[locale][id];
    }
  }
  return '';
}

/**
 * Analyse a text/link/phone input entirely offline and return a complete,
 * schema-valid {@link AnalysisResult} with `source: 'fallback'`
 * (R2.1, R2.4, R2.5, R13.1, R13.2, R13.3, R13.5).
 *
 * @param input the raw user input (will be truncated + normalised internally)
 * @param language the user's selected UI language, used as the explanation
 *   language when message detection is inconclusive
 */
export function analyze(input: string, language: Language): AnalysisResult {
  const safeInput = typeof input === 'string' ? input : '';
  // Bound and canonicalise so offsets line up with what the UI will render.
  const text = normalize(truncate(safeInput));

  const detected = detectLanguage(text);
  const locale = resolveCopyLocale(detected, language);

  const matches = findSignals(text);
  const groups = matchedGroupIds(matches);
  const riskScore = computeScore(matches);
  const riskLevel = toRiskLevel(riskScore);

  const redFlags = buildRedFlags(matches, locale);
  const highlights = buildHighlights(matches, locale);
  const hasFlags = redFlags.length > 0;

  const nextSteps = (hasFlags ? NEXT_STEPS : SAFE_NEXT_STEPS)[locale].slice();
  const scamType = pickScamType(groups, locale);
  const levelLabel = LEVEL_LABEL[locale][riskLevel];
  const summaryForFamily = FAMILY_SUMMARY[locale](levelLabel, riskScore, hasFlags);

  return {
    riskLevel,
    riskScore,
    scamType,
    redFlags,
    highlights,
    nextSteps,
    summaryForFamily,
    confidenceNote: CONFIDENCE_NOTE[locale],
    source: 'fallback',
  };
}

/**
 * Return the mandated demo result for the screenshot path when AI vision is
 * unavailable (R14.2). The exact label text {@link DEMO_IMAGE_LABEL} is
 * carried in both `scamType` and `confidenceNote` so the UI can surface it
 * with a `DemoBadge`. This NEVER fabricates specific findings about the image
 * contents (R14.3): there are no red flags or highlights, and the framing is a
 * neutral awareness reminder.
 *
 * @param language the user's selected UI language for the awareness copy
 */
export function analyzeImage(language: Language): AnalysisResult {
  const locale: CopyLocale = language === 'en' ? 'en' : 'bm';

  return {
    riskLevel: 'SUSPICIOUS',
    riskScore: 50,
    scamType: DEMO_IMAGE_LABEL,
    redFlags: [],
    highlights: [],
    nextSteps: SAFE_NEXT_STEPS[locale].slice(),
    summaryForFamily:
      locale === 'bm'
        ? 'Analisis imej tidak tersedia dalam mod demo. Berwaspada dengan tangkapan skrin dan sahkan melalui saluran rasmi.'
        : 'Image analysis is unavailable in demo mode. Be cautious with screenshots and verify through official channels.',
    confidenceNote: DEMO_IMAGE_LABEL,
    source: 'fallback',
  };
}

/** Kind of phone number, as far as the format can tell. */
export type PhoneKind = 'my-mobile' | 'my-landline' | 'my-tollfree' | 'foreign' | 'invalid';

/** Common international dialling codes, longest first, for a readable prefix. */
const COUNTRY_CODES = [
  '234', '233', '254', '855', '856', '880', '960', '966', '971', '974', '977',
  '20', '27', '33', '44', '49', '61', '62', '63', '65', '66', '81', '82', '84', '86', '91', '92', '93', '94', '95', '98',
  '1', '7',
];

/**
 * Classify a phone number by format. Malaysian numbers are +60 / 60 / 0
 * followed by a mobile (01x, 9-10 digits after 0) or landline (03-09)
 * number, or a 1300/1800 toll-free line. Any other international number is
 * `foreign`; anything else is `invalid`.
 */
export function classifyPhone(raw: string): { kind: PhoneKind; countryCode?: string } {
  const trimmed = (raw ?? '').trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return { kind: 'invalid' };

  const international = trimmed.startsWith('+') || digits.startsWith('00');
  if (digits.startsWith('00')) digits = digits.slice(2);

  if (/^1[38]00\d{6}$/.test(digits) && !international) return { kind: 'my-tollfree' };

  let local: string;
  if (international || (digits.startsWith('60') && digits.length >= 10)) {
    if (!digits.startsWith('60')) {
      if (digits.length < 7) return { kind: 'invalid' };
      const cc = COUNTRY_CODES.find((c) => digits.startsWith(c)) ?? digits.slice(0, 2);
      return { kind: 'foreign', countryCode: cc };
    }
    local = `0${digits.slice(2)}`;
  } else if (digits.startsWith('0')) {
    local = digits;
  } else if (digits.length >= 10) {
    // Long number with a country code but no "+" (e.g. 62812...).
    const cc = COUNTRY_CODES.find((c) => digits.startsWith(c)) ?? digits.slice(0, 2);
    return { kind: 'foreign', countryCode: cc };
  } else {
    return { kind: 'invalid' };
  }

  if (/^01\d{8,9}$/.test(local)) return { kind: 'my-mobile' };
  if (/^0[3-9]\d{7,8}$/.test(local)) return { kind: 'my-landline' };
  if (/^01[38]00\d{6}$/.test(local)) return { kind: 'my-tollfree' };
  return { kind: 'invalid' };
}

/**
 * Analyse a phone number entered in phone mode. Any number that is not a
 * valid Malaysian number is SUSPICIOUS; a valid Malaysian number is SAFE by
 * format, with a reminder that local numbers can still be misused or spoofed.
 */
export function analyzePhone(input: string, language: Language): AnalysisResult {
  const locale: CopyLocale = language === 'en' ? 'en' : 'bm';
  const phrase = (input ?? '').trim();
  const { kind, countryCode } = classifyPhone(phrase);
  const highlightAll: Highlight[] = phrase ? [{ start: 0, end: phrase.length, reason: '' }] : [];

  if (kind === 'foreign' || kind === 'invalid') {
    const reason =
      kind === 'foreign'
        ? locale === 'bm'
          ? `Ini bukan nombor Malaysia (bermula dengan kod negara +${countryCode}). Penipu kerap menghubungi atau menghantar WhatsApp dari nombor luar negara. Jangan jawab panggilan luar negara yang tidak dikenali dan jangan kongsi maklumat.`
          : `This is not a Malaysian number (it starts with country code +${countryCode}). Scammers often call or WhatsApp from overseas numbers. Do not answer unknown foreign calls or share any details.`
        : locale === 'bm'
          ? 'Format nombor ini bukan nombor Malaysia yang sah. Nombor luar biasa atau dipalsukan ialah tanda amaran.'
          : 'This is not a valid Malaysian number format. Unusual or spoofed numbers are a warning sign.';
    const score = kind === 'foreign' ? 55 : 45;
    return {
      riskLevel: 'SUSPICIOUS',
      riskScore: score,
      scamType:
        kind === 'foreign'
          ? SCAM_TYPE_LABEL[locale].foreignNumber
          : locale === 'bm'
            ? 'Nombor tidak sah'
            : 'Invalid number',
      redFlags: [{ phrase, reason }],
      highlights: highlightAll.map((h) => ({ ...h, reason })),
      nextSteps: NEXT_STEPS[locale].slice(),
      summaryForFamily: FAMILY_SUMMARY[locale](LEVEL_LABEL[locale].SUSPICIOUS, score, true),
      confidenceNote: CONFIDENCE_NOTE[locale],
      source: 'fallback',
    };
  }

  const kindLabel: Record<'my-mobile' | 'my-landline' | 'my-tollfree', Record<CopyLocale, string>> = {
    'my-mobile': { bm: 'Nombor telefon bimbit Malaysia', en: 'Malaysian mobile number' },
    'my-landline': { bm: 'Nombor talian tetap Malaysia', en: 'Malaysian landline number' },
    'my-tollfree': { bm: 'Nombor bebas tol Malaysia (1300/1800)', en: 'Malaysian toll-free number (1300/1800)' },
  };
  return {
    riskLevel: 'SAFE',
    riskScore: 10,
    scamType: kindLabel[kind][locale],
    redFlags: [],
    highlights: [],
    nextSteps:
      locale === 'bm'
        ? [
            'Format nombor ini nombor Malaysia yang sah.',
            'Penipu juga boleh guna atau memalsukan nombor tempatan, jadi nilai apa yang mereka minta.',
            'Jangan kongsi OTP, kata laluan, PIN atau nombor IC melalui telefon.',
            'Jika pemanggil mendakwa daripada bank atau agensi, letak telefon dan hubungi nombor rasmi mereka sendiri.',
          ]
        : [
            'This number has a valid Malaysian format.',
            'Scammers can also use or spoof local numbers, so judge what the caller asks for.',
            'Never share an OTP, password, PIN or IC number over the phone.',
            'If the caller claims to be a bank or agency, hang up and call their official number yourself.',
          ],
    summaryForFamily: FAMILY_SUMMARY[locale](LEVEL_LABEL[locale].SAFE, 10, false),
    confidenceNote: CONFIDENCE_NOTE[locale],
    source: 'fallback',
  };
}

export const fallbackAnalyzer = { DEMO_IMAGE_LABEL, analyze, analyzeImage, analyzePhone, classifyPhone, resolveCopyLocale };

export default fallbackAnalyzer;

