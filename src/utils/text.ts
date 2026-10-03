/**
 * text — input-safety text utilities (Requirement 26.3).
 *
 * Framework-agnostic: this module MUST NOT import React.
 *
 * Responsibilities:
 * - Enforce a hard upper bound on user input length by truncating to a
 *   prefix of the original input (R26.3), so downstream analysis and
 *   rendering can never receive an unbounded payload.
 * - Provide normalisation helpers that trim and collapse whitespace and
 *   apply Unicode normalisation for consistent, comparable input.
 */

/**
 * Maximum number of characters the application will process from any single
 * user input. Inputs longer than this are truncated to a prefix before
 * analysis (R26.3). Chosen to comfortably fit long scam messages while
 * bounding memory and request size.
 */
export const MAX_INPUT_LEN = 4000;

/**
 * Truncate `input` to at most `max` characters, returning a prefix of the
 * original string (R26.3).
 *
 * Guarantees:
 * - The result is always a prefix of `input` (`input.startsWith(result)`).
 * - The result length never exceeds `max`.
 * - A non-positive `max` yields an empty string.
 *
 * @param input the raw user input
 * @param max   the maximum length (defaults to {@link MAX_INPUT_LEN})
 */
export function truncate(input: string, max: number = MAX_INPUT_LEN): string {
  if (max <= 0) {
    return '';
  }
  return input.slice(0, max);
}

/**
 * Normalise user input for consistent processing and comparison.
 *
 * Steps:
 * - Unicode-normalise to NFC so visually identical strings compare equal.
 * - Collapse all runs of whitespace (including tabs/newlines) to a single
 *   space.
 * - Trim leading and trailing whitespace.
 *
 * This does not alter semantic content; it only canonicalises spacing and
 * Unicode form.
 *
 * @param input the raw user input
 */
export function normalize(input: string): string {
  return input.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export const text = { MAX_INPUT_LEN, truncate, normalize };

export default text;
