/**
 * reportService — build a copy-ready scam report (Requirement 20).
 *
 * Framework-agnostic: this module MUST NOT import React. It turns a
 * `ReportInput` into a single plain-text block the user can copy and submit
 * themselves to the appropriate channel. There is deliberately NO submission
 * logic here — the product never auto-submits a report to any authority
 * (Requirements 20.3, 29.3). The UI owns the copy-to-clipboard control.
 *
 * `buildReport` is pure and total: any `ReportInput` produces a string. Empty
 * fields are rendered as a neutral placeholder so the structure stays readable,
 * while every non-empty field value and every detected indicator is guaranteed
 * to appear verbatim in the output (design Property 17).
 */

import type { ReportInput } from '../types';

/** Shown in place of a field the user left blank. */
const EMPTY_PLACEHOLDER = '-';

/** Fixed, human-readable labels for the ordered report fields. */
const FIELD_LABELS = {
  scamType: 'Scam type / Jenis penipuan',
  message: 'Message / Mesej',
  sender: 'Sender / Penghantar',
  date: 'Date / Tarikh',
  link: 'Link / Pautan',
} as const;

/** Header line and the indicators section heading. */
const REPORT_TITLE = 'Scam Report / Laporan Penipuan';
const INDICATORS_HEADING = 'Detected indicators / Petunjuk dikesan';
const NO_INDICATORS = 'None detected / Tiada dikesan';

/** Render a single value, substituting a placeholder for blank/whitespace. */
function renderValue(value: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed.length > 0 ? trimmed : EMPTY_PLACEHOLDER;
}

/**
 * Build a copy-ready report containing the scam type, message, sender, date,
 * link, and the detected indicators (Requirement 20.1).
 *
 * The output is a single newline-delimited block. Field values are included
 * verbatim; the only transformation is trimming surrounding whitespace and
 * substituting a placeholder for empty fields so the layout stays legible.
 *
 * @param input user-provided report fields
 * @returns a plain-text report ready to copy and submit manually
 */
export function buildReport(input: ReportInput): string {
  const indicators = Array.isArray(input?.indicators)
    ? input.indicators.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((item) => item.length > 0)
    : [];

  const lines: string[] = [
    REPORT_TITLE,
    '',
    `${FIELD_LABELS.scamType}: ${renderValue(input?.scamType ?? '')}`,
    `${FIELD_LABELS.sender}: ${renderValue(input?.sender ?? '')}`,
    `${FIELD_LABELS.date}: ${renderValue(input?.date ?? '')}`,
    `${FIELD_LABELS.link}: ${renderValue(input?.link ?? '')}`,
    '',
    `${FIELD_LABELS.message}:`,
    renderValue(input?.message ?? ''),
    '',
    `${INDICATORS_HEADING}:`,
  ];

  if (indicators.length > 0) {
    for (const indicator of indicators) {
      lines.push(`- ${indicator}`);
    }
  } else {
    lines.push(NO_INDICATORS);
  }

  return lines.join('\n');
}

export const reportService = { buildReport };

export default reportService;
