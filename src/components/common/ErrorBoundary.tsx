// src/components/common/ErrorBoundary.tsx
//
// Top-level React Error Boundary (tasks.md 6.3). Error boundaries must be class
// components — this is the only class component in the app. It catches render
// errors anywhere in the routed tree so the app never shows a blank white
// screen or an uncaught crash (R30.1). The fallback offers a clear way back to
// the Check home route, which is the app's safe default surface.
//
// The fallback copy is kept self-contained (BM-first) rather than reading from
// i18n: if the i18n provider itself were the thing that threw, calling `t()`
// inside the fallback could throw again. Plain strings keep the recovery path
// bullet-proof.
//
// _Requirements: 23.4, 30.1_

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Fallback copy. Self-contained so recovery never depends on other systems. */
const FALLBACK_COPY = {
  title: 'Ada masalah',
  body: 'Maaf, sesuatu tidak kena. Sila kembali ke halaman Semak dan cuba lagi.',
  action: 'Kembali ke Semak',
} as const;

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    // A render error occurred somewhere below; switch to the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the error to the console for debugging. No external reporting:
    // the app has no backend and must not transmit user data.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  private handleReturnToCheck = (): void => {
    // Hard navigation to the home/Check route. We avoid the router here on
    // purpose: the router tree may be the thing that threw, so a full-document
    // navigation is the most reliable way back to a known-good surface.
    window.location.assign('/');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center"
        >
          <h1 className="text-2xl font-bold text-navy">
            {FALLBACK_COPY.title}
          </h1>
          <p className="text-base text-navy-mid">{FALLBACK_COPY.body}</p>
          <button
            type="button"
            onClick={this.handleReturnToCheck}
            className="min-h-btn min-w-tap rounded-card bg-accent px-6 py-3 text-base font-medium text-white outline-none transition-colors duration-150 hover:bg-navy-mid focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {FALLBACK_COPY.action}
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
