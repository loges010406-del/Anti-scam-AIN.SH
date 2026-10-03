/**
 * storageService — resilient localStorage wrapper (Requirement 28).
 *
 * Framework-agnostic: this module MUST NOT import React.
 *
 * Guarantees:
 * - All reads and writes are wrapped in try/catch (R28.2).
 * - When localStorage is unavailable (private mode, quota, blocked, SSR),
 *   the service transparently falls back to an in-memory Map so the app
 *   keeps working with in-memory defaults (R28.3).
 * - Only the four allowlisted keys are ever persisted; any other key is
 *   rejected/ignored (R28.1, R26.1).
 * - Nothing is ever sent to a backend (R28.4, R27.2).
 */

/** The only keys the application is permitted to persist (R28.1). */
export const ALLOWED_KEYS = [
  'sd.language',
  'sd.prefs',
  'sd.family',
  'sd.quiz',
] as const;

export type StorageKey = (typeof ALLOWED_KEYS)[number];

/** Which backend the service is currently using. */
type Backend = 'local' | 'memory';

/**
 * In-memory fallback used whenever localStorage throws or is unavailable.
 * Also used as the mirror target so a later storage failure still retains
 * values written during the session.
 */
const memory = new Map<string, string>();

/** Narrow an arbitrary key to the allowlist (R28.1). */
function isAllowedKey(key: string): key is StorageKey {
  return (ALLOWED_KEYS as readonly string[]).includes(key);
}

/**
 * Probe for a usable localStorage by attempting a write + remove inside a
 * try/catch. Any throw (no window, SecurityError, QuotaExceededError, etc.)
 * selects the in-memory backend (R28.2, R28.3).
 */
function detectBackend(): Backend {
  try {
    if (typeof localStorage === 'undefined') {
      return 'memory';
    }
    const probe = '__sd_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return 'local';
  } catch {
    return 'memory';
  }
}

let backend: Backend = detectBackend();

/** Read a raw string value, preferring localStorage, falling back to memory. */
function readRaw(key: string): string | null {
  if (backend === 'local') {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return value;
      }
    } catch {
      // localStorage became unavailable mid-session: downgrade and continue.
      backend = 'memory';
    }
  }
  return memory.has(key) ? (memory.get(key) as string) : null;
}

/** Write a raw string value to localStorage, mirroring to memory on failure. */
function writeRaw(key: string, raw: string): void {
  // Always mirror to memory so an in-session read succeeds even if the
  // persistent write throws (quota, private mode).
  memory.set(key, raw);
  if (backend === 'local') {
    try {
      localStorage.setItem(key, raw);
    } catch {
      backend = 'memory';
    }
  }
}

/** Remove a value from both backends. */
function removeRaw(key: string): void {
  memory.delete(key);
  if (backend === 'local') {
    try {
      localStorage.removeItem(key);
    } catch {
      backend = 'memory';
    }
  }
}

export const storageService = {
  /**
   * Read and JSON-parse a persisted value. Returns `fallback` when the key is
   * not allowlisted, is absent, or cannot be parsed. Never throws (R28.2).
   */
  get<T>(key: string, fallback: T): T {
    if (!isAllowedKey(key)) {
      return fallback;
    }
    try {
      const raw = readRaw(key);
      if (raw === null) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /**
   * JSON-serialise and persist a value. Silently ignores non-allowlisted keys
   * (R28.1) and never throws; falls back to the in-memory map on any storage
   * failure (R28.3).
   */
  set<T>(key: string, value: T): void {
    if (!isAllowedKey(key)) {
      return;
    }
    try {
      writeRaw(key, JSON.stringify(value));
    } catch {
      // JSON.stringify can throw (e.g. circular refs); swallow to stay resilient.
    }
  },

  /** Remove a persisted value. Ignores non-allowlisted keys; never throws. */
  remove(key: string): void {
    if (!isAllowedKey(key)) {
      return;
    }
    try {
      removeRaw(key);
    } catch {
      // Stay resilient on any unexpected failure.
    }
  },
};

export default storageService;
