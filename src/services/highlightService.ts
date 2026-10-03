/**
 * highlightService — total, crash-proof highlight segmentation
 * (Requirements 9.1, 9.3).
 *
 * Framework-agnostic: this module MUST NOT import React and MUST NOT rely on
 * `dangerouslySetInnerHTML`. Consumers render each segment's `text` as a plain
 * text node (highlighted segments as a `<button>` exposing `reason`).
 *
 * `buildSegments(text, highlights)` turns an arbitrary `(text, highlights)`
 * pair into an ordered list of non-overlapping segments whose concatenated
 * `text` equals the original text exactly. It never throws, regardless of how
 * malformed the inputs are. The guarantees it upholds (design "Highlight
 * Robustness", Property 2):
 *
 *   1. Index validation — a highlight is kept only when `start` and `end` are
 *      integers and `0 <= start < end <= text.length`. Out-of-range,
 *      non-integer, inverted (`start >= end`), and zero-length ranges are
 *      discarded (R9.3).
 *   2. Keyword fallback — if the caller supplied highlights but none survive
 *      validation, suspicious phrases are located with the shared signal
 *      scanner so something meaningful is still marked (R9.3).
 *   3. Overlap resolution — surviving ranges are sorted and de-duplicated;
 *      overlapping ranges are clipped so the output never overlaps.
 *   4. Totality — the returned segments tile the entire text with no gaps and
 *      no overlaps, so `segments.map(s => s.text).join('') === text` (R9.1).
 *
 * The service reuses {@link findSignals} from the scoring model for its
 * keyword fallback, keeping highlighted phrases consistent with the signals
 * the fallback analyzer scores against.
 */

import type { Highlight } from '../types';
import { findSignals } from '../utils/scoring';

/** A single render segment produced by {@link buildSegments}. */
export interface Segment {
  /** The slice of the original text this segment covers. */
  text: string;
  /** Whether this slice should be visually marked as suspicious. */
  highlighted: boolean;
  /** Plain-language explanation; present only on highlighted segments. */
  reason?: string;
}

/** An internal, validated and sorted highlight range. */
interface Range {
  start: number;
  end: number;
  reason: string;
}

/**
 * True when `h` is a usable highlight for `text`: both offsets are integers
 * and `0 <= start < end <= text.length` (R9.3). Non-integer, inverted,
 * zero-length, and out-of-range values are rejected.
 */
function isValidRange(h: Highlight | null | undefined, textLength: number): boolean {
  if (h === null || typeof h !== 'object') {
    return false;
  }
  const { start, end } = h;
  return (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    start < end &&
    end <= textLength
  );
}

/**
 * Keyword fallback (R9.3): locate suspicious phrases in `text` using the
 * shared signal scanner. Each match becomes a highlight whose `reason` names
 * the matched signal group. Returns an empty array when nothing matches.
 */
function keywordFallback(text: string): Range[] {
  const matches = findSignals(text);
  const ranges: Range[] = [];
  for (const m of matches) {
    // findSignals already guarantees in-range, non-inverted offsets, but we
    // revalidate so this path upholds the same contract as caller highlights.
    if (
      Number.isInteger(m.start) &&
      Number.isInteger(m.end) &&
      m.start >= 0 &&
      m.start < m.end &&
      m.end <= text.length
    ) {
      ranges.push({ start: m.start, end: m.end, reason: m.groupName });
    }
  }
  return ranges;
}

/**
 * Sort ranges and resolve overlaps so the result is strictly non-overlapping.
 *
 * Ranges are sorted by `start` (then `end`). Walking left to right, each range
 * is clipped to begin at or after the previous range's end; ranges that are
 * fully swallowed are dropped. Earlier ranges win the contested region, which
 * keeps the behaviour deterministic. The first range's `reason` is preserved.
 */
function dedupeAndResolveOverlaps(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const resolved: Range[] = [];
  let cursor = 0;
  for (const r of sorted) {
    const start = Math.max(r.start, cursor);
    const end = r.end;
    if (start < end) {
      resolved.push({ start, end, reason: r.reason });
      cursor = end;
    }
    // else: fully covered by an earlier range — drop it.
  }
  return resolved;
}

/**
 * Build an ordered list of non-overlapping render segments for `text`.
 *
 * The concatenation of the returned segments' `text` equals `text` exactly,
 * every highlighted segment lies within the text bounds, and the function
 * never throws for any input (R9.1, R9.3; Property 2).
 *
 * @param text the (already-sanitized) submitted text to segment
 * @param highlights candidate highlight ranges (possibly malformed/empty)
 * @returns non-overlapping segments tiling the whole text
 */
export function buildSegments(
  text: unknown,
  highlights: unknown,
): Segment[] {
  // Totality guard: anything that is not a non-empty string yields a single
  // (possibly empty) unhighlighted segment, so the renderer never blanks.
  const safeText = typeof text === 'string' ? text : '';
  if (safeText.length === 0) {
    return [{ text: '', highlighted: false }];
  }

  const inputHighlights = Array.isArray(highlights) ? (highlights as Highlight[]) : [];

  // 1. Validate caller-supplied ranges (R9.3).
  let valid: Range[] = [];
  for (const h of inputHighlights) {
    if (isValidRange(h, safeText.length)) {
      valid.push({ start: h.start, end: h.end, reason: typeof h.reason === 'string' ? h.reason : '' });
    }
  }

  // 2. Keyword fallback when highlights were supplied but none are valid.
  if (valid.length === 0 && inputHighlights.length > 0) {
    valid = keywordFallback(safeText);
  }

  // 3. Resolve overlaps so segments never overlap.
  const ranges = dedupeAndResolveOverlaps(valid);

  // 4. Splice the text into alternating plain / highlighted segments. The
  //    cursor-based walk guarantees full coverage with no gaps or overlaps.
  const segments: Segment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      segments.push({ text: safeText.slice(cursor, r.start), highlighted: false });
    }
    segments.push({ text: safeText.slice(r.start, r.end), highlighted: true, reason: r.reason });
    cursor = r.end;
  }
  if (cursor < safeText.length) {
    segments.push({ text: safeText.slice(cursor), highlighted: false });
  }

  // No ranges at all → a single unhighlighted segment covering the full text.
  if (segments.length === 0) {
    segments.push({ text: safeText, highlighted: false });
  }

  return segments;
}

export const highlightService = { buildSegments };

export default highlightService;
