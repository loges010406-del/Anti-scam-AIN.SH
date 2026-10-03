// src/components/common/LiveRegion.tsx
//
// A polite ARIA live region used to announce dynamic state changes to screen
// reader users without stealing focus — for example the loading→result
// transition on the Check page, and Call Coach tactic alerts (Requirement 25.4).
//
// The region is visually hidden by default (so it does not affect layout) but
// remains in the accessibility tree. Updating `message` causes assistive tech
// to announce the new text. Rendering an empty region on mount means later
// updates are reliably announced as changes.
//
// _Requirements: 25.4_

export interface LiveRegionProps {
  /** The text to announce. Change this value to trigger an announcement. */
  message?: string;
  /**
   * Politeness level. 'polite' (default) waits for a pause; 'assertive'
   * interrupts. Loading→result transitions use 'polite' per the design.
   */
  politeness?: 'polite' | 'assertive';
  /** Render visibly instead of screen-reader-only (rarely needed). */
  visible?: boolean;
}

/** Visually-hidden utility (sr-only equivalent) kept local to avoid extra deps. */
const srOnly =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]';

/**
 * Announce dynamic updates politely to assistive technology.
 *
 * @example
 * <LiveRegion message={status === 'loading' ? 'Menyemak…' : resultSummary} />
 */
export function LiveRegion({
  message = '',
  politeness = 'polite',
  visible = false,
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      role="status"
      className={visible ? '' : srOnly}
    >
      {message}
    </div>
  );
}

export default LiveRegion;
