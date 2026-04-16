import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  define: {
    // Stub import.meta.env for Astro modules used in tests
    'import.meta.env.DATA_DIR': JSON.stringify('./data/test'),
    'import.meta.env.ADMIN_PASSWORD': JSON.stringify('test-password'),
    'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(''),
    'import.meta.env.TURNSTILE_SECRET_KEY': JSON.stringify(''),
    'import.meta.env.PROD': JSON.stringify(false),
  },
});
