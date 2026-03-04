import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['scripts/__tests__/**/*.test.ts'],
  },
});
