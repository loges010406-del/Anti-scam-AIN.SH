import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest configuration lives in its own file (not vite.config.ts) on purpose.
// Merging it into vite.config.ts makes `tsc` resolve two different Vite type
// identities (the app's Vite 6 and the Vite 5 that Vitest 2.x depends on),
// which produces a dual-Vite type conflict during `npm run build`. Keeping the
// test config here isolates Vitest's toolchain from the app's typecheck.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
