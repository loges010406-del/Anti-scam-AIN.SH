// src/components/common/Icon.tsx
//
// A thin wrapper around lucide-react icons. Centralising icon usage keeps the
// visual language consistent (stroke width, default sizing, aria handling) and
// gives the rest of the app a single, dependency-light import surface.
//
// Icons are decorative by default (aria-hidden) because our accessible pattern
// is always "icon + text + colour" — the adjacent text carries the meaning
// (Requirement 25.1). Pass an `aria-label` (or `title`) when an icon must stand
// alone, which flips it to an img role for assistive tech.
//
// _Requirements: 25.1, 25.4_

import type { LucideIcon, LucideProps } from 'lucide-react';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** The lucide-react icon component to render, e.g. `ShieldCheck`. */
  icon: LucideIcon;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech as an
   * image; when omitted the icon is decorative (aria-hidden) and the adjacent
   * text label conveys meaning.
   */
  'aria-label'?: string;
}

/**
 * Render a lucide-react icon with consistent defaults.
 *
 * @example
 * <Icon icon={ShieldCheck} className="text-risk-safe" />
 * <Icon icon={Globe} aria-label="Change language" />
 */
export function Icon({
  icon: LucideGlyph,
  size = 20,
  strokeWidth = 2,
  'aria-label': ariaLabel,
  ...rest
}: IconProps) {
  const decorative = ariaLabel === undefined;
  return (
    <LucideGlyph
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={decorative || undefined}
      aria-label={ariaLabel}
      role={decorative ? undefined : 'img'}
      focusable="false"
      {...rest}
    />
  );
}

export default Icon;
