// src/components/common/DemoBadge.tsx
//
// A clear, honest "DEMO" marker. It is used wherever the app shows sample or
// illustrative data that is not real analysis — the Community Scam Radar, sample
// family-alert content, and the screenshot forensics fallback (Requirements
// 29.2, 19.1, 17.5, 14.2). This keeps the product trustworthy: demo content is
// never presented as real findings.
//
// Accessibility: the badge always conveys meaning three ways — an icon, a text
// label, and colour — never colour alone (Requirement 25.1). The icon is
// decorative; the visible "DEMO" text (plus an optional sr-only description)
// carries the meaning for assistive tech.
//
// _Requirements: 29.2, 25.1, 14.2, 17.5, 19.1_

import { FlaskConical } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';

export interface DemoBadgeProps {
  /**
   * Visible label text. Defaults to 'DEMO'. UI copy will later be supplied via
   * i18n (task 5.2); callers may pass a localised label in the meantime.
   */
  label?: string;
  /**
   * Optional extra context shown beside the label (e.g. a short note). Keep
   * short; longer explanations belong in surrounding copy.
   */
  children?: ReactNode;
  /**
   * Screen-reader-only clarification appended after the label, for cases where
   * "DEMO" alone is not descriptive enough.
   */
  srDescription?: string;
  className?: string;
}

const srOnly =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]';

/**
 * Badge marking content as demonstration-only.
 *
 * @example
 * <DemoBadge />
 * <DemoBadge srDescription="Sample data, not real analysis" />
 */
export function DemoBadge({
  label = 'DEMO',
  children,
  srDescription,
  className = '',
}: DemoBadgeProps) {
  const classes = [
    'inline-flex items-center gap-1.5 rounded-card px-2.5 py-1',
    'text-sm font-semibold uppercase tracking-wide',
    // Colour is one of three signals (icon + text + colour), not the only one.
    'bg-risk-suspicious/15 text-risk-suspicious border border-risk-suspicious/40',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {/* Icon is decorative; the "DEMO" text label carries the meaning. */}
      <Icon icon={FlaskConical} size={16} />
      <span>{label}</span>
      {srDescription ? <span className={srOnly}>{srDescription}</span> : null}
      {children ? (
        <span className="font-normal normal-case tracking-normal text-navy">
          {children}
        </span>
      ) : null}
    </span>
  );
}

export default DemoBadge;
