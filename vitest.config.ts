import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/i18n*.ts', 'src/lib/http-agent.ts'],
    },
  },
  define: {
    'import.meta.env.DATA_DIR': JSON.stringify('./data/test'),
    'import.meta.env.ADMIN_PASSWORD': JSON.stringify('test-password'),
    'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify(''),
    'import.meta.env.TURNSTILE_SECRET_KEY': JSON.stringify(''),
    'import.meta.env.PROD': JSON.stringify(false),
  },
});
