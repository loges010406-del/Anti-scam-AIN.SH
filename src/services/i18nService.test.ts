/**
 * Tests for the i18n core (Requirement 22).
 *
 * Covers:
 * - Property 21: Translation dictionaries have identical keys
 *   (Validates: Requirements 22.3)
 *
 * For any key present in `ms.json`, the same key SHALL be present in `en.json`
 * (and vice versa), and `t(key)` SHALL resolve to a non-empty string for every
 * key in the dictionary.
 *
 * The property-based portion runs fast-check with at least 100 iterations: it
 * draws an arbitrary key from the union of both dictionaries' keys and asserts
 * the key exists in BOTH dictionaries resolving to a non-empty string. A direct
 * set-equality assertion complements the sampling-based property so the parity
 * guarantee is proven exhaustively, not just probabilistically.
 *
 * A handful of example-based unit tests additionally exercise the service's
 * `translate()` behaviour (missing-key fallback and `{var}` interpolation).
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import ms from '../i18n/ms.json';
import en from '../i18n/en.json';
import {
  translate,
  translateFor,
  getDictionary,
  type Dictionary,
} from './i18nService';

const NUM_RUNS = 100;

// Treat the imported JSON as flat string dictionaries, matching the i18nService
// contract (dot-namespaced keys mapping to localised strings).
const msDict = ms as Dictionary;
const enDict = en as Dictionary;

const msKeys = Object.keys(msDict);
const enKeys = Object.keys(enDict);

// The union of all keys across both dictionaries. Property 21 asks that this
// union be identical to each dictionary's own key set.
const unionKeys = Array.from(new Set([...msKeys, ...enKeys]));

/** Generator drawing an arbitrary key from the union of both dictionaries. */
const unionKey = (): fc.Arbitrary<string> => fc.constantFrom(...unionKeys);

/** True when `value` is a present, non-empty (post-trim) string. */
function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

describe('Feature: semak-dulu, Property 21 — translation dictionaries have identical keys', () => {
  it('ms.json and en.json have exactly equal key sets (no extras in either)', () => {
    const msSet = new Set(msKeys);
    const enSet = new Set(enKeys);

    const missingInEn = msKeys.filter((k) => !enSet.has(k));
    const missingInMs = enKeys.filter((k) => !msSet.has(k));

    // Surfacing the exact offenders makes any future drift trivial to diagnose.
    expect(missingInEn, `keys in ms.json missing from en.json`).toEqual([]);
    expect(missingInMs, `keys in en.json missing from ms.json`).toEqual([]);

    // Direct set equality: same size and same members.
    expect(msSet.size).toBe(enSet.size);
    expect([...msSet].sort()).toEqual([...enSet].sort());
  });

  it('every key in the union exists in BOTH dictionaries with a non-empty string value', () => {
    fc.assert(
      fc.property(unionKey(), (key) => {
        // Parity: the key must be an own-property of both dictionaries.
        expect(Object.prototype.hasOwnProperty.call(msDict, key)).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(enDict, key)).toBe(true);

        // Non-emptiness: both localised values must be meaningful strings.
        expect(isNonEmptyString(msDict[key])).toBe(true);
        expect(isNonEmptyString(enDict[key])).toBe(true);

        // And the service resolves each key to a non-empty string per locale
        // (never falling through to the raw key or an empty value).
        expect(isNonEmptyString(translateFor('ms', key))).toBe(true);
        expect(isNonEmptyString(translateFor('en', key))).toBe(true);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('resolves every declared key to a non-empty string in both locales (exhaustive)', () => {
    for (const key of unionKeys) {
      expect(isNonEmptyString(translateFor('ms', key)), `ms:${key}`).toBe(true);
      expect(isNonEmptyString(translateFor('en', key)), `en:${key}`).toBe(true);
    }
  });
});

describe('Feature: semak-dulu — i18nService translate() behaviour', () => {
  it('substitutes {var} placeholders', () => {
    expect(translate(enDict, 'result.scoreOutOf', { score: 72 })).toBe(
      '72 out of 100',
    );
    expect(translate(msDict, 'result.scoreOutOf', { score: 72 })).toBe(
      '72 daripada 100',
    );
  });

  it('leaves unknown placeholders intact rather than dropping them', () => {
    const dict: Dictionary = { greeting: 'Hi {name}, score {score}' };
    expect(translate(dict, 'greeting', { name: 'Ali' })).toBe(
      'Hi Ali, score {score}',
    );
  });

  it('falls back to the raw key when the key is missing everywhere', () => {
    expect(translate(enDict, 'does.not.exist')).toBe('does.not.exist');
  });

  it('falls back to the default (ms) dictionary for a key missing in the target locale', () => {
    const partialEn: Dictionary = {};
    // ms is the default/fallback dictionary; a key absent from the given
    // dictionary should resolve via the default locale.
    expect(translate(partialEn, 'nav.check')).toBe(msDict['nav.check']);
  });

  it('getDictionary returns the requested locale and defaults safely', () => {
    expect(getDictionary('ms')).toBe(msDict);
    expect(getDictionary('en')).toBe(enDict);
  });
});
