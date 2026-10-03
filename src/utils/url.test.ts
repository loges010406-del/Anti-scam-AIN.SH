/**
 * Property-based tests for URL validation utilities (Requirement 26.5).
 *
 * Covers:
 * - Property 15: URL validation accepts only well-formed http(s) URLs
 *   (Validates: Requirements 26.5)
 *
 * fast-check is run with at least 100 iterations per property.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isValidUrl } from './url';

const NUM_RUNS = 100;

describe('Feature: semak-dulu, Property 15 — URL validation accepts only well-formed http(s) URLs', () => {
  it('accepts generated well-formed http/https URLs', () => {
    fc.assert(
      fc.property(fc.webUrl(), (validUrl) => {
        // fc.webUrl() produces http(s) URLs with a non-empty host.
        expect(isValidUrl(validUrl)).toBe(true);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('accepts http/https URLs even with surrounding whitespace', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { maxLength: 5 }),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { maxLength: 5 }),
        (validUrl, lead, trail) => {
          expect(isValidUrl(`${lead}${validUrl}${trail}`)).toBe(true);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('rejects non-http(s) schemes', () => {
    const dangerousSchemes = ['javascript:', 'data:', 'file:', 'ftp:', 'mailto:', 'tel:'];
    fc.assert(
      fc.property(
        fc.constantFrom(...dangerousSchemes),
        // A plausible-looking remainder after the scheme.
        fc.string(),
        (scheme, rest) => {
          // Build e.g. "javascript:alert(1)", "data:text/html,...", "ftp://host/x".
          const candidate = `${scheme}${rest}`;
          expect(isValidUrl(candidate)).toBe(false);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('rejects concrete known-dangerous payloads', () => {
    const payloads = [
      'javascript:alert(1)',
      'javascript:void(0)',
      'data:text/html,<script>alert(1)</script>',
      'data:text/plain;base64,SGVsbG8=',
      'file:///etc/passwd',
      'file://C:/Windows/System32',
      'ftp://example.com/resource',
      'mailto:someone@example.com',
      'tel:+60123456789',
    ];
    for (const payload of payloads) {
      expect(isValidUrl(payload)).toBe(false);
    }
  });

  it('rejects empty and whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v'), { maxLength: 20 }),
        (blank) => {
          expect(isValidUrl(blank)).toBe(false);
        },
      ),
      { numRuns: NUM_RUNS },
    );
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects arbitrary malformed strings that do not parse as http(s) URLs', () => {
    fc.assert(
      fc.property(
        fc
          .string()
          // Exclude anything the parser could legitimately accept as a URL.
          .filter((s) => {
            const trimmed = s.trim();
            if (trimmed === '') return false;
            try {
              const parsed = new URL(trimmed);
              const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
              // Keep only strings that are NOT valid http(s)-with-host URLs.
              return !(isHttp && parsed.hostname.length > 0);
            } catch {
              return true; // unparseable → definitely malformed
            }
          }),
        (malformed) => {
          expect(isValidUrl(malformed)).toBe(false);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});
