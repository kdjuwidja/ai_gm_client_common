import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// A library build: one ES module in dist/, React left to the client that
// installs the package (a peer dependency), so every client runs one copy of
// it. `npm run build` (and `prepare`, which npm runs when it installs the
// package from git) writes dist/; vitest reads the same config for its tests.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.js", import.meta.url)),
      formats: ["es"],
      fileName: "index",
    },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.{js,jsx}"],
    setupFiles: ["tests/setup.js"],
    restoreMocks: true,
  },
});
