import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/ + https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // distinct from the mobile/other dev servers
  },
  build: {
    // The vendor chunk is ~585 kB raw / ~184 kB gzipped BY DESIGN (see manualChunks below), so
    // it would trip Vite's default 500 kB notice on every build. Raise the bar rather than let
    // a known-and-accepted size drown the warnings that actually matter — one of them is now
    // load-bearing (onwarn).
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // A chunk CYCLE is not a style nit — it ships a blank page. Rollup reports it as a mere
      // warning and still exits 0, so a broken bundle sails through CI and gets published.
      // That is exactly how the "Cannot set properties of undefined (setting 'Activity')"
      // outage happened: React's CJS exports shell was hoisted into one chunk while the factory
      // that populates it landed in another, so whichever chunk executed first read `undefined`.
      // ('Activity' is just the first property React 19 assigns to its exports — the messenger,
      // not the cause.) Make it fatal.
      onwarn(warning, defaultHandler) {
        if (warning.code === 'CIRCULAR_CHUNK') {
          throw new Error(
            `${warning.message}\n` +
              'A circular chunk ships a blank page: in an ESM cycle one chunk executes while ' +
              "the other's hoisted bindings are still undefined. Split node_modules further " +
              'only if you can show the chunk graph stays one-directional.',
          );
        }
        defaultHandler(warning);
      },
      output: {
        // ONE bucket for all of node_modules. The entry chunk stays pure app code (~11 kB), and
        // route pages are code-split via React.lazy — which was the whole point of splitting.
        //
        // WHY NOT ALSO SPLIT MUI OUT. A chunk cycle is a property of the dependency GRAPH, but
        // every `id.includes(...)` rule partitions by NAME, and the two stop agreeing the moment
        // a package's name no longer predicts its position in the graph. That has now bitten this
        // repo once and was measured a second time:
        //
        //   react/mui/vendor  ->  `use-sync-external-store` (pulled in by react-redux, and it
        //       peer-depends on react) matched none of the react patterns, so it fell into the
        //       catch-all "vendor" while react-redux sat in "react":  vendor -> react -> vendor.
        //       That is the bug that blanked the console.
        //
        //   mui/vendor        ->  acyclic ONLY while nothing outside the @mui/@emotion/@popperjs/
        //       react-transition-group namespaces imports MUI. Verified by building it: adding one
        //       ordinary MUI-wrapping package (notistack, mui-tel-input, material-react-table) puts
        //       that package in "vendor" while it imports "mui", and MUI already imports vendor
        //       packages — so  mui -> vendor -> mui.  A routine `npm i` reintroduces the outage.
        //
        // A single chunk cannot cycle with itself, so this rule needs no re-verification when
        // package.json changes. The cost is only intra-vendor cache granularity: bumping MUI alone
        // now re-downloads React too. That is the rare event; the frequent one — an app-only deploy
        // — still busts just the ~11 kB entry chunk, and total bundle size is within 0.2% either way.
        //
        // NOTE: any manualChunks rule over node_modules also forces DYNAMICALLY imported deps into
        // this eager chunk. If a heavy library is ever used by exactly one lazy route, return
        // undefined for it here so it stays in that route's chunk instead of the initial payload.
        manualChunks(id) {
          return id.includes('node_modules') ? 'vendor' : undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // MUI dialog/select/portal render tests are heavy; the default 5s test timeout is too
    // tight when many files run in parallel on a small box (CPU contention inflates each
    // test's wall-clock). Give generous headroom.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
