// src/components/common/LanguageSwitcher.tsx
//
// A small, accessible control for switching the UI language (Requirement 22.2).
// Bahasa Melayu ('ms') is the default; English ('en') is the alternate. The
// registry is written to be extensible (zh/ta) to match the i18n design.
//
// WIRING NOTE (tasks 5.2 / 6.3): The i18n context (I18nProvider / useI18n) does
// not exist yet. This component is intentionally presentational and controlled
// via props: the parent passes the current `language` and an `onChange`
// callback. When I18nProvider lands, a thin container can read `language` and
// `setLanguage` from `useI18n()` and pass them straight through here — no change
// to this component is required.
//
// Accessibility: rendered as a radiogroup of native buttons so it is fully
// keyboard-operable with a visible focus ring (Requirements 25.2, 25.3). The
// active language is marked with `aria-checked`, conveying state beyond colour
// alone (Requirement 25.1).
//
// _Requirements: 22.2, 25.1, 25.4_

import { Globe } from 'lucide-react';
import type { Language } from '../../types';
import { Icon } from './Icon';

/** A selectable language option: value plus the label shown on its button. */
export interface LanguageOption {
  value: Language;
  /** Short display label, e.g. 'BM' or 'EN'. */
  label: string;
}

/**
 * Default option set. Labels are intentionally language-agnostic abbreviations
 * (not translatable UI strings), so they are safe to ship before i18n wiring.
 */
export const DEFAULT_LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'ms', label: 'BM' },
  { value: 'en', label: 'EN' },
];

export interface LanguageSwitcherProps {
  /** Currently selected language. */
  language: Language;
  /** Called with the newly chosen language. Persistence is the parent's job. */
  onChange: (language: Language) => void;
  /** Override the available options (e.g. to add zh/ta later). */
  options?: LanguageOption[];
  /** Accessible group label. A localised label can be passed once i18n exists. */
  groupLabel?: string;
  className?: string;
}

/**
 * Controlled language switcher.
 *
 * @example
 * <LanguageSwitcher language={lang} onChange={setLang} />
 */
export function LanguageSwitcher({
  language,
  onChange,
  options = DEFAULT_LANGUAGE_OPTIONS,
  groupLabel = 'Language',
  className = '',
}: LanguageSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className={['inline-flex items-center gap-1', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon icon={Globe} size={18} className="text-navy-mid" aria-label={groupLabel} />
      {options.map((option) => {
        const selected = option.value === language;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              // Guard against redundant updates; parent wires to I18nProvider later.
              if (!selected) onChange(option.value);
            }}
            className={[
              'min-w-tap min-h-tap rounded-card px-3 py-1 text-base font-medium',
              'outline-none transition-colors duration-150',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              selected
                ? 'bg-accent text-white'
                : 'bg-transparent text-navy hover:bg-surface',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
