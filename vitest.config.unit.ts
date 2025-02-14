import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ["**/*.spec.ts", "!**/*.e2e.spec.ts"],
    globals: true,
    root: './',
    setupFiles: ["./src/test/setup-unit.ts"],
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});