// src/components/common/Button.tsx
//
// The shared button primitive for Semak Dulu. It encodes the accessibility
// sizing contract from the design: primary buttons are at least 48px tall
// (minHeight.btn token) and every button meets the 44px minimum tap target
// (minWidth.tap token). A visible :focus-visible ring is always present and is
// never removed (Requirement 25.3).
//
// The component is purely presentational: it renders a native <button> so it is
// keyboard-operable by default (Requirement 25.2) and leaves click handling,
// labels, and content to the caller.
//
// _Requirements: 24.2 (48px primary), 25.6 (44px tap targets), 25.1/25.3 (visible focus)_

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Size. `lg` enforces the 48px primary-button height token. Defaults to `md`. */
  size?: ButtonSize;
  /** Stretch to the full width of the container. */
  fullWidth?: boolean;
  /** Optional leading element (e.g. an <Icon />). */
  leadingIcon?: ReactNode;
  /** Optional trailing element. */
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

const base =
  // Layout + typography
  'inline-flex items-center justify-center gap-2 rounded-card font-medium ' +
  // Tap target: never smaller than 44px in either dimension (R25.6)
  'min-w-tap min-h-tap px-5 py-2 ' +
  // Motion + state
  'transition-colors duration-150 select-none ' +
  // Visible focus ring, never removed (R25.3)
  'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  // Disabled affordance
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-navy-mid',
  secondary: 'bg-surface text-navy hover:bg-white border border-navy-mid/20',
  ghost: 'bg-transparent text-navy hover:bg-surface',
  danger: 'bg-risk-scam text-white hover:bg-risk-scam/90',
};

const sizes: Record<ButtonSize, string> = {
  // md still satisfies the 44px tap target via min-h-tap on the base class.
  md: 'text-base',
  // lg enforces the 48px primary-button height token (R24.2).
  lg: 'min-h-btn text-base',
};

/**
 * Accessible button primitive.
 *
 * @example
 * <Button variant="primary" size="lg" onClick={run}>Semak Sekarang</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    base,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

export default Button;

