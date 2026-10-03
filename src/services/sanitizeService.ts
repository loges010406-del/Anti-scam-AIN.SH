/**
 * sanitizeService — HTML sanitisation for user-supplied content
 * (Requirements 26.4, 27.3).
 *
 * Framework-agnostic: this module MUST NOT import React and MUST NOT rely on
 * `dangerouslySetInnerHTML`. Consumers render the returned string as plain
 * text nodes.
 *
 * Strategy: escape the five HTML-significant characters (& < > " ') to their
 * named/numeric entities. Escaping (rather than tag stripping) preserves the
 * user's literal text while guaranteeing the key invariant: the output
 * contains no live HTML or script — any `<`, `>`, or quote that could open a
 * tag or attribute boundary is neutralised before it reaches the DOM.
 *
 * `&` is escaped first so that entities introduced by later replacements are
 * not themselves double-escaped.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape HTML-significant characters in `input` so the result can be rendered
 * safely without injecting markup or scripts (R26.4, R27.3).
 *
 * @param input the raw, user-supplied text
 * @returns an HTML-safe string containing no live tags or scripts
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

export const sanitizeService = { sanitize };

export default sanitizeService;
