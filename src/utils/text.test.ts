/**
 * Property-based tests for text input-safety utilities (Requirement 26.3).
 *
 * Covers:
 * - Property 14: Oversized input is truncated to the maximum
 *   (Validates: Requirements 26.3)
 *
 * fast-check is run with at least 100 iterations per property.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { truncate, MAX_INPUT_LEN } from './text';

const NUM_RUNS = 100;

describe('Feature: semak-dulu, Property 14 — oversized input is truncated to the maximum', () => {
  it('for arbitrary input and arbitrary max, the result is a bounded prefix of input', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: -10, max: MAX_INPUT_LEN * 2 }),
        (input, max) => {
          const result = truncate(input, max);

          // Never exceeds the requested maximum (treating non-positive max as 0).
          const effectiveMax = Math.max(0, max);
          expect(result.length).toBeLessThanOrEqual(effectiveMax);

          // The result is always a prefix of the original input.
          expect(input.startsWith(result)).toBe(true);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('truncates inputs longer than MAX_INPUT_LEN exactly to MAX_INPUT_LEN (default max)', () => {
    fc.assert(
      fc.property(
        // Generate strings strictly longer than the cap.
        fc.string({ minLength: MAX_INPUT_LEN + 1, maxLength: MAX_INPUT_LEN + 500 }),
        (input) => {
          const result = truncate(input);

          expect(result.length).toBe(MAX_INPUT_LEN);
          expect(input.startsWith(result)).toBe(true);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('leaves inputs no longer than max unchanged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_INPUT_LEN }).chain((max) =>
          fc
            .string({ minLength: 0, maxLength: max })
            .map((input) => [input, max] as const),
        ),
        ([input, max]) => {
          const result = truncate(input, max);
          expect(result).toBe(input);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('returns an empty string for a non-positive max', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: -1000, max: 0 }), (input, max) => {
        expect(truncate(input, max)).toBe('');
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
