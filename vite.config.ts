import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/ + https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // distinct from the mobile/other dev servers
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing vendor code into cacheable chunks so the entry chunk
        // stays pure app code; route pages are code-split via React.lazy (one chunk each).
        // Function form so MUI's TRANSITIVE deps (@mui/system, @popperjs, react-transition-
        // group, …) land in the mui chunk too — a bare package-name list misses them.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('@mui') ||
            id.includes('@emotion') ||
            id.includes('@popperjs') ||
            id.includes('react-transition-group')
          ) {
            return 'mui';
          }
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('react-redux') ||
            id.includes('redux') ||
            id.includes('/scheduler/')
          ) {
            return 'react';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
