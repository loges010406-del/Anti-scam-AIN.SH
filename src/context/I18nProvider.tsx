/**
 * I18nProvider — React context exposing the current language and `t()`
 * (Requirement 22).
 *
 * - Hydrates the initial `language` from `storageService` (`sd.language`),
 *   defaulting to BM (R22.1).
 * - Persists the selected language on change (R22.6).
 * - Exposes `{ language, setLanguage, t }` and a `useI18n()` hook.
 * - All translation logic lives in the framework-agnostic `i18nService`;
 *   this file only binds it to React state. Adding languages needs no change
 *   here — only the `Language` union, a JSON file, and the `locales` registry
 *   (R22.4).
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Language } from '../types';
import { storageService } from '../services/storageService';
import {
  DEFAULT_LANGUAGE,
  getDictionary,
  locales,
  translate,
  type TranslationVars,
} from '../services/i18nService';

/** Persisted-language storage key (allowlisted in storageService). */
const LANGUAGE_KEY = 'sd.language';

/** Shape consumed by components via `useI18n()`. */
export interface I18nContextValue {
  /** Current UI language. */
  language: Language;
  /** Switch language; persists the choice via storageService. */
  setLanguage: (language: Language) => void;
  /** Translate a key with optional `{var}` interpolation. */
  t: (key: string, vars?: TranslationVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Validate a persisted value against the known locale registry. */
function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in locales;
}

/**
 * Read the initial language from storage, defaulting to BM (R22.1). Guards
 * against a stale/invalid persisted value by validating against `locales`.
 */
function readInitialLanguage(): Language {
  const stored = storageService.get<Language>(LANGUAGE_KEY, DEFAULT_LANGUAGE);
  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    // Persist on change (R22.6). storageService never throws.
    storageService.set<Language>(LANGUAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, vars?: TranslationVars) =>
      translate(getDictionary(language), key, vars),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Access the i18n context. Throws if used outside an `I18nProvider` so
 * misuse is caught early in development.
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx === null) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

export default I18nProvider;
