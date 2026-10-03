/**
 * Property-based tests for sanitizeService (Requirements 26.4, 27.3).
 *
 * Covers:
 * - Property 7: Rendered content is sanitized against injection
 *   (Validates: Requirements 26.4, 27.3)
 *
 * fast-check is run with at least 100 iterations per property.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sanitize } from './sanitizeService';

const NUM_RUNS = 100;

describe('Feature: semak-dulu, Property 7 — rendered content is sanitized against injection', () => {
  it('output never contains a raw < or > for arbitrary input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const out = sanitize(input);
        // The angle brackets that could open/close an HTML tag must be gone.
        expect(out.includes('<')).toBe(false);
        expect(out.includes('>')).toBe(false);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('output never contains raw HTML-significant characters, even with injected markup', () => {
    // Weave HTML-significant characters and tag-like fragments into the input
    // so the generator actively explores injection-shaped strings.
    const dangerousChar = fc.constantFrom('<', '>', '&', '"', "'", '/');
    const tagFragment = fc.constantFrom(
      '<script>',
      '</script>',
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
      '<a href="javascript:alert(1)">',
      '"><b>',
      "'';!--\"<XSS>=&{()}",
    );
    const spicyString = fc
      .array(fc.oneof(fc.string(), dangerousChar, tagFragment), { maxLength: 20 })
      .map((parts) => parts.join(''));

    fc.assert(
      fc.property(spicyString, (input) => {
        const out = sanitize(input);
        // None of the five HTML-significant characters survive as raw text.
        expect(out.includes('<')).toBe(false);
        expect(out.includes('>')).toBe(false);
        expect(out.includes('"')).toBe(false);
        expect(out.includes("'")).toBe(false);

        // Every original '<' becomes an escaped entity, so no live tag can form.
        const rawOpens = (input.match(/</g) ?? []).length;
        const escapedOpens = (out.match(/&lt;/g) ?? []).length;
        expect(escapedOpens).toBe(rawOpens);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('neutralises known injection payloads', () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
      [
        '<img src=x onerror=alert(1)>',
        '&lt;img src=x onerror=alert(1)&gt;',
      ],
      ['"><svg/onload=alert(1)>', '&quot;&gt;&lt;svg/onload=alert(1)&gt;'],
      ["<a href='javascript:void(0)'>x</a>", "&lt;a href=&#39;javascript:void(0)&#39;&gt;x&lt;/a&gt;"],
    ];

    for (const [payload, expected] of cases) {
      const out = sanitize(payload);
      expect(out).toBe(expected);
      // Defence-in-depth: no raw tag delimiters remain.
      expect(out.includes('<')).toBe(false);
      expect(out.includes('>')).toBe(false);
    }
  });

  it('escapes & first so entities are not double-escaped incorrectly', () => {
    // A literal ampersand followed by a tag must produce &amp; then &lt;...,
    // never corrupt an already-escaped sequence.
    const out = sanitize('a & b <c>');
    expect(out).toBe('a &amp; b &lt;c&gt;');
  });
});
