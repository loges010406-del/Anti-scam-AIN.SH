import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Trivial smoke test: confirms the Vitest runner, jsdom environment, and the
// @testing-library/jest-dom matchers are all wired up correctly. If this fails,
// the test toolchain itself is misconfigured.
describe('test environment smoke test', () => {
  it('runs basic assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('provides a jsdom DOM', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('renders a React element and uses jest-dom matchers', () => {
    render(<p>Semak Dulu</p>);
    expect(screen.getByText('Semak Dulu')).toBeInTheDocument();
  });
});
