import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// Test runner configuration (Vitest) is added in a later task (tasks.md 1.3).
export default defineConfig({
  plugins: [react()],
});
