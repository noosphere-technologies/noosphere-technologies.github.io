// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://noosphere.tech',
  integrations: [mdx(), sitemap(), react()],
  output: 'server',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
});