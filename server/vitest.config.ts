import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

// Load .env.test into the test process (DATABASE_URL points at a separate test database).
const testEnv = Object.fromEntries(
  readFileSync('.env.test', 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    }),
);

// Global setup runs in this process, so it needs the variables too.
Object.assign(process.env, testEnv);

export default defineConfig({
  test: {
    environment: 'node',
    env: testEnv,
    globalSetup: './tests/global-setup.ts',
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 15000,
  },
});
