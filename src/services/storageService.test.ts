/**
 * Property-based tests for storageService (Requirement 28, 26.1).
 *
 * Covers:
 * - Property 9: Persisted state round-trips and survives storage failure
 *   (Validates: Requirements 16.6, 17.2, 22.6, 28.2, 28.3)
 * - Property 10: Only allowlisted keys are ever persisted
 *   (Validates: Requirements 26.1, 28.1)
 *
 * fast-check is run with at least 100 iterations per property.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { storageService, ALLOWED_KEYS } from './storageService';

const NUM_RUNS = 100;

/**
 * A generator for arbitrary JSON-serialisable values. We constrain to values
 * that survive a JSON.stringify -> JSON.parse round-trip exactly (no NaN,
 * Infinity, -0, functions, or undefined-in-objects surprises) so deep-equality
 * is a faithful assertion of the service's contract.
 */
const jsonValue = (): fc.Arbitrary<unknown> =>
  fc.jsonValue() as fc.Arbitrary<unknown>;

/** Generator for the four allowlisted keys. */
const allowedKey = (): fc.Arbitrary<string> =>
  fc.constantFrom(...(ALLOWED_KEYS as readonly string[]));

/** Generator for keys that are guaranteed NOT in the allowlist. */
const disallowedKey = (): fc.Arbitrary<string> =>
  fc
    .string({ minLength: 1, maxLength: 40 })
    .filter((k) => !(ALLOWED_KEYS as readonly string[]).includes(k));

afterEach(() => {
  // Reset any spies and clear real storage between cases so state does not
  // leak across property runs.
  vi.restoreAllMocks();
  try {
    for (const key of ALLOWED_KEYS) {
      storageService.remove(key);
    }
    localStorage.clear();
  } catch {
    // ignore — storage may be stubbed to throw in a prior case
  }
});

describe('Feature: semak-dulu, Property 9 — persisted state round-trips and survives storage failure', () => {
  it('round-trips arbitrary JSON values through set/get for every allowlisted key', () => {
    fc.assert(
      fc.property(allowedKey(), jsonValue(), (key, value) => {
        storageService.set(key, value);
        const read = storageService.get(key, Symbol('fallback') as unknown);
        // Compare against the JSON-normalised expectation: values such as -0
        // round-trip through JSON.stringify/JSON.parse as +0. That is correct
        // JSON semantics, not a storageService bug, so the assertion must
        // account for it while still proving the value round-trips.
        const expected = JSON.parse(JSON.stringify(value));
        expect(read).toEqual(expected);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('still round-trips via the in-memory fallback when localStorage throws, and never throws', () => {
    fc.assert(
      fc.property(allowedKey(), jsonValue(), (key, value) => {
        // Simulate a hostile storage backend (private mode / quota / blocked):
        // every direct localStorage access throws.
        const boom = () => {
          throw new DOMException('blocked', 'SecurityError');
        };
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);

        // The service must not throw on write...
        expect(() => storageService.set(key, value)).not.toThrow();

        // ...and must still return the value from the in-memory mirror on read.
        let read: unknown;
        expect(() => {
          read = storageService.get(key, Symbol('fallback') as unknown);
        }).not.toThrow();
        // Compare against the JSON-normalised expectation: values such as -0
        // round-trip through JSON.stringify/JSON.parse as +0. That is correct
        // JSON semantics, not a storageService bug, so the assertion must
        // account for it while still proving the value round-trips.
        const expected = JSON.parse(JSON.stringify(value));
        expect(read).toEqual(expected);

        // remove must also stay resilient.
        expect(() => storageService.remove(key)).not.toThrow();
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('returns the provided fallback for an allowlisted key that was never set', () => {
    fc.assert(
      fc.property(allowedKey(), jsonValue(), (key, fallback) => {
        storageService.remove(key);
        localStorage.removeItem(key);
        const read = storageService.get(key, fallback);
        expect(read).toEqual(fallback);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

describe('Feature: semak-dulu, Property 10 — only allowlisted keys are ever persisted', () => {
  it('never writes a non-allowlisted key to localStorage and get() returns the fallback', () => {
    fc.assert(
      fc.property(disallowedKey(), jsonValue(), jsonValue(), (key, value, fallback) => {
        const setSpy = vi.spyOn(Storage.prototype, 'setItem');

        storageService.set(key, value);

        // The service must never have persisted this key to localStorage.
        const wroteKey = setSpy.mock.calls.some(([writtenKey]) => writtenKey === key);
        expect(wroteKey).toBe(false);
        expect(localStorage.getItem(key)).toBeNull();

        // get() for a non-allowlisted key always yields the fallback.
        expect(storageService.get(key, fallback)).toEqual(fallback);

        setSpy.mockRestore();
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('persists allowlisted keys to localStorage when it is available', async () => {
    // Use a freshly-loaded module so the service re-probes a healthy
    // localStorage backend, independent of any downgrade a prior test's
    // storage-failure simulation may have triggered on the shared singleton.
    vi.resetModules();
    const { storageService: freshService } = await import('./storageService');

    fc.assert(
      fc.property(allowedKey(), jsonValue(), (key, value) => {
        const setSpy = vi.spyOn(Storage.prototype, 'setItem');

        freshService.set(key, value);

        const wroteKey = setSpy.mock.calls.some(([writtenKey]) => writtenKey === key);
        expect(wroteKey).toBe(true);
        // And the serialised value is actually readable back out of localStorage.
        expect(localStorage.getItem(key)).toBe(JSON.stringify(value));

        setSpy.mockRestore();
      }),
      { numRuns: NUM_RUNS },
    );
  });
});
