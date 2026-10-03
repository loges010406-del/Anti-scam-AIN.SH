// src/components/common/index.ts
//
// Barrel export for the shared, presentational common components so other
// modules can import from a single, stable path:
//   import { Button, Icon, LiveRegion, LanguageSwitcher, DemoBadge } from '@/components/common';
//
// _Requirements: 24.2, 25.1, 25.4, 25.6, 22.2, 29.2_

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Icon } from './Icon';
export type { IconProps } from './Icon';

export { LiveRegion } from './LiveRegion';
export type { LiveRegionProps } from './LiveRegion';

export {
  LanguageSwitcher,
  DEFAULT_LANGUAGE_OPTIONS,
} from './LanguageSwitcher';
export type { LanguageSwitcherProps, LanguageOption } from './LanguageSwitcher';

export { DemoBadge } from './DemoBadge';
export type { DemoBadgeProps } from './DemoBadge';

export { ErrorBoundary } from './ErrorBoundary';

export { PageHero } from './PageHero';
export type { PageHeroProps, HeroTone } from './PageHero';
