import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  security: { allowedDomains: [
    { hostname: 'localhost', protocol: 'http' },
    { hostname: '127.0.0.1', protocol: 'http' },
    { hostname: '[::1]', protocol: 'http' },
    { hostname: '10.*.*.*', protocol: 'http' },
    { hostname: '192.168.*.*', protocol: 'http' },
    ...Array.from({ length: 16 }, (_, i) => ({ hostname: `172.${16 + i}.*.*`, protocol: 'http' })),
  ] },
  vite: { plugins: [tailwindcss()] },
  server: { host: '127.0.0.1', port: 4321 },
});
