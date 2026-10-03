/**
 * i18nService — framework-agnostic internationalisation core (Requirement 22).
 *
 * This module MUST NOT import React. The `I18nProvider` wraps this logic in
 * React context; keeping the lookup pure makes it trivially testable and lets
 * services (e.g. the fallback analyzer) localise strings without a component.
 *
 * Guarantees / design:
 * - BM (`ms`) is the default and the fallback dictionary (R22.1).
 * - All UI copy is sourced from `ms.json` / `en.json` — no hardcoded strings
 *   in components (R22.3).
 * - Adding a language (`zh`, `ta`, ...) means adding its JSON file and one
 *   entry to the `locales` registry below; no component changes required
 *   (R22.4). The `Language` union and this registry are the single points of
 *   change.
 * - `t()` substitutes `{var}` placeholders and never throws: a missing key
 *   falls back to the default-language value, then to the raw key, so the UI
 *   always renders something sensible.
 */

import type { Language } from '../types';
import ms from '../i18n/ms.json';
import en from '../i18n/en.json';

/** A flat, dot-namespaced translation dictionary (e.g. `"nav.check"`). */
export type Dictionary = Record<string, string>;

/** Variables substituted into `{placeholder}` tokens within a string. */
export type TranslationVars = Record<string, string | number>;

/** The default language. Its dictionary is the ultimate lookup fallback. */
export const DEFAULT_LANGUAGE: Language = 'ms';

/**
 * Registry mapping every supported `Language` to its dictionary.
 *
 * EXTENSIBILITY (R22.4): to add Mandarin/Tamil, add `zh`/`ta` to the
 * `Language` union in `types/index.ts`, create `i18n/zh.json` / `i18n/ta.json`
 * with the same keys, and register them here. No component or `t()` caller
 * changes are needed because components only reference string keys.
 */
export const locales: Record<Language, Dictionary> = {
  ms: ms as Dictionary,
  en: en as Dictionary,
};

/** Match `{name}` placeholders; captures the inner variable name. */
const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Substitute `{var}` placeholders in a template using `vars`. Unknown
 * placeholders are left intact so a template bug is visible rather than
 * silently dropped.
 */
function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) {
    return template;
  }
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Resolve `key` within `dict`, falling back to the default-language
 * dictionary, then to the key itself. Guarantees a non-undefined string.
 */
function resolve(dict: Dictionary, key: string): string {
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }
  const fallback = locales[DEFAULT_LANGUAGE];
  if (dict !== fallback && Object.prototype.hasOwnProperty.call(fallback, key)) {
    return fallback[key];
  }
  // Last resort: surface the key so a missing translation is obvious in the UI.
  return key;
}

/** Return the dictionary for `language`, defaulting to BM for safety. */
export function getDictionary(language: Language): Dictionary {
  return locales[language] ?? locales[DEFAULT_LANGUAGE];
}

/**
 * Translate `key` using an explicit dictionary and optional interpolation
 * variables. Pure and framework-agnostic.
 *
 * @example translate(dict, 'result.scoreOutOf', { score: 72 }) // "72 daripada 100"
 */
export function translate(
  dict: Dictionary,
  key: string,
  vars?: TranslationVars,
): string {
  return interpolate(resolve(dict, key), vars);
}

/**
 * Convenience: translate by `language` rather than a pre-resolved dictionary.
 * Useful for services that hold a language but not a dictionary reference.
 */
export function translateFor(
  language: Language,
  key: string,
  vars?: TranslationVars,
): string {
  return translate(getDictionary(language), key, vars);
}
