/**
 * useAnalysis — orchestrates a single Check analysis (offline, fallback-only).
 *
 * Speedrun scope: this wires the Check feature end-to-end against the
 * deterministic `fallbackAnalyzer` with NO AI/backend. The AI-first path
 * (tasks 17.x) can later be layered in front of the fallback call without
 * changing this hook''s public contract.
 *
 * State is a discriminated union so the UI renders exactly one of
 * idle / loading / success / error. Empty or whitespace-only input is rejected
 * before any loading state (R5.5). In URL mode an invalid link is rejected
 * (R26.5). Input is truncated to the max length (R26.3). Results are ephemeral
 * and never persisted (R26.1).
 *
 * _Requirements: 2.1, 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 26.1, 26.3, 30.1, 30.3_
 */

import { useCallback, useState } from 'react';
import type { AnalysisResult, InputMode, Language } from '../types';
import { analyze, analyzeImage, analyzePhone } from '../services/fallbackAnalyzer';
import { truncate } from '../utils/text';
import { isValidUrl } from '../utils/url';

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  result?: AnalysisResult;
  /** i18n key for the error message, so the UI stays localisation-driven. */
  errorKey?: string;
}

export interface UseAnalysis {
  state: AnalysisState;
  /** Run analysis for the given input + mode. */
  run: (input: string, mode: InputMode) => void;
  /** Reset back to idle (clears any result/error). */
  reset: () => void;
}

const IDLE: AnalysisState = { status: 'idle' };

export function useAnalysis(language: Language): UseAnalysis {
  const [state, setState] = useState<AnalysisState>(IDLE);

  const reset = useCallback(() => setState(IDLE), []);

  const run = useCallback(
    (input: string, mode: InputMode) => {
      const raw = typeof input === 'string' ? input : '';

      // Reject empty / whitespace-only input before any loading state (R5.5).
      if (raw.trim().length === 0) {
        setState({ status: 'error', errorKey: 'check.emptyInputPrompt' });
        return;
      }

      // In text/link mode, if the whole input looks like a single URL, validate
      // it (R26.5). We only hard-reject when the input is a lone token that is
      // clearly meant to be a URL (contains no spaces and starts with http).
      const trimmed = raw.trim();
      if (
        mode === 'text' &&
        /^\S+$/.test(trimmed) &&
        /^https?:\/\//i.test(trimmed) &&
        !isValidUrl(trimmed)
      ) {
        setState({ status: 'error', errorKey: 'check.invalidUrl' });
        return;
      }

      setState({ status: 'loading' });

      // Defer to a microtask so the loading state paints before the (sync)
      // analysis runs; keeps the UI responsive and testable.
      try {
        const bounded = truncate(trimmed);
        const result =
          mode === 'screenshot'
            ? analyzeImage(language)
            : mode === 'phone'
              ? analyzePhone(bounded, language)
              : analyze(bounded, language);
        setState({ status: 'success', result });
      } catch {
        setState({ status: 'error', errorKey: 'check.errorRetry' });
      }
    },
    [language],
  );

  return { state, run, reset };
}

export default useAnalysis;

