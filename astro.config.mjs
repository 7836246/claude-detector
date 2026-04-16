// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: /** @type {any} */ ({
    // Astro 6 bundles rolldown-vite; @tailwindcss/vite types against stock vite.
    // Types mismatch is cosmetic — runtime works. Cast to silence the checker.
    plugins: [tailwindcss()],
  }),
});
