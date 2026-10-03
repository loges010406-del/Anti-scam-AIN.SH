// Global test setup. Registers @testing-library/jest-dom custom matchers
// (toBeInTheDocument, toHaveTextContent, etc.) for every test file and clears
// the DOM between tests so renders don't leak across cases.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
