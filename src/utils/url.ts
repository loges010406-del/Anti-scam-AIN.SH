/**
 * url — URL validation utilities (Requirement 26.5).
 *
 * Framework-agnostic: this module MUST NOT import React.
 *
 * `isValidUrl` validates a URL's format before the application processes it
 * (R26.5), accepting only well-formed http(s) URLs that have a non-empty
 * host. Anything else — other protocols (javascript:, data:, file:, ftp:),
 * malformed strings, or hostless URLs — is rejected.
 */

/** Protocols the application is permitted to process (R26.5). */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Return `true` only when `value` is a well-formed http(s) URL with a
 * non-empty hostname (R26.5).
 *
 * Uses the native `URL` constructor inside a try/catch so malformed input
 * never throws. The protocol must be in the http/https allowlist and the
 * parsed hostname must be non-empty.
 *
 * @param value the candidate URL string
 */
export function isValidUrl(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  try {
    const parsed = new URL(value.trim());
    return ALLOWED_PROTOCOLS.has(parsed.protocol) && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export const url = { isValidUrl };

export default url;
