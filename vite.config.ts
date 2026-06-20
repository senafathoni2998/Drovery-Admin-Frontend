import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/ + https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // distinct from the mobile/other dev servers
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
