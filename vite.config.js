import { svelte } from '@sveltejs/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/lib'),
      '$server': resolve(__dirname, 'src/server'),
      '$routes': resolve(__dirname, 'src/routes')
    }
  }
});
